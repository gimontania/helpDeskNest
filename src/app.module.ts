import 'dotenv/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CategoriasModule } from './categorias/categorias.module';
import { TareasModule } from './tareas/tareas.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    CategoriasModule,
    TareasModule,
    ComentariosModule,
    NotificacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
