import 'dotenv/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CategoriasModule } from './categorias/categorias.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    CategoriasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
