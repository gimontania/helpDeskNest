import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RolUsuario } from '../generated/prisma/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
import { CategoriasService } from './categorias.service';

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  listar() {
    return this.categoriasService.listar();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.AGENTE)
  crear(@Body() dto: CrearCategoriaDto) {
    return this.categoriasService.crear(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.AGENTE)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarCategoriaDto,
  ) {
    return this.categoriasService.actualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.AGENTE)
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriasService.eliminar(id);
  }
}
