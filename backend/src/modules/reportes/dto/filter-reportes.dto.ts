import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterReportesDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de la obra a filtrar' })
  @IsOptional()
  @Type(() => Number)
  id_obra?: number;

  @ApiPropertyOptional({ example: '2026-11-01', description: 'Fecha inicio del rango' })
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional({ example: '2026-11-30', description: 'Fecha fin del rango' })
  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @ApiPropertyOptional({ example: 'Soleado', description: 'Filtro por condición climática' })
  @IsOptional()
  @IsString()
  clima?: string;
}
