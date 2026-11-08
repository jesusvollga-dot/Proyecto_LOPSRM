import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service.js';
import { CreatePartidaDto } from './dto/create-partida.dto.js';
import { CreateSubpartidaDto } from './dto/create-subpartida.dto.js';
import { CreateConceptoDto } from './dto/create-concepto.dto.js';
import { UpdateConceptoDto } from './dto/update-concepto.dto.js';
import { BloquearCatalogoDto } from './dto/bloquear-catalogo.dto.js';
import { CreateCatalogoModificadoDto } from './dto/create-catalogo-modificado.dto.js';
import { CreateConceptoExtraordinarioDto } from './dto/create-concepto-extraordinario.dto.js';
import { ModificarCantidadDto } from './dto/modificar-cantidad.dto.js';
import { CreateConvenioDto } from './dto/create-convenio.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RoleEnum } from '../../common/enums/role.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Catálogos de Conceptos, Modificados, Extraordinarios y Auditoría (Sprint 3 y Sprint 5)')
@ApiBearerAuth('JWT-auth')
@Controller('catalogos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  // =========================================================================
  // CATÁLOGO BASE
  // =========================================================================

  @Post('obra/:idObra')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Crear catálogo ORIGINAL para una obra (Sprint 3)',
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

  @Get('obra/:idObra/todos')
  @ApiOperation({
    summary: 'HU-027 / HU-033: Listar todos los catálogos de una obra',
    description: 'Devuelve todos los catálogos (Original, Modificados y Extraordinarios) registrados para la obra.',
  })
  @ApiResponse({ status: 200, description: 'Listado de catálogos de la obra' })
  async listarCatalogosPorObra(@Param('idObra', ParseIntPipe) idObra: number) {
    return this.catalogosService.listarCatalogosPorObra(idObra);
  }

  // =========================================================================
  // HU-014 — Registrar partidas
  // =========================================================================

  @Post(':idCatalogo/partidas')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'HU-014: Registrar una partida en el catálogo',
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
  // HU-015 — Registrar subpartidas
  // =========================================================================

  @Post(':idCatalogo/partidas/:idPartida/subpartidas')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'HU-015: Registrar una subpartida asociada a una partida',
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
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'HU-016/017: Registrar concepto con ID único y datos completos',
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
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar un concepto (solo si el catálogo NO está bloqueado)',
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

  // =========================================================================
  // SPRINT 5: HU-027 A HU-033
  // =========================================================================

  // =========================================================================
  // HU-027 — Crear catálogo modificado a partir del original
  // =========================================================================

  @Post('obra/:idObra/modificado')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'HU-027: Crear catálogo modificado a partir del original',
    description:
      'Como Superintendente quiero crear un catálogo modificado mediante un formulario para registrar los cambios de cantidades autorizados para la obra sin alterar el original.',
  })
  @ApiResponse({ status: 201, description: 'Catálogo modificado creado clonando estructura base' })
  @ApiResponse({ status: 400, description: 'La obra no cuenta con un catálogo original previo' })
  async crearCatalogoModificado(
    @Param('idObra', ParseIntPipe) idObra: number,
    @Body() dto: CreateCatalogoModificadoDto,
    @CurrentUser() user: User,
  ) {
    return this.catalogosService.crearCatalogoModificado(idObra, user.id_usuario, dto);
  }

  // =========================================================================
  // HU-028 — Registrar conceptos extraordinarios
  // =========================================================================

  @Post('obra/:idObra/extraordinarios')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'HU-028: Registrar conceptos extraordinarios',
    description:
      'Como Superintendente quiero registrar conceptos extraordinarios para incorporar trabajos no contemplados en el catálogo original.',
  })
  @ApiResponse({ status: 201, description: 'Concepto extraordinario registrado con éxito' })
  @ApiResponse({ status: 409, description: 'Clave de concepto extraordinario duplicada' })
  async crearConceptoExtraordinario(
    @Param('idObra', ParseIntPipe) idObra: number,
    @Body() dto: CreateConceptoExtraordinarioDto,
    @CurrentUser() user: User,
  ) {
    return this.catalogosService.crearConceptoExtraordinario(idObra, user.id_usuario, dto);
  }

  // =========================================================================
  // HU-029 — Registrar y consultar convenios de volumen
  // =========================================================================

  @Post('obra/:idObra/convenios')
  @Roles(RoleEnum.SUPERVISOR, RoleEnum.RESIDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'HU-029: Registrar convenios relacionados con volumen',
    description:
      'Como Supervisor, Residente o Administrador quiero registrar convenios relacionados con modificaciones de volumen.',
  })
  @ApiResponse({ status: 201, description: 'Convenio de volumen registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'Número de convenio duplicado' })
  async crearConvenio(
    @Param('idObra', ParseIntPipe) idObra: number,
    @Body() dto: CreateConvenioDto,
    @CurrentUser() user: User,
  ) {
    return this.catalogosService.crearConvenio(idObra, user.id_usuario, dto);
  }

  @Get('obra/:idObra/convenios')
  @ApiOperation({
    summary: 'HU-029: Consultar convenios de volumen de la obra',
    description:
      'Como Supervisor, Residente o Administrador quiero consultar convenios relacionados con modificaciones de volumen para mantener actualizada la información.',
  })
  @ApiResponse({ status: 200, description: 'Listado de convenios de la obra' })
  async listarConveniosPorObra(@Param('idObra', ParseIntPipe) idObra: number) {
    return this.catalogosService.listarConveniosPorObra(idObra);
  }

  @Get('convenios/:idConvenio')
  @ApiOperation({
    summary: 'HU-029: Consultar detalle de un convenio individual',
  })
  @ApiResponse({ status: 200, description: 'Detalle del convenio' })
  @ApiResponse({ status: 404, description: 'Convenio no encontrado' })
  async obtenerConvenio(@Param('idConvenio', ParseIntPipe) idConvenio: number) {
    return this.catalogosService.obtenerConvenio(idConvenio);
  }

  // =========================================================================
  // HU-030 / HU-031 / HU-033 — Modificar cantidades autorizadas
  // =========================================================================

  @Patch(':idCatalogo/conceptos/:idConcepto/cantidad')
  @Roles(RoleEnum.SUPERINTENDENTE, RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'HU-030/031/033: Modificar cantidad de un concepto con auditoría pericial',
    description:
      'Modifica la cantidad autorizada de un concepto registrando usuario responsable (HU-030), timestamp automático (HU-031), valor anterior y nuevo, y preservando trazabilidad completa (HU-033).',
  })
  @ApiResponse({ status: 200, description: 'Cantidad actualizada con registro inmutable en auditoría' })
  @ApiResponse({ status: 403, description: 'Prohibido modificar catálogo original bloqueado' })
  async modificarCantidadConcepto(
    @Param('idCatalogo', ParseIntPipe) idCatalogo: number,
    @Param('idConcepto', ParseIntPipe) idConcepto: number,
    @Body() dto: ModificarCantidadDto,
    @CurrentUser() user: User,
  ) {
    return this.catalogosService.modificarCantidadConcepto(
      idCatalogo,
      idConcepto,
      user.id_usuario,
      dto,
    );
  }

  // =========================================================================
  // HU-032 & HU-033 — Consultar historial de modificaciones y auditoría
  // =========================================================================

  @Get(':idCatalogo/historial')
  @Roles(RoleEnum.SUPERVISOR, RoleEnum.RESIDENTE, RoleEnum.ADMINISTRADOR, RoleEnum.DIRECTOR)
  @ApiOperation({
    summary: 'HU-032: Consultar historial de modificaciones de un catálogo',
    description:
      'Como Supervisor, Residente o Administrador quiero consultar el historial de modificaciones para conocer quién realizó cada cambio y cuándo se realizó.',
  })
  @ApiResponse({ status: 200, description: 'Historial cronológico de modificaciones' })
  async obtenerHistorialCatalogo(@Param('idCatalogo', ParseIntPipe) idCatalogo: number) {
    return this.catalogosService.obtenerHistorialCatalogo(idCatalogo);
  }

  @Get('obra/:idObra/auditoria')
  @Roles(RoleEnum.SUPERVISOR, RoleEnum.RESIDENTE, RoleEnum.ADMINISTRADOR, RoleEnum.DIRECTOR)
  @ApiOperation({
    summary: 'HU-032 / HU-033: Consulta consolidada de auditoría y trazabilidad histórica de la obra',
    description:
      'Permite auditar quién modificó qué, cuándo y por qué a través de todos los catálogos y conceptos de la obra.',
  })
  @ApiQuery({ name: 'id_concepto', required: false, type: Number })
  @ApiQuery({ name: 'id_usuario', required: false, type: Number })
  @ApiQuery({ name: 'evento', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Listado pericial de auditoría con filtros' })
  async obtenerHistorialObra(
    @Param('idObra', ParseIntPipe) idObra: number,
    @Query('id_concepto') idConcepto?: string,
    @Query('id_usuario') idUsuario?: string,
    @Query('evento') evento?: string,
  ) {
    return this.catalogosService.obtenerHistorialObra(idObra, {
      id_concepto: idConcepto ? Number(idConcepto) : undefined,
      id_usuario: idUsuario ? Number(idUsuario) : undefined,
      evento,
    });
  }
}
