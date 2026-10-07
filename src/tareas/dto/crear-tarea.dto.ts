import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
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

  @IsString()
  @IsNotEmpty()
  categoriaId!: string;
}