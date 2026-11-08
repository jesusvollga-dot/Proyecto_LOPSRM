import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateObraDto {
  @ApiProperty({
    example: 'OBRA-2026-ED-001',
    description: 'Clave identificadora única de la obra (HU-007)',
  })
  @IsString({ message: 'La clave de obra debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La clave de obra es obligatoria' })
  clave_obra: string;

  @ApiProperty({
    example: 'Construcción de Edificio de Laboratorios de Ingeniería Civil',
    description: 'Denominación oficial del proyecto de obra pública (HU-007)',
  })
  @IsString({ message: 'El nombre de la obra debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre de la obra es obligatorio' })
  nombre_obra: string;

  @ApiProperty({
    example: 'DGCOP-LPN-045-2026',
    description: 'Número de contrato adjudicado conforme al Art. 46 LOPSRM (HU-007)',
  })
  @IsString({ message: 'El número de contrato debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número de contrato es obligatorio' })
  numero_contrato: string;

  @ApiProperty({
    example: 12500000.5,
    description: 'Presupuesto total autorizado sin IVA en moneda nacional (HU-008)',
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'El presupuesto autorizado debe ser un valor numérico válido' })
  @Min(0.01, { message: 'El presupuesto autorizado debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El presupuesto autorizado es obligatorio' })
  presupuesto_autorizado: number;

  @ApiPropertyOptional({
    example: 30.0,
    description: 'Porcentaje de anticipo pactado (Art. 50 LOPSRM, límite máximo del 30%)',
    default: 30.0,
    minimum: 0,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El porcentaje de anticipo debe ser numérico' })
  @Min(0, { message: 'El anticipo no puede ser negativo' })
  @Max(30, { message: 'El anticipo no puede exceder el 30% del total de la obra' })
  porcentaje_anticipo?: number;

  @ApiProperty({
    example: '2026-11-01',
    description: 'Fecha programada de inicio de los trabajos (YYYY-MM-DD) (HU-009)',
  })
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de inicio programada es obligatoria' })
  fecha_inicio_programada: string;

  @ApiProperty({
    example: '2027-05-31',
    description: 'Fecha programada de término de los trabajos (YYYY-MM-DD) (HU-009)',
  })
  @IsDateString({}, { message: 'La fecha de término debe tener formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de término programada es obligatoria' })
  fecha_termino_programada: string;
}
