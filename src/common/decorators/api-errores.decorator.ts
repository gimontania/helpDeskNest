import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';

export const ApiProtegido = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiBadRequestResponse({
      type: ErrorResponseDto,
      description: 'Datos inválidos',
    }),
    ApiUnauthorizedResponse({
      type: ErrorResponseDto,
      description: 'Sin token o token inválido',
    }),
    ApiForbiddenResponse({
      type: ErrorResponseDto,
      description: 'El rol no tiene permiso',
    }),
    ApiNotFoundResponse({
      type: ErrorResponseDto,
      description: 'Recurso no encontrado',
    }),
  );
