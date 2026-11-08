import { IsOptional, IsString, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatalogoModificadoDto {
  @ApiPropertyOptional({
    description: 'ID del convenio modificatorio asociado que autoriza las modificaciones de volumen (HU-027, HU-029)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id_convenio?: number;

  @ApiPropertyOptional({
    description: 'Descripción u observaciones sobre la justificación del catálogo modificado',
    example: 'Catálogo modificado derivado de ajuste de volumetrías autorizadas por el Residente de Obra',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
