import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolUsuario } from '../generated/prisma/enums.js';
import { ComentariosService } from './comentarios.service';

interface RequestConUsuario extends Request {
  user: {
    sub: string;
    email: string;
    rol: RolUsuario;
  };
}

@Controller('tareas/:tareaId/comentarios')
@UseGuards(JwtAuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Get()
  listar(
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Req() req: RequestConUsuario,
  ) {
    return this.comentariosService.listarPorTarea(
      tareaId,
      req.user.sub,
      req.user.rol,
    );
  }
}
