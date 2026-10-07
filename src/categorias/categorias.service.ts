import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';



@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.categoria.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async obtenerPorId(id: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return categoria;
  }

  async crear(dto: CrearCategoriaDto) {
    try {
      return await this.prisma.categoria.create({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una categoría con ese nombre',
        );
      }

      throw error;
    }
  }

  async actualizar(id: string, dto: ActualizarCategoriaDto) {
    await this.obtenerPorId(id);

    try {
      return await this.prisma.categoria.update({
        where: { id },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre }),
          ...(dto.descripcion !== undefined && {
            descripcion: dto.descripcion,
          }),
        },
      });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Ya existe una categoría con ese nombre',
      );
    }

    throw error;
  }
}

async eliminar(id: string) {
  await this.obtenerPorId(id);

  const ticketsAsociados = await this.prisma.tarea.count({
    where: {
      categoriaId: id,
    },
  });

  if (ticketsAsociados > 0) {
    throw new ConflictException(
    'No se puede eliminar una categoría que tiene tickets asociados',
  );
  }

  return this.prisma.categoria.delete({
    where: { id },
  });
}
}