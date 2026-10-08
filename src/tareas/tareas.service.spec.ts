import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EstadoTarea, RolUsuario } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service';
import { TareasService } from './tareas.service';

describe('US-13: transiciones de estado', () => {
  let service: TareasService;
  const findUnique = jest.fn();
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
    updateManyAndReturn.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        TareasService,
        {
          provide: PrismaService,
          useValue: { tarea: { findUnique, updateManyAndReturn } },
        },
      ],
    }).compile();
    service = module.get(TareasService);
  });

  for (const actual of Object.values(EstadoTarea)) {
    it.each(Object.values(EstadoTarea))(`${actual} → %s`, async (destino) => {
      findUnique.mockResolvedValue({ estado: actual });
      const ticket = { id, estado: destino };
      updateManyAndReturn.mockResolvedValue([ticket]);
      const resultado = service.cambiarEstado(id, destino, RolUsuario.AGENTE);
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
      service.cambiarEstado(id, EstadoTarea.EN_PROCESO, RolUsuario.ADMIN),
    ).resolves.toHaveProperty('estado', EstadoTarea.EN_PROCESO);
  });

  it('deniega EMPLEADO incluso si se llama directamente al servicio', async () => {
    await expect(
      service.cambiarEstado(id, EstadoTarea.EN_PROCESO, RolUsuario.EMPLEADO),
    ).rejects.toThrow(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('ticket inexistente devuelve 404', async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      service.cambiarEstado(id, EstadoTarea.EN_PROCESO, RolUsuario.AGENTE),
    ).rejects.toThrow(NotFoundException);
    expect(updateManyAndReturn).not.toHaveBeenCalled();
  });

  it('detecta un cambio concurrente sin sobrescribirlo', async () => {
    findUnique.mockResolvedValue({ estado: EstadoTarea.ABIERTO });
    updateManyAndReturn.mockResolvedValue([]);
    await expect(
      service.cambiarEstado(id, EstadoTarea.EN_PROCESO, RolUsuario.AGENTE),
    ).rejects.toThrow('El ticket cambió mientras se procesaba la solicitud');
  });

  it('explica por qué no se puede reabrir un ticket cerrado', async () => {
    findUnique.mockResolvedValue({ estado: EstadoTarea.CERRADO });
    await expect(
      service.cambiarEstado(id, EstadoTarea.ABIERTO, RolUsuario.AGENTE),
    ).rejects.toThrow('Un ticket cerrado no puede cambiar de estado');
  });
});
