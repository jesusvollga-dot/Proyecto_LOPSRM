import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePartidaDto {
  @ApiProperty({
    example: '01',
    description: 'Código o identificador de la partida (ej. 01, PREL, TERR)',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'El código de la partida es obligatorio' })
  @IsString({ message: 'El código de la partida debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo_partida: string;

  @ApiProperty({
    example: 'PRELIMINARES Y TERRACERÍAS',
    description: 'Nombre descriptivo de la partida',
    maxLength: 150,
  })
  @IsNotEmpty({ message: 'El nombre de la partida es obligatorio' })
  @IsString({ message: 'El nombre de la partida debe ser texto' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  nombre_partida: string;

  @ApiPropertyOptional({
    example: 'Trabajos iniciales de desmonte, trazo y nivelación',
    description: 'Descripción detallada o alcance de la partida',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;
}
