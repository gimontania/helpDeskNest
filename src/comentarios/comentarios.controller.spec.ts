import {
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
import { ComentariosController } from './comentarios.controller';
import { ComentariosService } from './comentarios.service';

describe('US-15: HTTP, JWT y datos automáticos', () => {
  let app: INestApplication;
  let jwt: JwtService;
  let previousSecret: string | undefined;
  const crear = jest.fn();
  const tareaId = 'a7106e10-ecfa-4c3a-9089-d0581e68a540';
  const usuarioId = 'da2fca4f-a1cd-4a8d-a204-c44311dd0fa7';
  const ruta = `/tareas/${tareaId}/comentarios`;
  beforeAll(async () => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'secreto-exclusivo-pruebas-us15';
    const module = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: process.env.JWT_SECRET }),
      ],
      controllers: [ComentariosController],
      providers: [
        JwtStrategy,
        { provide: ComentariosService, useValue: { crear } },
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
    crear
      .mockReset()
      .mockResolvedValue({ id: 'comentario', contenido: 'Hola' }),
  );
  afterAll(async () => {
    await app.close();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const token = (rol: RolUsuario) => jwt.sign({ sub: usuarioId, rol });
  it('requiere autenticación', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .send({ contenido: 'Hola' })
      .expect(401);
    expect(crear).not.toHaveBeenCalled();
  });
  it('rechaza JWT inválido', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', 'Bearer invalido')
      .send({ contenido: 'Hola' })
      .expect(401);
  });
  it.each(Object.values(RolUsuario))(
    'permite solicitud autenticada de %s',
    async (rol) => {
      await request(app.getHttpServer())
        .post(ruta)
        .set('Authorization', `Bearer ${token(rol)}`)
        .send({ contenido: 'Hola' })
        .expect(201);
      expect(crear).toHaveBeenCalledWith(
        tareaId,
        expect.objectContaining({ contenido: 'Hola' }),
        usuarioId,
        rol,
      );
    },
  );
  it('recorta espacios e ignora autor y fecha falsificados', async () => {
    await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', `Bearer ${token(RolUsuario.EMPLEADO)}`)
      .send({
        contenido: '  Hola  ',
        autorId: 'falso',
        autor: 'falso',
        creadoEn: '2000-01-01',
        fecha: '2000-01-01',
      })
      .expect(201);
    expect({ ...crear.mock.calls[0][1] }).toEqual({ contenido: 'Hola' });
    expect(crear.mock.calls[0][2]).toBe(usuarioId);
  });
  it.each([
    {},
    { contenido: '' },
    { contenido: '   ' },
    { contenido: null },
    { contenido: 1 },
    { contenido: {} },
  ])('rechaza contenido inválido %j', async (body) => {
    await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', `Bearer ${token(RolUsuario.EMPLEADO)}`)
      .send(body)
      .expect(400);
    expect(crear).not.toHaveBeenCalled();
  });
  it('valida UUID del ticket', async () => {
    await request(app.getHttpServer())
      .post('/tareas/invalido/comentarios')
      .set('Authorization', `Bearer ${token(RolUsuario.AGENTE)}`)
      .send({ contenido: 'Hola' })
      .expect(400);
    expect(crear).not.toHaveBeenCalled();
  });
  it('conserva 404 de ticket inexistente o no visible', async () => {
    crear.mockRejectedValue(new NotFoundException('Ticket no encontrado'));
    const response = await request(app.getHttpServer())
      .post(ruta)
      .set('Authorization', `Bearer ${token(RolUsuario.EMPLEADO)}`)
      .send({ contenido: 'Hola' })
      .expect(404);
    expect(response.body.message).toBe('Ticket no encontrado');
  });
});
