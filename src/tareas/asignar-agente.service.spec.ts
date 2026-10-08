import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RolUsuario } from '../generated/prisma/enums.js';
import { TareasService } from './tareas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.services';

describe('US-14: asignación de agentes', () => {
  let service: TareasService;
  const tareaFind = jest.fn();
  const usuarioFind = jest.fn();
  const update = jest.fn();
  const id = 'a7106e10-ecfa-4c3a-9089-d0581e68a540';
  const agenteId = 'da2fca4f-a1cd-4a8d-a204-c44311dd0fa7';

  beforeEach(async () => {
    tareaFind.mockReset().mockResolvedValue({ id });
    usuarioFind.mockReset().mockResolvedValue({ rol: RolUsuario.AGENTE });
    update.mockReset().mockResolvedValue({ id, agenteId, estado: 'ABIERTO' });
    const module = await Test.createTestingModule({
      providers: [
        TareasService,
        {
          provide: PrismaService,
          useValue: {
            tarea: { findUnique: tareaFind, update },
            usuario: { findUnique: usuarioFind },
          },
        },
        { provide: NotificacionesService, useValue: { enviar: jest.fn() } },
      ],
    }).compile();
    service = module.get(TareasService);
  });

  it('asigna a un AGENTE existente y selecciona solo datos públicos', async () => {
    await expect(
      service.asignarAgente(id, agenteId, RolUsuario.ADMIN),
    ).resolves.toEqual({ id, agenteId, estado: 'ABIERTO' });
    expect(tareaFind).toHaveBeenCalledWith({
      where: { id },
      select: { id: true },
    });
    expect(usuarioFind).toHaveBeenCalledWith({
      where: { id: agenteId },
      select: { rol: true },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id },
      data: { agenteId },
      include: {
        agente: { select: { id: true, nombre: true, email: true, rol: true } },
      },
    });
  });

  it.each([RolUsuario.ADMIN, RolUsuario.EMPLEADO])(
    'rechaza destinatario %s',
    async (rol) => {
      usuarioFind.mockResolvedValue({ rol });
      await expect(
        service.asignarAgente(id, agenteId, RolUsuario.ADMIN),
      ).rejects.toThrow(BadRequestException);
      expect(update).not.toHaveBeenCalled();
    },
  );
  it.each([RolUsuario.AGENTE, RolUsuario.EMPLEADO])(
    'rechaza solicitante %s',
    async (rol) => {
      await expect(service.asignarAgente(id, agenteId, rol)).rejects.toThrow(
        ForbiddenException,
      );
      expect(tareaFind).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    },
  );
  it('rechaza ticket inexistente', async () => {
    tareaFind.mockResolvedValue(null);
    await expect(
      service.asignarAgente(id, agenteId, RolUsuario.ADMIN),
    ).rejects.toThrow(new NotFoundException('Ticket no encontrado'));
    expect(usuarioFind).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
  it('rechaza usuario inexistente', async () => {
    usuarioFind.mockResolvedValue(null);
    await expect(
      service.asignarAgente(id, agenteId, RolUsuario.ADMIN),
    ).rejects.toThrow(new NotFoundException('Usuario no encontrado'));
    expect(update).not.toHaveBeenCalled();
  });
  it('permite repetir asignación sin modificar el estado', async () => {
    await service.asignarAgente(id, agenteId, RolUsuario.ADMIN);
    await service.asignarAgente(id, agenteId, RolUsuario.ADMIN);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls[1][0].data).toEqual({ agenteId });
  });
  it('permite reasignar a otro agente', async () => {
    await service.asignarAgente(id, agenteId, RolUsuario.ADMIN);
    await service.asignarAgente(id, id, RolUsuario.ADMIN);
    expect(update.mock.calls[1][0].data).toEqual({ agenteId: id });
  });
});
