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

interface RequestConUsuario extends Request {
  user: {
    sub: string;
    email: string;
    rol: string;
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
  listarMisTareas(@Req() req: RequestConUsuario) {
    return this.tareasService.listarMisTareas(req.user.sub);
  }

  @Get(':id')
  obtenerMiTarea(
    @Param('id') id: string,
    @Req() req: RequestConUsuario,
  ) {
    return this.tareasService.obtenerMiTarea(id, req.user.sub);
  }
}