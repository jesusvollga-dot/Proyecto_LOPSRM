import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConceptoDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la partida a la que pertenece el concepto',
  })
  @IsOptional()
  @IsNumber({}, { message: 'El id_partida debe ser numérico' })
  id_partida?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la subpartida a la que pertenece el concepto (opcional)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'El id_subpartida debe ser numérico' })
  id_subpartida?: number;

  @ApiPropertyOptional({
    example: 'PRELIMINARES',
    description: 'Nombre de la partida (si no se proporciona id_partida)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'El nombre de partida debe ser texto' })
  @MaxLength(100)
  partida?: string;

  @ApiPropertyOptional({
    example: 'TRAZO Y NIVELACIÓN',
    description: 'Nombre de la subpartida (opcional)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'El nombre de subpartida debe ser texto' })
  @MaxLength(100)
  subpartida?: string;

  @ApiProperty({
    example: 'PREL-01.01-001',
    description: 'Identificador único del concepto en el catálogo (HU-016)',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'La clave de concepto es obligatoria y debe ser única (HU-016)' })
  @IsString({ message: 'La clave de concepto debe ser texto' })
  @MaxLength(50, { message: 'La clave no puede exceder 50 caracteres' })
  clave_concepto: string;

  @ApiProperty({
    example: 'Trazo y nivelación para desplante de estructuras con equipo topográfico de precisión',
    description: 'Descripción detallada de especificaciones y alcance del concepto (HU-017)',
  })
  @IsNotEmpty({ message: 'La descripción del concepto es obligatoria (HU-017)' })
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion: string;

  @ApiProperty({
    example: 'm2',
    description: 'Unidad de medida (m, m2, m3, kg, ton, pza, lote, jor)',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'La unidad de medida es obligatoria (HU-017)' })
  @IsString({ message: 'La unidad de medida debe ser texto' })
  @MaxLength(20)
  unidad_medida: string;

  @ApiProperty({
    example: 1500.5,
    description: 'Cantidad total programada a ejecutar (HU-017)',
    minimum: 0,
  })
  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @IsNumber({}, { message: 'La cantidad debe ser numérica' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  cantidad: number;

  @ApiProperty({
    example: 45.8,
    description: 'Costo directo unitario (P.U. sin sobrecosto)',
    minimum: 0,
  })
  @IsNotEmpty({ message: 'El costo directo unitario es obligatorio' })
  @IsNumber({}, { message: 'El costo directo unitario debe ser numérico' })
  @Min(0, { message: 'El costo directo unitario no puede ser negativo' })
  costo_directo_unitario: number;
}
