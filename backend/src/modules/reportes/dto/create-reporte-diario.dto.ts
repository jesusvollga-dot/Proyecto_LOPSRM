import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class PersonalCuadrillaDto {
  @ApiProperty({ example: 'Albañiles' })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiPropertyOptional({ example: 'Cuadrilla 1 colado de zapatas' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class MaquinariaSitioDto {
  @ApiProperty({ example: 'Retroexcavadora CAT 416' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  cantidad: number;

  @ApiPropertyOptional({ example: 6.5 })
  @IsOptional()
  @IsNumber()
  horas_uso?: number;

  @ApiPropertyOptional({ example: 'Operativa' })
  @IsOptional()
  @IsString()
  estatus?: string;
}

export class FotoReporteInputDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 6 })
  @IsNumber()
  @Min(1)
  @Max(6)
  numero_foto: number;

  @ApiProperty({ example: 'https://storage.lopsrm.gob.mx/evidencias/foto1.jpg' })
  @IsString()
  @IsNotEmpty()
  url_archivo: string;

  @ApiPropertyOptional({ example: 'Excavación para cimentación en eje A-4' })
  @IsOptional()
  @IsString()
  descripcion_foto?: string;
}

export class IncidenciaInputDto {
  @ApiProperty({ example: 'Interferencia' })
  @IsString()
  @IsIn(['Problematica', 'Interferencia', 'Suspension_Parcial', 'Fuerza_Mayor'])
  tipo: string;

  @ApiProperty({ example: 'Tubería de agua potable no señalada en plano' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ example: 'Se coordinó con OOMSAPAS para reubicación' })
  @IsString()
  @IsNotEmpty()
  acciones_a_seguir: string;

  @ApiPropertyOptional({ example: 'Pendiente' })
  @IsOptional()
  @IsString()
  estatus?: string;

  @ApiPropertyOptional({ example: '2026-11-15' })
  @IsOptional()
  @IsDateString()
  fecha_solucion?: string;
}

export class CreateReporteDiarioDto {
  @ApiProperty({ example: 1, description: 'ID de la obra a la que pertenece el reporte (HU-034)' })
  @IsNumber({}, { message: 'El ID de obra debe ser un entero' })
  @IsNotEmpty({ message: 'El ID de obra es obligatorio' })
  id_obra: number;

  @ApiProperty({ example: '2026-11-09', description: 'Fecha de la jornada reportada (HU-034)' })
  @IsDateString({}, { message: 'La fecha del reporte debe tener formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha del reporte es obligatoria' })
  fecha_reporte: string;

  @ApiProperty({
    example: 'Soleado',
    description: 'Condición meteorológica de la jornada (HU-035)',
    enum: ['Soleado', 'Parcialmente Nublado', 'Nublado', 'Lluvia Ligera', 'Lluvia Fuerte', 'Tormenta'],
  })
  @IsString({ message: 'El clima debe ser una cadena válida' })
  @IsIn(['Soleado', 'Parcialmente Nublado', 'Nublado', 'Lluvia Ligera', 'Lluvia Fuerte', 'Tormenta'], {
    message: 'El clima debe ser uno de los permitidos (Soleado, Nublado, Lluvia Ligera, etc.)',
  })
  clima: string;

  @ApiPropertyOptional({ example: 28.5, description: 'Temperatura registrada en grados Celsius (HU-035)' })
  @IsOptional()
  @IsNumber({}, { message: 'La temperatura debe ser un número' })
  temperatura_celsius?: number;

  @ApiPropertyOptional({ example: 'Viento moderado por la tarde sin afectación a colados', description: 'Notas meteorológicas' })
  @IsOptional()
  @IsString()
  observaciones_clima?: string;

  @ApiPropertyOptional({ example: true, description: 'Indicador de señalamiento preventivo en obra (HU-036)' })
  @IsOptional()
  @IsBoolean()
  senalamiento_preventivo?: boolean;

  @ApiPropertyOptional({ example: 'Condiciones de obra óptimas, delimitación perimetral completa', description: 'Condiciones de seguridad (HU-036)' })
  @IsOptional()
  @IsString()
  condiciones_seguridad?: string;

  @ApiPropertyOptional({
    example: { senalizacion: true, extintores: true, botiquin: true, orden_limpieza: true },
    description: 'Checklist detallado de seguridad (HU-036)',
  })
  @IsOptional()
  checklist_seguridad?: Record<string, boolean>;

  @ApiPropertyOptional({ example: 'Se reforzó la cinta restrictiva en fosa de elevador', description: 'Observaciones de seguridad' })
  @IsOptional()
  @IsString()
  observaciones_seguridad?: string;

  @ApiPropertyOptional({ example: true, description: 'Cumplimiento general del equipo de protección personal (HU-037)' })
  @IsOptional()
  @IsBoolean()
  equipo_proteccion_epp?: boolean;

  @ApiPropertyOptional({
    example: { casco: true, chaleco: true, botas: true, guantes: true, lentes: true, arnes: true },
    description: 'Checklist de EPP por elementos (HU-037)',
  })
  @IsOptional()
  checklist_epp?: Record<string, boolean>;

  @ApiPropertyOptional({ example: 'Personal al 100% con casco y botas con casquillo', description: 'Observaciones de EPP (HU-037)' })
  @IsOptional()
  @IsString()
  observaciones_epp?: string;

  @ApiPropertyOptional({ example: true, description: 'Suministro oportuno de material en sitio' })
  @IsOptional()
  @IsBoolean()
  suministro_material?: boolean;

  @ApiPropertyOptional({ example: 'Suficiente', enum: ['Suficiente', 'Insuficiente'] })
  @IsOptional()
  @IsIn(['Suficiente', 'Insuficiente'])
  estatus_personal?: string;

  @ApiPropertyOptional({
    type: [PersonalCuadrillaDto],
    description: 'Lista de personal presente y cuadrillas durante la jornada (HU-038)',
  })
  @IsOptional()
  @IsArray()
  resumen_cuadrilla?: PersonalCuadrillaDto[];

  @ApiPropertyOptional({
    type: [MaquinariaSitioDto],
    description: 'Lista de maquinaria utilizada en la obra (HU-039)',
  })
  @IsOptional()
  @IsArray()
  maquinaria_sitio?: MaquinariaSitioDto[];

  @ApiPropertyOptional({
    example: 'Habilitado de acero para contratrabes de cimentación y excavación zanjas',
    description: 'Descripción de las actividades realizadas durante la jornada (HU-034)',
  })
  @IsOptional()
  @IsString()
  actividades_realizadas?: string;

  @ApiPropertyOptional({ example: 15.5, description: 'Avance físico acumulado (0 a 100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  avance_fisico_acumulado?: number;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Fecha estimada de fin de obra' })
  @IsOptional()
  @IsDateString()
  fecha_estimada_fin?: string;

  @ApiPropertyOptional({
    type: [FotoReporteInputDto],
    description: 'Fotografías del reporte diario (máximo 6 fotos)',
  })
  @IsOptional()
  @IsArray()
  fotos?: FotoReporteInputDto[];

  @ApiPropertyOptional({
    type: [IncidenciaInputDto],
    description: 'Incidencias ocurridas durante la jornada',
  })
  @IsOptional()
  @IsArray()
  incidencias?: IncidenciaInputDto[];
}
