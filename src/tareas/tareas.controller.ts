import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { TareasService } from './tareas.service';
import { CrearTareaDto } from './dto/crear-tarea.dto';
import { RolUsuario } from '../generated/prisma/enums.js';

interface RequestConUsuario extends Request {
  user: {
    sub: string;
    email: string;
    rol: RolUsuario;
  };
}

@Controller('tareas')
@UseGuards(JwtAuthGuard)
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Post()
  crear(
    @Body() dto: CrearTareaDto,
    @Req() req: RequestConUsuario,
  ) {
    return this.tareasService.crear(dto, req.user.sub);
  }

  @Get()
  listarTareas(@Req() req: RequestConUsuario) {
    return this.tareasService.listarTareas(
      req.user.sub,
      req.user.rol,
    );
  }

  @Get(':id')
  obtenerTarea(
    @Param('id') id: string,
    @Req() req: RequestConUsuario,
  ) {
    return this.tareasService.obtenerTarea(
      id,
      req.user.sub,
      req.user.rol,
    );
  }
}