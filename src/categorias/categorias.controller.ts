import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
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
  obtenerPorId(@Param('id') id: string) {
    return this.categoriasService.obtenerPorId(id);
  }
}