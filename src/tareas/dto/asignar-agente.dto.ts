import { IsUUID } from 'class-validator';

export class AsignarAgenteDto {
  @IsUUID('all', { message: 'agenteId debe ser un UUID válido' })
  agenteId: string;
}
