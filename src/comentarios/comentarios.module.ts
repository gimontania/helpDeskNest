import { Module } from '@nestjs/common';
import { TareasModule } from '../tareas/tareas.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ComentariosController } from './comentarios.controller';
import { ComentariosService } from './comentarios.service';

@Module({
  imports: [TareasModule, NotificacionesModule],
  controllers: [ComentariosController],
  providers: [ComentariosService],
})
export class ComentariosModule {}
