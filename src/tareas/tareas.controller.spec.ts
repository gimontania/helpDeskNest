import {
  ConflictException,
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

describe('US-13: endpoint y Guards reales', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let previousSecret: string | undefined;
  const cambiarEstado = jest.fn();
  const id = 'a7106e10-ecfa-4c3a-9089-d0581e68a540';
  const ruta = `/tareas/${id}/estado`;

  beforeAll(async () => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'secreto-exclusivo-pruebas-us13';
    const module = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: process.env.JWT_SECRET }),
      ],
      controllers: [TareasController],
      providers: [
        JwtStrategy,
        { provide: TareasService, useValue: { cambiarEstado } },
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
    cambiarEstado.mockReset().mockResolvedValue({ id, estado: 'EN_PROCESO' }),
  );
  afterAll(async () => {
    await app.close();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const token = (rol: RolUsuario) => jwt.sign({ sub: id, rol });

  it('requiere JWT', async () => {
    await request(app.getHttpServer())
      .patch(ruta)
      .send({ estado: 'EN_PROCESO' })
      .expect(401);
    expect(cambiarEstado).not.toHaveBeenCalled();
  });
  it('rechaza JWT inválido', async () => {
    await request(app.getHttpServer())
      .patch(ruta)
      .set('Authorization', 'Bearer invalido')
      .send({ estado: 'EN_PROCESO' })
      .expect(401);
  });
  it('EMPLEADO no puede cambiar estados', async () => {
    await request(app.getHttpServer())
      .patch(ruta)
      .set('Authorization', `Bearer ${token(RolUsuario.EMPLEADO)}`)
      .send({ estado: 'EN_PROCESO' })
      .expect(403);
    expect(cambiarEstado).not.toHaveBeenCalled();
  });
  it.each([RolUsuario.ADMIN, RolUsuario.AGENTE])(
    'permite cambiar a %s',
    async (rol) => {
      await request(app.getHttpServer())
        .patch(ruta)
        .set('Authorization', `Bearer ${token(rol)}`)
        .send({ estado: 'EN_PROCESO' })
        .expect(200, { id, estado: 'EN_PROCESO' });
      expect(cambiarEstado).toHaveBeenCalledWith(
        id,
        'EN_PROCESO',
        rol,
        expect.any(String),
      );
    },
  );
  it.each([{}, { estado: 'OTRO' }, { estado: null }, { estado: 'abierto' }])(
    'valida el cuerpo %j',
    async (body) => {
      await request(app.getHttpServer())
        .patch(ruta)
        .set('Authorization', `Bearer ${token(RolUsuario.AGENTE)}`)
        .send(body)
        .expect(400);
      expect(cambiarEstado).not.toHaveBeenCalled();
    },
  );
  it('valida UUID', async () => {
    await request(app.getHttpServer())
      .patch('/tareas/no-uuid/estado')
      .set('Authorization', `Bearer ${token(RolUsuario.ADMIN)}`)
      .send({ estado: 'EN_PROCESO' })
      .expect(400);
    expect(cambiarEstado).not.toHaveBeenCalled();
  });
  it.each([
    new NotFoundException('Ticket no encontrado'),
    new ConflictException('Transición no permitida'),
  ])('conserva el error claro del servicio %s', async (error) => {
    cambiarEstado.mockRejectedValue(error);
    const response = await request(app.getHttpServer())
      .patch(ruta)
      .set('Authorization', `Bearer ${token(RolUsuario.AGENTE)}`)
      .send({ estado: 'EN_PROCESO' })
      .expect(error.getStatus());
    expect(response.body.message).toBe(error.message);
  });
});
