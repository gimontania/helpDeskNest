import { IsOptional, IsString, MaxLength } from "class-validator";








export class ActualizarCategoriaDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    nombre?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;
}