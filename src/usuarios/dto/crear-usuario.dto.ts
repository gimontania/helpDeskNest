import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RolUsuario } from '../../generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Object.values(RolUsuario) })
  @IsEnum(RolUsuario, {
    message: 'rol debe ser ADMIN, AGENTE o EMPLEADO',
  })
  rol: RolUsuario;
}
