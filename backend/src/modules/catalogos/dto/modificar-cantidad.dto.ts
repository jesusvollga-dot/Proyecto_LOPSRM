import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModificarCantidadDto {
  @ApiProperty({
    description: 'Nueva cantidad o volumen autorizado para el concepto en el catálogo modificado',
    example: 120.0,
  })
  @IsNotEmpty({ message: 'La nueva cantidad es obligatoria.' })
  @IsNumber({}, { message: 'La cantidad debe ser un número válido.' })
  @IsPositive({ message: 'La cantidad debe ser mayor a cero.' })
  cantidad_nueva: number;

  @ApiProperty({
    description: 'Justificación técnica o normativa de la modificación de volumen (HU-030, HU-033)',
    example: 'Ajuste de volúmenes de corte por modificación de niveles de rasante aprobada en bitácora.',
  })
  @IsNotEmpty({ message: 'La justificación de la modificación es obligatoria para efectos de auditoría.' })
  @IsString()
  justificacion: string;

  @ApiPropertyOptional({
    description: 'ID del convenio modificatorio asociado al cambio de volumen (HU-029)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id_convenio?: number;
}
