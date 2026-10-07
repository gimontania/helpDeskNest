import { Injectable } from '@nestjs/common';
import { RolUsuario } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service';
import { TareasService } from '../tareas/tareas.service';

@Injectable()
export class ComentariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tareasService: TareasService,
  ) {}

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
