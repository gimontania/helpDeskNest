import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

const ERRORES_PRISMA: Record<
  string,
  { status: HttpStatus; error: string; message: string }
> = {
  P2002: {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
    message: 'Ya existe un registro con esos datos',
  },
  P2003: {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
    message: 'La operación afecta a registros relacionados',
  },
  P2023: {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
    message: 'Identificador con formato inválido',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
    message: 'Recurso no encontrado',
  },
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'Error interno del servidor';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        if (Array.isArray(body.message)) {
          details = body.message;
          message = 'Error de validación';
        } else if (body.message) {
          message = body.message;
        }

        if (body.error) {
          error = body.error;
        }
      }
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      ERRORES_PRISMA[exception.code]
    ) {
      ({ status, error, message } = ERRORES_PRISMA[exception.code]);
    } else if (esJsonMalFormado(exception)) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = 'El cuerpo de la petición no es un JSON válido';
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

function esJsonMalFormado(exception: unknown): boolean {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    (exception as { type?: string }).type === 'entity.parse.failed'
  );
}
