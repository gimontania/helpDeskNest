import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const HASH_FALSO = bcrypt.hashSync('hash-de-relleno', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ nombre, email, password }: RegisterDto) {
    const emailNormalizado = email.toLowerCase();

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (usuarioExistente) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre,
        email: emailNormalizado,
        passwordHash,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        creadoEn: true,
      },
    });

    return usuario;
  }

  async login({ email, password }: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });

    const passwordValida = await bcrypt.compare(
      password,
      usuario?.passwordHash ?? HASH_FALSO,
    );

    if (!usuario || !passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
