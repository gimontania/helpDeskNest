import * as bcrypt from 'bcrypt';
import { RolUsuario } from '../generated/prisma/enums';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SELECT_USUARIO = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  creadoEn: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(rol?: RolUsuario) {
    return this.prisma.usuario.findMany({
      where: rol ? { rol } : undefined,
      select: SELECT_USUARIO,
      orderBy: { nombre: 'asc' },
    });
  }

  async crear({ nombre, email, password, rol }: CrearUsuarioDto) {
    const emailText = email.toLowerCase();

    const existente = await this.prisma.usuario.findUnique({
      where: { email: emailText },
    });

    if (existente) {
      throw new ConflictException('El correo ya está registrado');
    }

    return this.prisma.usuario.create({
      data: {
        nombre,
        email: emailText,
        passwordHash: await bcrypt.hash(password, 10),
        rol,
      },
      select: SELECT_USUARIO,
    });
  }

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
