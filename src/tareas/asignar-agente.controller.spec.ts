import {
  BadRequestException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolUsuario } from '../generated/prisma/enums.js';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';

describe('US-14: HTTP y permisos', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let previousSecret: string | undefined;
  const asignarAgente = jest.fn();
  const id = 'a7106e10-ecfa-4c3a-9089-d0581e68a540';
  const agenteId = 'da2fca4f-a1cd-4a8d-a204-c44311dd0fa7';
  const ruta = `/tareas/${id}/agente`;

  beforeAll(async () => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'secreto-exclusivo-pruebas-us14';
    const module = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: process.env.JWT_SECRET }),
      ],
      controllers: [TareasController],
      providers: [
        JwtStrategy,
        { provide: TareasService, useValue: { asignarAgente } },
      ],
    }).compile();
    jwt = module.get(JwtService);
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });
  beforeEach(() =>
    asignarAgente.mockReset().mockResolvedValue({ id, agenteId }),
  );
  afterAll(async () => {
    await app.close();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const token = (rol: RolUsuario) => jwt.sign({ sub: agenteId, rol });

  it('requiere JWT', async () => {
    await request(app.getHttpServer())
      .patch(ruta)
      .send({ agenteId })
      .expect(401);
    expect(asignarAgente).not.toHaveBeenCalled();
  });
  it('rechaza JWT inválido', async () => {
    await request(app.getHttpServer())
      .patch(ruta)
      .set('Authorization', 'Bearer invalido')
      .send({ agenteId })
      .expect(401);
  });
  it.each([RolUsuario.AGENTE, RolUsuario.EMPLEADO])(
    'deniega solicitante %s',
    async (rol) => {
      await request(app.getHttpServer())
        .patch(ruta)
        .set('Authorization', `Bearer ${token(rol)}`)
        .send({ agenteId })
        .expect(403);
      expect(asignarAgente).not.toHaveBeenCalled();
    },
  );
  it('ADMIN puede asignar y no recibe datos sensibles', async () => {
    const response = await request(app.getHttpServer())
      .patch(ruta)
      .set('Authorization', `Bearer ${token(RolUsuario.ADMIN)}`)
      .send({ agenteId })
      .expect(200);
    expect(response.body).toEqual({ id, agenteId });
    expect(asignarAgente).toHaveBeenCalledWith(id, agenteId, RolUsuario.ADMIN);
  });
  it.each([{}, { agenteId: null }, { agenteId: 'invalido' }, { agenteId: 1 }])(
    'rechaza DTO inválido %j',
    async (body) => {
      await request(app.getHttpServer())
        .patch(ruta)
        .set('Authorization', `Bearer ${token(RolUsuario.ADMIN)}`)
        .send(body)
        .expect(400);
      expect(asignarAgente).not.toHaveBeenCalled();
    },
  );
  it('rechaza id de ticket inválido', async () => {
    await request(app.getHttpServer())
      .patch('/tareas/invalido/agente')
      .set('Authorization', `Bearer ${token(RolUsuario.ADMIN)}`)
      .send({ agenteId })
      .expect(400);
    expect(asignarAgente).not.toHaveBeenCalled();
  });
  it.each([
    new NotFoundException('Ticket no encontrado'),
    new NotFoundException('Usuario no encontrado'),
    new BadRequestException('El usuario asignado debe tener rol AGENTE'),
  ])('devuelve el error de negocio %s', async (error) => {
    asignarAgente.mockRejectedValue(error);
    const response = await request(app.getHttpServer())
      .patch(ruta)
      .set('Authorization', `Bearer ${token(RolUsuario.ADMIN)}`)
      .send({ agenteId })
      .expect(error.getStatus());
    expect(response.body.message).toBe(error.message);
  });
});
