import { Injectable } from '@nestjs/common';
import { RolUsuario } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service';
import { TareasService } from '../tareas/tareas.service';
import { CrearComentarioDto } from './dto/crear-comentario.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.services';
import { TipoNotificacion } from '../notificaciones/notificaciones.types.js';


@Injectable()
export class ComentariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tareasService: TareasService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async crear(
  tareaId: string,
  dto: CrearComentarioDto,
  usuarioId: string,
  rol: RolUsuario,
) {
  const tarea = await this.tareasService.obtenerTarea(
    tareaId,
    usuarioId,
    rol,
  );

  const comentario = await this.prisma.comentario.create({
    data: {
      tareaId,
      contenido: dto.contenido,
      autorId: usuarioId,
    },
    select: {
      id: true,
      tareaId: true,
      contenido: true,
      creadoEn: true,
      autor: {
        select: {
          id: true,
          nombre: true,
          rol: true,
        },
      },
    },
  });

  try {
    this.notificacionesService.enviar(
      [tarea.creadorId, tarea.agenteId],
      {
        tipo: TipoNotificacion.COMENTARIO_NUEVO,
        mensaje: `Nuevo comentario en el ticket "${tarea.titulo}"`,
        tareaId: tarea.id,
        datos: {
          comentarioId: comentario.id,
          autorId: usuarioId,
        },
      },
      usuarioId,
    );
  } catch {
    // El comentario ya fue guardado; una falla de notificación no lo elimina
  }

  return comentario;
}


  async listarPorTarea(tareaId: string, usuarioId: string, rol: RolUsuario) {
    await this.tareasService.obtenerTarea(tareaId, usuarioId, rol);

    return this.prisma.comentario.findMany({
      where: { tareaId },
      select: {
        id: true,
        contenido: true,
        creadoEn: true,
        autor: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
      orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
    });
  }
}
