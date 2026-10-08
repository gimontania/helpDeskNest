import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../generated/prisma/enums';
import { ListarUsuariosDto } from './dto/listar-usuarios.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiProtegido } from '../common/decorators/api-errores.decorator';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Usuarios')
@ApiProtegido()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.AGENTE)
  listar(@Query() query: ListarUsuariosDto) {
    return this.usuariosService.listar(query.rol);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear(dto);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async obtenerPerfil(@Req() req: Request) {
    const usuario = req.user as {
      sub: string;
      email: string;
      rol: string;
    };

    return this.usuariosService.obtenerPerfil(usuario.sub);
  }
}
