import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolUsuario } from '../generated/prisma/enums';
import request from 'supertest';

describe('UsuariosController', () => {
  let controller: UsuariosController;
  let app: INestApplication;
  let jwt: JwtService;
  const listar = jest.fn();
  const crear = jest.fn();
  const previousSecret = process.env.JWT_SECRET;

  beforeEach(async () => {
    listar.mockReset().mockResolvedValue([]);
    crear.mockReset().mockResolvedValue({ id: 'nuevo' });
    process.env.JWT_SECRET = 'secreto-exclusivo-pruebas-us07';
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      imports: [
        PassportModule,
        JwtModule.register({ secret: process.env.JWT_SECRET }),
      ],
      providers: [
        JwtStrategy,
        {
          provide: UsuariosService,
          useValue: { listar, crear },
        },
      ],
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
    jwt = module.get(JwtService);
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  const token = (rol: RolUsuario) => jwt.sign({ sub: 'usuario-prueba', rol });

  it('rechaza solicitudes sin JWT', async () => {
    await request(app.getHttpServer()).get('/usuarios').expect(401);
    expect(listar).not.toHaveBeenCalled();
  });

  it('rechaza JWT inválido', async () => {
    await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', 'Bearer invalido')
      .expect(401);
  });

  it('deniega el listado a EMPLEADO', async () => {
    await request(app.getHttpServer())
      .get('/usuarios')
      .set('Authorization', `Bearer ${token(RolUsuario.EMPLEADO)}`)
      .expect(403);
    expect(listar).not.toHaveBeenCalled();
  });

  it.each([RolUsuario.ADMIN, RolUsuario.AGENTE])(
    'permite listar a %s',
    async (rol) => {
      await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${token(rol)}`)
        .expect(200, []);
      expect(listar).toHaveBeenCalledWith(undefined);
    },
  );

  it.each(Object.values(RolUsuario))('acepta filtro %s', async (rol) => {
    await request(app.getHttpServer())
      .get('/usuarios')
      .query({ rol })
      .set('Authorization', `Bearer ${token(RolUsuario.ADMIN)}`)
      .expect(200);
    expect(listar).toHaveBeenCalledWith(rol);
  });

  it.each(['admin', 'OTRO', '', ['ADMIN', 'AGENTE']])(
    'rechaza filtro inválido %s',
    async (rol) => {
      await request(app.getHttpServer())
        .get('/usuarios')
        .query({ rol })
        .set('Authorization', `Bearer ${token(RolUsuario.ADMIN)}`)
        .expect(400);
      expect(listar).not.toHaveBeenCalled();
    },
  );

  it.each([RolUsuario.AGENTE, RolUsuario.EMPLEADO])(
    'impide crear usuarios internos a %s',
    async (rol) => {
      await request(app.getHttpServer())
        .post('/usuarios')
        .set('Authorization', `Bearer ${token(rol)}`)
        .send({
          nombre: 'Nuevo',
          email: 'nuevo@helpdesk.test',
          password: 'Password123',
          rol: 'ADMIN',
        })
        .expect(403);
      expect(crear).not.toHaveBeenCalled();
    },
  );

  it('permite a ADMIN crear un AGENTE', async () => {
    const dto = {
      nombre: 'Nuevo',
      email: 'nuevo@helpdesk.test',
      password: 'Password123',
      rol: 'AGENTE',
    };
    await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${token(RolUsuario.ADMIN)}`)
      .send(dto)
      .expect(201);
    expect(crear).toHaveBeenCalledWith(expect.objectContaining(dto));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
