import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoTarea, RolUsuario } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service';
import { CrearTareaDto } from './dto/crear-tarea.dto';

const SIGUIENTE_ESTADO: Record<EstadoTarea, EstadoTarea | null> = {
  ABIERTO: EstadoTarea.EN_PROCESO,
  EN_PROCESO: EstadoTarea.RESUELTO,
  RESUELTO: EstadoTarea.CERRADO,
  CERRADO: null,
};

@Injectable()
export class TareasService {
  constructor(private readonly prisma: PrismaService) {}

  async cambiarEstado(id: string, estado: EstadoTarea, rol: RolUsuario) {
    if (rol !== RolUsuario.ADMIN && rol !== RolUsuario.AGENTE) {
      throw new ForbiddenException(
        'Solo ADMIN y AGENTE pueden cambiar el estado',
      );
    }

    const tarea = await this.prisma.tarea.findUnique({
      where: { id },
      select: { estado: true },
    });
    if (!tarea) throw new NotFoundException('Ticket no encontrado');

    const siguiente = SIGUIENTE_ESTADO[tarea.estado];
    if (siguiente !== estado) {
      throw new ConflictException(
        `Transición no permitida: ${tarea.estado} → ${estado}. ` +
          (siguiente
            ? `El siguiente estado permitido es ${siguiente}.`
            : 'Un ticket cerrado no puede cambiar de estado.'),
      );
    }

    // La condición evita sobrescribir un cambio concurrente del estado.
    const [actualizada] = await this.prisma.tarea.updateManyAndReturn({
      where: { id, estado: tarea.estado },
      data: { estado },
    });
    if (!actualizada) {
      throw new ConflictException(
        'El ticket cambió mientras se procesaba la solicitud. Consulta su estado actual.',
      );
    }
    return actualizada;
  }

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
    const puedeVerTodas = rol === RolUsuario.ADMIN || rol === RolUsuario.AGENTE;

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

  async obtenerMetricas() {
    const [total, agrupadoPorEstado, categorias] = await Promise.all([
      this.prisma.tarea.count(),

      this.prisma.tarea.groupBy({
        by: ['estado'],
        _count: { _all: true },
      }),

      this.prisma.categoria.findMany({
        select: {
          id: true,
          nombre: true,
          _count: { select: { tareas: true } },
        },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    const cantidadPorEstado = new Map(
      agrupadoPorEstado.map((grupo) => [grupo.estado, grupo._count._all]),
    );

    return {
      total,
      porEstado: Object.values(EstadoTarea).map((estado) => ({
        estado,
        cantidad: cantidadPorEstado.get(estado) ?? 0,
      })),
      porCategoria: categorias.map((categoria) => ({
        categoriaId: categoria.id,
        nombre: categoria.nombre,
        cantidad: categoria._count.tareas,
      })),
    };
  }

  async obtenerTarea(id: string, creadorId: string, rol: RolUsuario) {
    const puedeVerTodas = rol === RolUsuario.ADMIN || rol === RolUsuario.AGENTE;

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
