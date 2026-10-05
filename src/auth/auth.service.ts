import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const HASH_FALSO = bcrypt.hashSync('hash-de-relleno', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });

    const passwordValida = await bcrypt.compare(
      password,
      usuario?.passwordHash ?? HASH_FALSO,
    );

    if (!usuario || !passwordValida) {
      // Mismo mensaje para correo inexistente o contraseña incorrecta
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
