import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolUsuario } from '../generated/prisma/enums';

describe('UsuariosService', () => {
  let service: UsuariosService;
  const findMany = jest.fn();

  beforeEach(async () => {
    findMany.mockReset().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: PrismaService,
          useValue: { usuario: { findMany } },
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('lista todos con una selección que excluye contraseñas', async () => {
    await expect(service.listar()).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: undefined,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        creadoEn: true,
      },
      orderBy: { nombre: 'asc' },
    });
  });

  it.each(Object.values(RolUsuario))('filtra por %s', async (rol) => {
    await service.listar(rol);
    expect(findMany.mock.calls[0][0].where).toEqual({ rol });
    expect(findMany.mock.calls[0][0].select).not.toHaveProperty('passwordHash');
    expect(findMany.mock.calls[0][0].select).not.toHaveProperty('password');
  });
});
