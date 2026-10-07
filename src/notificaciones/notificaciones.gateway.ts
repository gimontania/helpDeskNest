import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { salaDeUsuario } from './notificaciones.types';

@WebSocketGateway({ namespace: '/notificaciones', cors: { origin: '*' } })
export class NotificacionesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificacionesGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(cliente: Socket) {
    try {
      const token = cliente.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new Error('Conexión sin token');
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);

      //Aqui hago que cada usuario escuche su propia sala, no hay más
      await cliente.join(salaDeUsuario(payload.sub));
    } catch (error) {
      this.logger.warn(`Conexión rechazada: ${(error as Error).message}`);
      cliente.emit('error', { mensaje: 'No autorizado' });
      cliente.disconnect(true);
    }
  }
}
