import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { TareasService } from './tareas.service';
import { CrearTareaDto } from './dto/crear-tarea.dto';
import { RolUsuario } from '../generated/prisma/enums.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';

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
  crear(@Body() dto: CrearTareaDto, @Req() req: RequestConUsuario) {
    return this.tareasService.crear(dto, req.user.sub);
  }

  @Get()
  listarTareas(@Req() req: RequestConUsuario) {
    return this.tareasService.listarTareas(req.user.sub, req.user.rol);
  }

  @Get('metricas')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.AGENTE)
  obtenerMetricas() {
    return this.tareasService.obtenerMetricas();
  }

  @Get(':id')
  obtenerTarea(@Param('id') id: string, @Req() req: RequestConUsuario) {
    return this.tareasService.obtenerTarea(id, req.user.sub, req.user.rol);
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.AGENTE)
  cambiarEstado(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CambiarEstadoDto,
    @Req() req: RequestConUsuario,
  ) {
    return this.tareasService.cambiarEstado(id, dto.estado, req.user.rol);
  }
}
