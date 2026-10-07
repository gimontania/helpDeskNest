import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesGateway } from './notificaciones.gateway';
import { NotificacionesService } from './notificaciones.services';

@Module({
  imports: [AuthModule],
  controllers: [NotificacionesController],
  providers: [NotificacionesGateway, NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
