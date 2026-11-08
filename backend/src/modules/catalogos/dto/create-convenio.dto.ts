import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsIn,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConvenioDto {
  @ApiProperty({
    description: 'Número oficial o clave del convenio modificatorio',
    example: 'CONV-MOD-VOL-01/2026',
  })
  @IsNotEmpty({ message: 'El número de convenio es obligatorio.' })
  @IsString()
  numero_convenio: string;

  @ApiPropertyOptional({
    description: 'Tipo de convenio modificatorio',
    example: 'MODIFICATORIO_VOLUMEN',
    enum: ['MODIFICATORIO_VOLUMEN', 'CONCEPTO_EXTRAORDINARIO', 'PLAZO', 'MIXTO'],
  })
  @IsOptional()
  @IsIn(['MODIFICATORIO_VOLUMEN', 'CONCEPTO_EXTRAORDINARIO', 'PLAZO', 'MIXTO'])
  tipo_convenio?: 'MODIFICATORIO_VOLUMEN' | 'CONCEPTO_EXTRAORDINARIO' | 'PLAZO' | 'MIXTO';

  @ApiProperty({
    description: 'Objeto y alcance de la modificación de volumen o cláusulas',
    example: 'Convenio modificatorio en monto y volumen por variaciones del terreno natural.',
  })
  @IsNotEmpty({ message: 'La descripción del convenio es obligatoria.' })
  @IsString()
  descripcion: string;

  @ApiProperty({
    description: 'Fecha de formalización y firma del convenio (YYYY-MM-DD)',
    example: '2026-11-05',
  })
  @IsNotEmpty({ message: 'La fecha de firma es obligatoria.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de firma debe tener formato YYYY-MM-DD.' })
  fecha_firma: string;

  @ApiPropertyOptional({
    description: 'Monto económico adicional o variación total generada por el convenio',
    example: 450000.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_adicional?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de variación respecto al presupuesto original (Máx 25% según Art. 59 LOPSRM)',
    example: 8.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  porcentaje_variacion?: number;

  @ApiPropertyOptional({
    description: 'Días naturales de ampliación de plazo si aplica',
    example: 15,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  dias_ampliacion?: number;

  @ApiPropertyOptional({
    description: 'ID del catálogo modificado asociado a este convenio',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  id_catalogo?: number;
}
