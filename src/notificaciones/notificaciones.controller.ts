import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { NotificacionesService } from './notificaciones.services';
import { TipoNotificacion } from './notificaciones.types';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post('prueba')
  enviarPrueba(@Req() req: Request) {
    this.notificacionesService.enviar([req.user!.sub], {
      tipo: TipoNotificacion.PRUEBA,
      mensaje: 'Notificación de prueba',
    });
    return { enviado: true };
  }
}
