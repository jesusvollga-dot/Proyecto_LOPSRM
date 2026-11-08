import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsInt,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConceptoExtraordinarioDto {
  @ApiProperty({
    description: 'Identificador único del concepto extraordinario (HU-028)',
    example: 'EXT-001',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El identificador del concepto extraordinario es obligatorio.' })
  @IsString()
  @MaxLength(50)
  clave_concepto: string;

  @ApiProperty({
    description: 'Descripción detallada del trabajo o concepto extraordinario',
    example: 'Excavación adicional en roca fija no contemplada en el proyecto ejecutivo original mediante martillo hidráulico.',
  })
  @IsNotEmpty({ message: 'La descripción del concepto extraordinario es obligatoria.' })
  @IsString()
  descripcion: string;

  @ApiProperty({
    description: 'Unidad de medida normativa (M3, M2, ML, LOTE, PZA, etc.)',
    example: 'M3',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'La unidad de medida es obligatoria.' })
  @IsString()
  @MaxLength(20)
  unidad_medida: string;

  @ApiProperty({
    description: 'Cantidad o volumen autorizado para el trabajo extraordinario',
    example: 250.5,
  })
  @IsNotEmpty({ message: 'La cantidad es obligatoria.' })
  @IsNumber({}, { message: 'La cantidad debe ser un número válido.' })
  @IsPositive({ message: 'La cantidad del concepto extraordinario debe ser mayor a cero.' })
  cantidad: number;

  @ApiProperty({
    description: 'Costo directo unitario analizado y autorizado para el concepto extraordinario',
    example: 840.5,
  })
  @IsNotEmpty({ message: 'El costo directo unitario es obligatorio.' })
  @IsNumber({}, { message: 'El costo directo unitario debe ser un número válido.' })
  @IsPositive({ message: 'El costo directo unitario debe ser mayor a cero.' })
  costo_directo_unitario: number;

  @ApiPropertyOptional({
    description: 'Nombre o agrupación de partida (por defecto: CONCEPTOS EXTRAORDINARIOS)',
    example: 'CONCEPTOS EXTRAORDINARIOS',
  })
  @IsOptional()
  @IsString()
  partida?: string;

  @ApiPropertyOptional({
    description: 'Subpartida opcional',
    example: 'Movimiento de Tierras Imprevisto',
  })
  @IsOptional()
  @IsString()
  subpartida?: string;

  @ApiPropertyOptional({
    description: 'ID de partida existente si se desea asociar',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id_partida?: number;

  @ApiPropertyOptional({
    description: 'Justificación técnica del trabajo no contemplado originalmente',
    example: 'Requerimiento derivado de hallazgo geológico en cimentación validado por supervisión.',
  })
  @IsOptional()
  @IsString()
  justificacion?: string;
}
