import { Injectable, Logger } from '@nestjs/common';
import { NotificacionesGateway } from './notificaciones.gateway';
import {
  EVENTO_NOTIFICACION,
  Notificacion,
  salaDeUsuario,
} from './notificaciones.types';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(private readonly gateway: NotificacionesGateway) {}

  enviar(
    destinatarios: Array<string | null | undefined>,
    notificacion: Notificacion,
    excluirUsuarioId?: string,
  ): void {
    try {
      const ids = [
        ...new Set(
          destinatarios.filter(
            (id): id is string => !!id && id !== excluirUsuarioId,
          ),
        ),
      ];

      if (ids.length === 0) {
        return;
      }

      this.gateway.server.to(ids.map(salaDeUsuario)).emit(EVENTO_NOTIFICACION, {
        ...notificacion,
        fecha: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar la notificación ${notificacion.tipo}`,
        (error as Error).stack,
      );
    }
  }
}
