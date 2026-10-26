import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service.js';
import { CreatePartidaDto } from './dto/create-partida.dto.js';
import { CreateSubpartidaDto } from './dto/create-subpartida.dto.js';
import { CreateConceptoDto } from './dto/create-concepto.dto.js';
import { UpdateConceptoDto } from './dto/update-concepto.dto.js';
import { BloquearCatalogoDto } from './dto/bloquear-catalogo.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RoleEnum } from '../../common/enums/role.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Catálogo de Conceptos — Sprint 3 (HU-014 a HU-019)')
@ApiBearerAuth('JWT-auth')
@Controller('catalogos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  // =========================================================================
  // CATÁLOGO
  // =========================================================================

  @Post('obra/:idObra')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Crear catálogo ORIGINAL para una obra',
    description:
      'Inicializa un catálogo de tipo ORIGINAL en estado BORRADOR para la obra especificada. Solo puede existir uno activo por obra.',
  })
  @ApiResponse({ status: 201, description: 'Catálogo creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un catálogo original para esta obra' })
  async crearCatalogo(@Param('idObra', ParseIntPipe) idObra: number) {
    return this.catalogosService.crearCatalogo(idObra);
  }

  @Get(':idCatalogo')
  @ApiOperation({
    summary: 'Consultar catálogo completo con estructura jerárquica',
    description:
      'Retorna el catálogo con sus partidas, subpartidas y conceptos.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo con su árbol jerárquico' })
  @ApiResponse({ status: 404, description: 'Catálogo no encontrado' })
  async obtenerCatalogo(@Param('idCatalogo', ParseIntPipe) idCatalogo: number) {
    return this.catalogosService.obtenerCatalogo(idCatalogo);
  }

  @Get('obra/:idObra')
  @ApiOperation({
    summary: 'Obtener catálogo ORIGINAL activo de una obra',
  })
  @ApiResponse({ status: 200, description: 'Catálogo original de la obra' })
  @ApiResponse({ status: 404, description: 'No existe catálogo original para la obra' })
  async obtenerCatalogoPorObra(@Param('idObra', ParseIntPipe) idObra: number) {
    return this.catalogosService.obtenerCatalogoPorObra(idObra);
  }

  // =========================================================================
  // HU-014 — Registrar partidas
  // =========================================================================

  @Post(':idCatalogo/partidas')
  @Roles(RoleEnum.SUPERINTENDENTE)
  @ApiOperation({
    summary: 'HU-014: Registrar una partida en el catálogo original',
    description:
      'Como Superintendente quiero registrar las partidas del catálogo original para estructurar los conceptos de la obra.',
  })
  @ApiResponse({ status: 201, description: 'Partida registrada exitosamente' })
  @ApiResponse({ status: 403, description: 'Catálogo bloqueado — no se permiten cambios' })
  @ApiResponse({ status: 409, description: 'Código de partida duplicado en este catálogo' })
  async crearPartida(
    @Param('idCatalogo', ParseIntPipe) idCatalogo: number,
    @Body() dto: CreatePartidaDto,
  ) {
    return this.catalogosService.crearPartida(idCatalogo, dto);
  }

  @Get(':idCatalogo/partidas')
  @ApiOperation({
    summary: 'Listar partidas activas de un catálogo',
  })
  @ApiResponse({ status: 200, description: 'Listado de partidas con sus subpartidas' })
  async listarPartidas(@Param('idCatalogo', ParseIntPipe) idCatalogo: number) {
    return this.catalogosService.listarPartidas(idCatalogo);
  }

  // =========================================================================
  // HU-015 — Registrar subpartidas asociadas a una partida
  // =========================================================================

  @Post(':idCatalogo/partidas/:idPartida/subpartidas')
  @Roles(RoleEnum.SUPERINTENDENTE)
  @ApiOperation({
    summary: 'HU-015: Registrar una subpartida asociada a una partida',
    description:
      'Como Superintendente quiero registrar subpartidas dentro de cada partida para organizar detalladamente el catálogo.',
  })
  @ApiResponse({ status: 201, description: 'Subpartida registrada y asociada a la partida' })
  @ApiResponse({ status: 403, description: 'Catálogo bloqueado — no se permiten cambios' })
  @ApiResponse({ status: 404, description: 'Partida no encontrada en este catálogo' })
  @ApiResponse({ status: 409, description: 'Código de subpartida duplicado en esta partida' })
  async crearSubpartida(
    @Param('idCatalogo', ParseIntPipe) idCatalogo: number,
    @Param('idPartida', ParseIntPipe) idPartida: number,
    @Body() dto: CreateSubpartidaDto,
  ) {
    return this.catalogosService.crearSubpartida(idCatalogo, idPartida, dto);
  }

  @Get('partidas/:idPartida/subpartidas')
  @ApiOperation({
    summary: 'Listar subpartidas activas de una partida',
  })
  @ApiResponse({ status: 200, description: 'Listado de subpartidas' })
  async listarSubpartidas(@Param('idPartida', ParseIntPipe) idPartida: number) {
    return this.catalogosService.listarSubpartidas(idPartida);
  }

  // =========================================================================
  // HU-016 + HU-017 — Crear y capturar datos de conceptos
  // =========================================================================

  @Post(':idCatalogo/conceptos')
  @Roles(RoleEnum.SUPERINTENDENTE)
  @ApiOperation({
    summary: 'HU-016/017: Registrar concepto con ID único y datos completos',
    description:
      'HU-016: Asignar ID único a cada concepto. HU-017: Capturar todos los datos requeridos ' +
      '(clave, descripción, unidad, cantidad, PU). El importe se calcula automáticamente en BD.',
  })
  @ApiResponse({ status: 201, description: 'Concepto registrado con importe calculado' })
  @ApiResponse({ status: 403, description: 'Catálogo bloqueado — no se permiten cambios' })
  @ApiResponse({ status: 409, description: 'Clave de concepto duplicada en este catálogo' })
  async crearConcepto(
    @Param('idCatalogo', ParseIntPipe) idCatalogo: number,
    @Body() dto: CreateConceptoDto,
  ) {
    return this.catalogosService.crearConcepto(idCatalogo, dto);
  }

  @Get(':idCatalogo/conceptos')
  @ApiOperation({
    summary: 'Listar conceptos activos de un catálogo',
  })
  @ApiResponse({ status: 200, description: 'Listado de conceptos con importes calculados' })
  async listarConceptos(@Param('idCatalogo', ParseIntPipe) idCatalogo: number) {
    return this.catalogosService.listarConceptos(idCatalogo);
  }

  @Get(':idCatalogo/conceptos/:idConcepto')
  @ApiOperation({
    summary: 'Consultar detalle de un concepto individual',
  })
  @ApiResponse({ status: 200, description: 'Detalle del concepto' })
  @ApiResponse({ status: 404, description: 'Concepto no encontrado' })
  async obtenerConcepto(
    @Param('idCatalogo', ParseIntPipe) _idCatalogo: number,
    @Param('idConcepto', ParseIntPipe) idConcepto: number,
  ) {
    return this.catalogosService.obtenerConcepto(idConcepto);
  }

  @Patch(':idCatalogo/conceptos/:idConcepto')
  @Roles(RoleEnum.SUPERINTENDENTE)
  @ApiOperation({
    summary: 'Actualizar un concepto (solo si el catálogo NO está bloqueado)',
    description:
      'HU-019: Los intentos de modificación directa al catálogo original bloqueado son rechazados.',
  })
  @ApiResponse({ status: 200, description: 'Concepto actualizado con importe recalculado' })
  @ApiResponse({ status: 403, description: 'Catálogo BLOQUEADO — modificaciones prohibidas (HU-019)' })
  @ApiResponse({ status: 404, description: 'Concepto no encontrado' })
  async actualizarConcepto(
    @Param('idCatalogo', ParseIntPipe) idCatalogo: number,
    @Param('idConcepto', ParseIntPipe) idConcepto: number,
    @Body() dto: UpdateConceptoDto,
    @CurrentUser() user: User,
  ) {
    return this.catalogosService.actualizarConcepto(
      idCatalogo,
      idConcepto,
      dto,
      user.id_usuario,
    );
  }

  @Delete(':idCatalogo/conceptos/:idConcepto')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Desactivar concepto (soft-delete) — solo si catálogo no bloqueado',
  })
  @ApiResponse({ status: 200, description: 'Concepto desactivado (borrado lógico)' })
  @ApiResponse({ status: 403, description: 'Catálogo BLOQUEADO — modificaciones prohibidas (HU-019)' })
  async desactivarConcepto(
    @Param('idCatalogo', ParseIntPipe) idCatalogo: number,
    @Param('idConcepto', ParseIntPipe) idConcepto: number,
  ) {
    return this.catalogosService.desactivarConcepto(idCatalogo, idConcepto);
  }

  // =========================================================================
  // HU-018 — Bloquear catálogo original
  // =========================================================================

  @Patch(':idCatalogo/bloquear')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'HU-018: Bloquear el catálogo original después de su captura',
    description:
      'Como Superintendente quiero finalizar y bloquear el catálogo original para evitar ' +
      'modificaciones posteriores a su captura. Una vez bloqueado, no se pueden agregar, ' +
      'editar ni eliminar conceptos, partidas o subpartidas.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo bloqueado exitosamente' })
  @ApiResponse({ status: 400, description: 'El catálogo ya está bloqueado o está vacío' })
  async bloquearCatalogo(
    @Param('idCatalogo', ParseIntPipe) idCatalogo: number,
    @Body() dto: BloquearCatalogoDto,
    @CurrentUser() user: User,
  ) {
    return this.catalogosService.bloquearCatalogo(idCatalogo, user.id_usuario, dto);
  }
}
