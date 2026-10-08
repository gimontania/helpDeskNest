import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { PrioridadTarea } from '../../generated/prisma/enums.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearTareaDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiProperty({ enum: PrioridadTarea })
  @IsEnum(PrioridadTarea)
  prioridad!: PrioridadTarea;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'categoriaId debe ser un UUID válido' })
  categoriaId!: string;
}
