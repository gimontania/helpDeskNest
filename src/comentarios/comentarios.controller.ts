import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolUsuario } from '../generated/prisma/enums.js';
import { ComentariosService } from './comentarios.service';
import { CrearComentarioDto } from './dto/crear-comentario.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiProtegido } from '../common/decorators/api-errores.decorator';

interface RequestConUsuario extends Request {
  user: {
    sub: string;
    email: string;
    rol: RolUsuario;
  };
}

@ApiTags('Comentarios')
@ApiProtegido()
@Controller('tareas/:tareaId/comentarios')
@UseGuards(JwtAuthGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  @Post()
  crear(
    @Param('tareaId', ParseUUIDPipe) tareaId: string,
    @Body() dto: CrearComentarioDto,
    @Req() req: RequestConUsuario,
  ) {
    return this.comentariosService.crear(
      tareaId,
      dto,
      req.user.sub,
      req.user.rol,
    );
  }

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
