import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CrearComentarioDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'contenido debe ser texto' })
  @IsNotEmpty({ message: 'contenido no puede estar vacío' })
  contenido: string;
}
