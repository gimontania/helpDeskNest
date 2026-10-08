import { IsEnum, IsOptional } from 'class-validator';
import { RolUsuario } from '../../generated/prisma/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListarUsuariosDto {
  @ApiPropertyOptional({ enum: Object.values(RolUsuario) })
  @IsOptional()
  @IsEnum(RolUsuario, {
    message: 'rol debe ser ADMIN, AGENTE o EMPLEADO',
  })
  rol?: RolUsuario;
}
