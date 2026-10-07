import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoTarea } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service';
import { CrearTareaDto } from './dto/crear-tarea.dto';

@Injectable()
export class TareasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearTareaDto, creadorId: string) {
    const categoria = await this.prisma.categoria.findUnique({
      where: {
        id: dto.categoriaId,
      },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.tarea.create({
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        prioridad: dto.prioridad,
        categoriaId: dto.categoriaId,
        creadorId,
        estado: EstadoTarea.ABIERTO,
      },
    });
  }

  async listarMisTareas(creadorId: string) {
    return this.prisma.tarea.findMany({
      where: {
        creadorId,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  async obtenerMiTarea(id: string, creadorId: string) {
    const tarea = await this.prisma.tarea.findFirst({
      where: {
        id,
        creadorId,
      },
    });

    if (!tarea) {
      throw new NotFoundException('Ticket no encontrado');
    }

    return tarea;
  }
}