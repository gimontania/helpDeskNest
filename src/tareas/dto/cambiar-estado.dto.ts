import { IsEnum } from 'class-validator';
import { EstadoTarea } from '../../generated/prisma/enums.js';
import { ApiProperty } from '@nestjs/swagger';

export class CambiarEstadoDto {
  @ApiProperty({ enum: Object.values(EstadoTarea) })
  @IsEnum(EstadoTarea, {
    message: 'estado debe ser ABIERTO, EN_PROCESO, RESUELTO o CERRADO',
  })
  estado: EstadoTarea;
}
