import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubpartidaDto {
  @ApiProperty({
    example: '01.01',
    description: 'Código de la subpartida relativo a la partida (ej. 01.01, TRAZ)',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El código de la subpartida es obligatorio' })
  @IsString({ message: 'El código de la subpartida debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo_subpartida: string;

  @ApiProperty({
    example: 'TRAZO Y NIVELACIÓN',
    description: 'Nombre descriptivo de la subpartida',
    maxLength: 150,
  })
  @IsNotEmpty({ message: 'El nombre de la subpartida es obligatorio' })
  @IsString({ message: 'El nombre de la subpartida debe ser texto' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  nombre_subpartida: string;

  @ApiPropertyOptional({
    example: 'Trabajos topográficos y referencias con equipo de precisión',
    description: 'Descripción detallada de la subpartida',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;
}
