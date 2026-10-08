import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TareasService } from '../tareas/tareas.service';
import { RolUsuario } from '../generated/prisma/enums.js';
import { ComentariosService } from './comentarios.service';
import { NotificacionesService } from '../notificaciones/notificaciones.services';

describe('US-15: comentarios y propiedad del ticket', () => {
  let service: ComentariosService;
  const findFirst = jest.fn();
  const create = jest.fn();
  const tareaId = 'ticket-prueba';
  const usuarioId = 'empleado-prueba';

  beforeEach(async () => {
    findFirst.mockReset().mockImplementation(async ({ where }) => {
      if (
        where.id !== tareaId ||
        (where.creadorId && where.creadorId !== usuarioId)
      )
        return null;
      return { id: tareaId, creadorId: usuarioId };
    });
    create
      .mockReset()
      .mockResolvedValue({ id: 'comentario', contenido: 'Hola' });
    const module = await Test.createTestingModule({
      providers: [
        ComentariosService,
        TareasService,
        {
          provide: PrismaService,
          useValue: { tarea: { findFirst }, comentario: { create } },
        },
        {
          provide: NotificacionesService,
          useValue: { enviar: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(ComentariosService);
  });

  it('empleado comenta en su propio ticket con autor del JWT', async () => {
    await service.crear(
      tareaId,
      { contenido: 'Hola' },
      usuarioId,
      RolUsuario.EMPLEADO,
    );
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: tareaId,
      creadorId: usuarioId,
    });
    expect(create).toHaveBeenCalledWith({
      data: { tareaId, contenido: 'Hola', autorId: usuarioId },
      select: {
        id: true,
        tareaId: true,
        contenido: true,
        creadoEn: true,
        autor: { select: { id: true, nombre: true, rol: true } },
      },
    });
  });
  it('empleado no comenta en un ticket ajeno', async () => {
    await expect(
      service.crear(
        tareaId,
        { contenido: 'Hola' },
        'otro-empleado',
        RolUsuario.EMPLEADO,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(create).not.toHaveBeenCalled();
  });
  it.each([RolUsuario.ADMIN, RolUsuario.AGENTE])(
    '%s puede comentar en cualquier ticket visible',
    async (rol) => {
      await service.crear(
        tareaId,
        { contenido: 'Hola' },
        'personal-interno',
        rol,
      );
      expect(findFirst.mock.calls[0][0].where).toEqual({ id: tareaId });
      expect(create.mock.calls[0][0].data.autorId).toBe('personal-interno');
    },
  );
  it.each(Object.values(RolUsuario))(
    'ticket inexistente devuelve 404 para %s',
    async (rol) => {
      await expect(
        service.crear('inexistente', { contenido: 'Hola' }, usuarioId, rol),
      ).rejects.toThrow('Ticket no encontrado');
      expect(create).not.toHaveBeenCalled();
    },
  );
  it('ignora autor y fecha incluso en llamadas directas al servicio', async () => {
    const dto = {
      contenido: 'Hola',
      autorId: 'falso',
      creadoEn: '2000-01-01',
      autor: { id: 'falso' },
    };
    await service.crear(tareaId, dto, usuarioId, RolUsuario.EMPLEADO);
    expect(create.mock.calls[0][0].data).toEqual({
      tareaId,
      contenido: 'Hola',
      autorId: usuarioId,
    });
    expect(create.mock.calls[0][0].data).not.toHaveProperty('creadoEn');
  });
});
