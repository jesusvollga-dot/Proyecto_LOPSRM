import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BloquearCatalogoDto {
  @ApiPropertyOptional({
    example: 'Catálogo original validado y congelado para inicio formal de los trabajos.',
    description: 'Motivo u observaciones del bloqueo formal (HU-018)',
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  motivo?: string;
}
