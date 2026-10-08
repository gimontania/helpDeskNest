import { IsEnum } from 'class-validator';
import { EstadoTarea } from '../../generated/prisma/enums.js';

export class CambiarEstadoDto {
  @IsEnum(EstadoTarea, {
    message: 'estado debe ser ABIERTO, EN_PROCESO, RESUELTO o CERRADO',
  })
  estado: EstadoTarea;
}
