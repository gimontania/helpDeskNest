import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { PrioridadTarea } from '../../generated/prisma/enums.js';

export class CrearTareaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsEnum(PrioridadTarea)
  prioridad!: PrioridadTarea;

  @IsUUID('all', { message: 'categoriaId debe ser un UUID válido' })
  categoriaId!: string;
}
