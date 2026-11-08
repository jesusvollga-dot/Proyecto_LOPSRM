import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'node:path';
import * as fs from 'node:fs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportesService } from './reportes.service.js';
import { CreateReporteDiarioDto } from './dto/create-reporte-diario.dto.js';
import { FilterReportesDto } from './dto/filter-reportes.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RoleEnum } from '../../common/enums/role.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Reporte Diario de Supervisión y Bitácora (Sprint 6)')
@ApiBearerAuth('JWT-auth')
@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post('upload')
  @Roles(
    RoleEnum.SUPERVISOR,
    RoleEnum.ADMINISTRADOR,
    RoleEnum.RESIDENTE,
    RoleEnum.SUPERINTENDENTE,
  )
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
    }),
  )
  @ApiOperation({
    summary: 'Subir evidencia fotográfica, reporte PDF o documento Word',
    description:
      'Permite subir archivos en formatos de imagen (JPG, PNG, WEBP, GIF), documentos PDF y archivos Word (.docx, .doc) para asociar a los reportes de supervisión.',
  })
  async subirEvidencia(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo para subir.');
    }

    const ext = extname(file.originalname).toLowerCase();
    const extensionesPermitidas = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.gif',
      '.bmp',
      '.pdf',
      '.docx',
      '.doc',
    ];

    if (!extensionesPermitidas.includes(ext)) {
      throw new BadRequestException(
        `Formato no permitido (${ext}). Se admiten imágenes (JPG, PNG, WEBP, GIF), documentos PDF y Word (.docx, .doc).`,
      );
    }

    const uploadsDir = join(process.cwd(), 'uploads', 'evidencias');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const nombreSeguro = `evidencia_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const rutaDestino = join(uploadsDir, nombreSeguro);

    fs.writeFileSync(rutaDestino, file.buffer);

    let tipo = 'image';
    if (ext === '.pdf') tipo = 'pdf';
    else if (ext === '.docx' || ext === '.doc') tipo = 'doc';

    return {
      url_archivo: `/uploads/evidencias/${nombreSeguro}`,
      nombre_original: file.originalname,
      tipo_archivo: tipo,
      mimetype: file.mimetype,
      tamano: file.size,
    };
  }

  @Post()
  @Roles(RoleEnum.SUPERVISOR, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar reporte diario de supervisión (HU-034 a HU-039)',
    description:
      'Permite al Supervisor registrar el reporte de obra documentando actividades, clima, seguridad, EPP, cuadrillas y maquinaria.',
  })
  @ApiResponse({ status: 201, description: 'Reporte diario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Avance acumulado menor al anterior o datos inconsistentes' })
  @ApiResponse({ status: 409, description: 'Ya existe un reporte para esta obra en la fecha indicada' })
  async crearReporte(@CurrentUser() usuario: any, @Body() dto: CreateReporteDiarioDto) {
    return this.reportesService.crearReporte(usuario, dto);
  }

  @Get()
  @Roles(
    RoleEnum.SUPERVISOR,
    RoleEnum.RESIDENTE,
    RoleEnum.ADMINISTRADOR,
    RoleEnum.DIRECTOR,
  )
  @ApiOperation({
    summary: 'Consultar bitácora diaria de obra (HU-040)',
    description:
      'Permite a Supervisor, Residente y Administrador consultar los reportes diarios con filtros por obra, fecha y clima.',
  })
  @ApiResponse({ status: 200, description: 'Listado de reportes diarios encontrados' })
  async consultarBitacora(
    @CurrentUser() usuario: any,
    @Query() filtros: FilterReportesDto,
  ) {
    return this.reportesService.consultarBitacora(usuario, filtros);
  }

  @Get('obra/:idObra')
  @Roles(
    RoleEnum.SUPERVISOR,
    RoleEnum.RESIDENTE,
    RoleEnum.ADMINISTRADOR,
    RoleEnum.DIRECTOR,
  )
  @ApiOperation({
    summary: 'Consultar bitácora diaria de una obra específica (HU-040)',
  })
  @ApiParam({ name: 'idObra', description: 'ID de la obra' })
  @ApiResponse({ status: 200, description: 'Reportes diarios de la obra' })
  async consultarPorObra(
    @CurrentUser() usuario: any,
    @Param('idObra', ParseIntPipe) idObra: number,
    @Query() filtros: FilterReportesDto,
  ) {
    return this.reportesService.consultarBitacora(usuario, {
      ...filtros,
      id_obra: idObra,
    });
  }

  @Get('obra/:idObra/ultimo')
  @Roles(
    RoleEnum.SUPERVISOR,
    RoleEnum.RESIDENTE,
    RoleEnum.ADMINISTRADOR,
    RoleEnum.DIRECTOR,
  )
  @ApiOperation({
    summary: 'Obtener el último reporte diario registrado para una obra',
  })
  @ApiParam({ name: 'idObra', description: 'ID de la obra' })
  async obtenerUltimoReporte(@Param('idObra', ParseIntPipe) idObra: number) {
    return this.reportesService.obtenerUltimoReporteObra(idObra);
  }

  @Get(':id')
  @Roles(
    RoleEnum.SUPERVISOR,
    RoleEnum.RESIDENTE,
    RoleEnum.ADMINISTRADOR,
    RoleEnum.DIRECTOR,
  )
  @ApiOperation({
    summary: 'Obtener el detalle pericial de un reporte diario por ID (HU-040)',
  })
  @ApiParam({ name: 'id', description: 'ID del reporte' })
  @ApiResponse({ status: 200, description: 'Detalle del reporte' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  async obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.reportesService.obtenerReportePorId(id);
  }
}
