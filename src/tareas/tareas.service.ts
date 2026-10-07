import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoTarea, RolUsuario } from '../generated/prisma/enums.js';
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

  async listarTareas(creadorId: string, rol: RolUsuario) {
    const puedeVerTodas =
      rol === RolUsuario.ADMIN || rol === RolUsuario.AGENTE;

    return this.prisma.tarea.findMany({
      where: puedeVerTodas
        ? undefined
        : {
            creadorId,
          },
      include: {
        categoria: true,
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        agente: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });
  }

  async obtenerTarea(
    id: string,
    creadorId: string,
    rol: RolUsuario,
  ) {
    const puedeVerTodas =
      rol === RolUsuario.ADMIN || rol === RolUsuario.AGENTE;

    const tarea = await this.prisma.tarea.findFirst({
      where: puedeVerTodas
        ? { id }
        : {
            id,
            creadorId,
          },
      include: {
        categoria: true,
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
        agente: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    });

    if (!tarea) {
      throw new NotFoundException('Ticket no encontrado');
    }

    return tarea;
  }
}