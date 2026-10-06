import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
    constructor(private readonly prisma: PrismaService) {}

    async obtenerPerfil(usuarioId: string) {
        return this.prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: {
                id: true,
                nombre: true,
                email: true, 
                rol: true,
                creadoEn: true,
            },
        });
    }
}
