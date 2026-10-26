import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateConceptoDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  id_partida?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  id_subpartida?: number;

  @ApiPropertyOptional({ example: 'PRELIMINARES' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  partida?: string;

  @ApiPropertyOptional({ example: 'TRAZO Y NIVELACIÓN' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subpartida?: string;

  @ApiPropertyOptional({ example: 'PREL-01.01-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  clave_concepto?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 'm2' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidad_medida?: string;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidad?: number;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_directo_unitario?: number;
}
