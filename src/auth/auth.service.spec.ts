import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolUsuario } from '../generated/prisma/enums';
import { RegisterDto } from './dto/register.dto';

describe('AuthService: registro público US-07', () => {
  it.each([RolUsuario.ADMIN, RolUsuario.AGENTE])(
    'ignora un intento de registrarse como %s',
    async (rol) => {
      const create = jest.fn().mockResolvedValue({ rol: RolUsuario.EMPLEADO });
      const module = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: JwtService, useValue: {} },
          {
            provide: PrismaService,
            useValue: {
              usuario: {
                findUnique: jest.fn().mockResolvedValue(null),
                create,
              },
            },
          },
        ],
      }).compile();
      const dto = {
        nombre: 'Empleado',
        email: 'EMPLEADO@helpdesk.test',
        password: 'Password123',
        rol,
      };
      await module.get(AuthService).register(dto as RegisterDto);
      const query = create.mock.calls[0][0];
      expect(query.data.rol).toBe(RolUsuario.EMPLEADO);
      expect(query.data.email).toBe('empleado@helpdesk.test');
      expect(query.data.passwordHash).not.toBe(dto.password);
      expect(query.select).not.toHaveProperty('passwordHash');
      await module.close();
    },
  );
});
