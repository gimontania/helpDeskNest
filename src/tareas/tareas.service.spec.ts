import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NotificacionesService } from '../notificaciones/notificaciones.services';
import { EstadoTarea, RolUsuario } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service';
import { TareasService } from './tareas.service';

describe('US-13: transiciones de estado', () => {
  let service: TareasService;
  const findUnique = jest.fn();
  const enviar = jest.fn();
  const updateManyAndReturn = jest.fn();
  const id = 'a7106e10-ecfa-4c3a-9089-d0581e68a540';
  const siguiente = {
    ABIERTO: 'EN_PROCESO',
    EN_PROCESO: 'RESUELTO',
    RESUELTO: 'CERRADO',
    CERRADO: null,
  };

  beforeEach(async () => {
    findUnique.mockReset();
    enviar.mockReset();
    updateManyAndReturn.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        TareasService,
        {
          provide: PrismaService,
          useValue: { tarea: { findUnique, updateManyAndReturn } },
        },
        { provide: NotificacionesService, useValue: { enviar } },
      ],
    }).compile();
    service = module.get(TareasService);
  });

  for (const actual of Object.values(EstadoTarea)) {
    it.each(Object.values(EstadoTarea))(`${actual} → %s`, async (destino) => {
      findUnique.mockResolvedValue({ estado: actual });
      const ticket = { id, estado: destino };
      updateManyAndReturn.mockResolvedValue([ticket]);
      const resultado = service.cambiarEstado(
        id,
        destino,
        RolUsuario.AGENTE,
        'usuario-prueba',
      );
      if (siguiente[actual] === destino) {
        await expect(resultado).resolves.toEqual(ticket);
        expect(updateManyAndReturn).toHaveBeenCalledWith({
          where: { id, estado: actual },
          data: { estado: destino },
        });
      } else {
        await expect(resultado).rejects.toThrow(ConflictException);
        expect(updateManyAndReturn).not.toHaveBeenCalled();
      }
    });
  }

  it('ADMIN también puede avanzar el estado', async () => {
    findUnique.mockResolvedValue({ estado: EstadoTarea.ABIERTO });
    updateManyAndReturn.mockResolvedValue([
      { id, estado: EstadoTarea.EN_PROCESO },
    ]);
    await expect(
      service.cambiarEstado(
        id,
        EstadoTarea.EN_PROCESO,
        RolUsuario.ADMIN,
        'usuario-prueba',
      ),
    ).resolves.toHaveProperty('estado', EstadoTarea.EN_PROCESO);
  });

  it('deniega EMPLEADO incluso si se llama directamente al servicio', async () => {
    await expect(
      service.cambiarEstado(
        id,
        EstadoTarea.EN_PROCESO,
        RolUsuario.EMPLEADO,
        'usuario-prueba',
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('ticket inexistente devuelve 404', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      service.cambiarEstado(
        id,
        EstadoTarea.EN_PROCESO,
        RolUsuario.AGENTE,
        'usuario-prueba',
      ),
    ).rejects.toThrow(NotFoundException);
    expect(updateManyAndReturn).not.toHaveBeenCalled();
  });

  it('detecta un cambio concurrente sin sobrescribirlo', async () => {
    findUnique.mockResolvedValue({ estado: EstadoTarea.ABIERTO });
    updateManyAndReturn.mockResolvedValue([]);
    await expect(
      service.cambiarEstado(
        id,
        EstadoTarea.EN_PROCESO,
        RolUsuario.AGENTE,
        'usuario-prueba',
      ),
    ).rejects.toThrow('El ticket cambió mientras se procesaba la solicitud');
  });

  it('explica por qué no se puede reabrir un ticket cerrado', async () => {
    findUnique.mockResolvedValue({ estado: EstadoTarea.CERRADO });
    await expect(
      service.cambiarEstado(
        id,
        EstadoTarea.ABIERTO,
        RolUsuario.AGENTE,
        'usuario-prueba',
      ),
    ).rejects.toThrow('Un ticket cerrado no puede cambiar de estado');
  });

  it('notifica al creador y al agente, sin incluir a quien hizo el cambio', async () => {
    findUnique.mockResolvedValue({ estado: EstadoTarea.ABIERTO });
    updateManyAndReturn.mockResolvedValue([
      {
        id,
        titulo: 'Impresora',
        estado: EstadoTarea.EN_PROCESO,
        creadorId: 'creador-1',
        agenteId: 'agente-1',
      },
    ]);

    await service.cambiarEstado(
      id,
      EstadoTarea.EN_PROCESO,
      RolUsuario.AGENTE,
      'agente-1',
    );

    expect(enviar).toHaveBeenCalledWith(
      ['creador-1', 'agente-1'],
      expect.objectContaining({ tipo: 'tarea.estado_cambiado', tareaId: id }),
      'agente-1',
    );
  });

  it('si la notificación falla, el cambio de estado igual se guarda', async () => {
    findUnique.mockResolvedValue({ estado: EstadoTarea.ABIERTO });
    const ticket = {
      id,
      titulo: 'Impresora',
      estado: EstadoTarea.EN_PROCESO,
      creadorId: 'creador-1',
      agenteId: null,
    };
    updateManyAndReturn.mockResolvedValue([ticket]);
    enviar.mockImplementation(() => {
      throw new Error('socket caído');
    });

    await expect(
      service.cambiarEstado(
        id,
        EstadoTarea.EN_PROCESO,
        RolUsuario.AGENTE,
        'agente-1',
      ),
    ).resolves.toEqual(ticket);
  });
});
