import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';


@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Get('perfil')
    @UseGuards(JwtAuthGuard)
    async obtenerPerfil(@Req() req: Request) {
        const usuario = req.user as {
            sub: string;
            email: string;
            rol: string;
        };

        return this.usuariosService.obtenerPerfil(usuario.sub);
    }
}



