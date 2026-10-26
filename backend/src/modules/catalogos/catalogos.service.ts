import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Catalogo } from './entities/catalogo.entity.js';
import { Partida } from './entities/partida.entity.js';
import { Subpartida } from './entities/subpartida.entity.js';
import { Concepto } from './entities/concepto.entity.js';
import { CreatePartidaDto } from './dto/create-partida.dto.js';
import { CreateSubpartidaDto } from './dto/create-subpartida.dto.js';
import { CreateConceptoDto } from './dto/create-concepto.dto.js';
import { UpdateConceptoDto } from './dto/update-concepto.dto.js';
import { BloquearCatalogoDto } from './dto/bloquear-catalogo.dto.js';

@Injectable()
export class CatalogosService {
  private readonly logger = new Logger(CatalogosService.name);

  constructor(
    @InjectRepository(Catalogo)
    private readonly catalogoRepository: Repository<Catalogo>,
    @InjectRepository(Partida)
    private readonly partidaRepository: Repository<Partida>,
    @InjectRepository(Subpartida)
    private readonly subpartidaRepository: Repository<Subpartida>,
    @InjectRepository(Concepto)
    private readonly conceptoRepository: Repository<Concepto>,
  ) {}

  // =========================================================================
  // CATÁLOGO — Crear catálogo ORIGINAL para una obra
  // =========================================================================

  /**
   * Crea un catálogo de tipo ORIGINAL para una obra determinada.
   * Solo puede existir un catálogo ORIGINAL activo por obra.
   */
  async crearCatalogo(idObra: number): Promise<Catalogo> {
    // Verificar que no exista ya un catálogo ORIGINAL activo para esta obra
    const existente = await this.catalogoRepository.findOne({
      where: { id_obra: idObra, tipo_catalogo: 'ORIGINAL', activo: true },
    });
    if (existente) {
      throw new ConflictException(
        `La obra ${idObra} ya cuenta con un catálogo original activo (ID: ${existente.id_catalogo}).`,
      );
    }

    const catalogo = this.catalogoRepository.create({
      id_obra: idObra,
      tipo_catalogo: 'ORIGINAL',
      version: 1,
      estatus_aprobacion: 'BORRADOR',
    });

    const saved = await this.catalogoRepository.save(catalogo);
    this.logger.log(`Catálogo ORIGINAL creado para obra ${idObra} → ID ${saved.id_catalogo}`);
    return saved;
  }

  // =========================================================================
  // CATÁLOGO — Consultar catálogo con estructura jerárquica completa
  // =========================================================================

  /**
   * Retorna el catálogo con su árbol: Partidas → Subpartidas → Conceptos
   */
  async obtenerCatalogo(idCatalogo: number): Promise<Catalogo> {
    const catalogo = await this.catalogoRepository.findOne({
      where: { id_catalogo: idCatalogo, activo: true },
      relations: {
        partidas: {
          subpartidas: true,
        },
        conceptos: true,
      },
    });
    if (!catalogo) {
      throw new NotFoundException(`Catálogo ${idCatalogo} no encontrado o fue desactivado.`);
    }
    return catalogo;
  }

  /**
   * Obtener el catálogo ORIGINAL activo de una obra.
   */
  async obtenerCatalogoPorObra(idObra: number): Promise<Catalogo> {
    const catalogo = await this.catalogoRepository.findOne({
      where: { id_obra: idObra, tipo_catalogo: 'ORIGINAL', activo: true },
      relations: {
        partidas: {
          subpartidas: true,
        },
        conceptos: true,
      },
    });
    if (!catalogo) {
      throw new NotFoundException(
        `No existe un catálogo original activo para la obra ${idObra}.`,
      );
    }
    return catalogo;
  }

  // =========================================================================
  // HU-014 — Registrar partidas en el catálogo original
  // =========================================================================

  /**
   * HU-014: Como Superintendente quiero registrar las partidas del catálogo
   * original para estructurar los conceptos de la obra.
   *
   * Criterio de aceptación: El Superintendente puede registrar una partida
   * válida en el catálogo original.
   */
  async crearPartida(idCatalogo: number, dto: CreatePartidaDto): Promise<Partida> {
    const catalogo = await this.validarCatalogoEditable(idCatalogo);

    // Validar unicidad del código de partida dentro del catálogo
    const existente = await this.partidaRepository.findOne({
      where: {
        id_catalogo: catalogo.id_catalogo,
        codigo_partida: dto.codigo_partida,
        activo: true,
      },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe una partida con código '${dto.codigo_partida}' en este catálogo.`,
      );
    }

    const partida = this.partidaRepository.create({
      id_catalogo: catalogo.id_catalogo,
      codigo_partida: dto.codigo_partida,
      nombre_partida: dto.nombre_partida,
      descripcion: dto.descripcion ?? null,
    });

    const saved = await this.partidaRepository.save(partida);
    this.logger.log(
      `HU-014 — Partida '${saved.codigo_partida}' registrada en catálogo ${idCatalogo}`,
    );
    return saved;
  }

  /**
   * Listar partidas activas de un catálogo.
   */
  async listarPartidas(idCatalogo: number): Promise<Partida[]> {
    await this.validarCatalogoExiste(idCatalogo);
    return this.partidaRepository.find({
      where: { id_catalogo: idCatalogo, activo: true },
      relations: {
        subpartidas: true,
      },
      order: { codigo_partida: 'ASC' },
    });
  }

  // =========================================================================
  // HU-015 — Registrar subpartidas asociadas a una partida
  // =========================================================================

  /**
   * HU-015: Como Superintendente quiero registrar subpartidas dentro de cada
   * partida para organizar detalladamente el catálogo.
   *
   * Criterio de aceptación: Una subpartida queda asociada a la partida correcta.
   */
  async crearSubpartida(
    idCatalogo: number,
    idPartida: number,
    dto: CreateSubpartidaDto,
  ): Promise<Subpartida> {
    await this.validarCatalogoEditable(idCatalogo);

    // Verificar que la partida pertenece al catálogo
    const partida = await this.partidaRepository.findOne({
      where: { id_partida: idPartida, id_catalogo: idCatalogo, activo: true },
    });
    if (!partida) {
      throw new NotFoundException(
        `Partida ${idPartida} no encontrada en el catálogo ${idCatalogo}.`,
      );
    }

    // Validar unicidad del código de subpartida dentro de la partida
    const existente = await this.subpartidaRepository.findOne({
      where: {
        id_partida: idPartida,
        codigo_subpartida: dto.codigo_subpartida,
        activo: true,
      },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe una subpartida con código '${dto.codigo_subpartida}' en la partida '${partida.codigo_partida}'.`,
      );
    }

    const subpartida = this.subpartidaRepository.create({
      id_partida: idPartida,
      codigo_subpartida: dto.codigo_subpartida,
      nombre_subpartida: dto.nombre_subpartida,
      descripcion: dto.descripcion ?? null,
    });

    const saved = await this.subpartidaRepository.save(subpartida);
    this.logger.log(
      `HU-015 — Subpartida '${saved.codigo_subpartida}' asociada a partida ${idPartida}`,
    );
    return saved;
  }

  /**
   * Listar subpartidas activas de una partida.
   */
  async listarSubpartidas(idPartida: number): Promise<Subpartida[]> {
    return this.subpartidaRepository.find({
      where: { id_partida: idPartida, activo: true },
      order: { codigo_subpartida: 'ASC' },
    });
  }

  // =========================================================================
  // HU-016 + HU-017 — Asignar ID único y capturar datos de cada concepto
  // =========================================================================

  /**
   * HU-016: Cada concepto posee un identificador único (clave_concepto).
   * HU-017: El formulario permite capturar y almacenar todos los datos
   * requeridos del concepto (clave, descripción, unidad, cantidad, PU).
   *
   * Criterios de aceptación:
   * - Cada concepto posee un identificador único.
   * - El formulario permite capturar y almacenar todos los datos requeridos.
   * - Importe calculado automáticamente: Cantidad × Costo Directo Unitario.
   */
  async crearConcepto(idCatalogo: number, dto: CreateConceptoDto): Promise<Concepto> {
    const catalogo = await this.validarCatalogoEditable(idCatalogo);

    // HU-016: Validar unicidad del clave_concepto dentro del catálogo
    const existente = await this.conceptoRepository.findOne({
      where: {
        id_catalogo: catalogo.id_catalogo,
        clave_concepto: dto.clave_concepto,
        activo: true,
      },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe un concepto con la clave '${dto.clave_concepto}' en este catálogo. ` +
        `Cada concepto debe poseer un identificador único (HU-016).`,
      );
    }

    // Validar que la partida referenciada (si se proporciona) pertenezca al catálogo
    if (dto.id_partida) {
      const partida = await this.partidaRepository.findOne({
        where: { id_partida: dto.id_partida, id_catalogo: idCatalogo, activo: true },
      });
      if (!partida) {
        throw new NotFoundException(
          `Partida ${dto.id_partida} no encontrada en el catálogo ${idCatalogo}.`,
        );
      }
    }

    // Validar que la subpartida referenciada (si se proporciona) pertenezca a la partida
    if (dto.id_subpartida) {
      const subpartida = await this.subpartidaRepository.findOne({
        where: { id_subpartida: dto.id_subpartida, activo: true },
      });
      if (!subpartida) {
        throw new NotFoundException(
          `Subpartida ${dto.id_subpartida} no encontrada.`,
        );
      }
    }

    // HU-017: Crear concepto con todos los datos requeridos
    // El importe_costo_directo se calcula automáticamente en la BD (GENERATED ALWAYS AS)
    const concepto = this.conceptoRepository.create({
      id_catalogo: catalogo.id_catalogo,
      id_partida: dto.id_partida ?? null,
      id_subpartida: dto.id_subpartida ?? null,
      partida: dto.partida ?? '',
      subpartida: dto.subpartida ?? null,
      clave_concepto: dto.clave_concepto,
      descripcion: dto.descripcion,
      unidad_medida: dto.unidad_medida,
      cantidad: dto.cantidad,
      costo_directo_unitario: dto.costo_directo_unitario,
    });

    const saved = await this.conceptoRepository.save(concepto);
    this.logger.log(
      `HU-016/017 — Concepto '${saved.clave_concepto}' registrado en catálogo ${idCatalogo}`,
    );

    // Re-consultar para obtener el importe calculado por la BD
    return this.conceptoRepository.findOneOrFail({
      where: { id_concepto: saved.id_concepto },
    });
  }

  /**
   * Listar todos los conceptos activos de un catálogo.
   */
  async listarConceptos(idCatalogo: number): Promise<Concepto[]> {
    await this.validarCatalogoExiste(idCatalogo);
    return this.conceptoRepository.find({
      where: { id_catalogo: idCatalogo, activo: true },
      order: { clave_concepto: 'ASC' },
    });
  }

  /**
   * Consultar un concepto individual.
   */
  async obtenerConcepto(idConcepto: number): Promise<Concepto> {
    const concepto = await this.conceptoRepository.findOne({
      where: { id_concepto: idConcepto, activo: true },
    });
    if (!concepto) {
      throw new NotFoundException(`Concepto ${idConcepto} no encontrado.`);
    }
    return concepto;
  }

  // =========================================================================
  // HU-018 — Bloquear el catálogo original después de su captura
  // =========================================================================

  /**
   * HU-018: Como Superintendente quiero finalizar y bloquear el catálogo
   * original para evitar modificaciones posteriores a su captura.
   *
   * Criterio de aceptación: Un catálogo bloqueado no puede ser editado
   * directamente.
   */
  async bloquearCatalogo(
    idCatalogo: number,
    idUsuario: number,
    dto: BloquearCatalogoDto,
  ): Promise<Catalogo> {
    const catalogo = await this.catalogoRepository.findOne({
      where: { id_catalogo: idCatalogo, activo: true },
    });
    if (!catalogo) {
      throw new NotFoundException(`Catálogo ${idCatalogo} no encontrado.`);
    }

    if (catalogo.estatus_aprobacion === 'BLOQUEADO') {
      throw new BadRequestException(
        `El catálogo ${idCatalogo} ya se encuentra bloqueado desde ${catalogo.fecha_bloqueo?.toISOString()}.`,
      );
    }

    // Verificar que el catálogo tenga al menos un concepto antes de bloquear
    const totalConceptos = await this.conceptoRepository.count({
      where: { id_catalogo: idCatalogo, activo: true },
    });
    if (totalConceptos === 0) {
      throw new BadRequestException(
        'No es posible bloquear un catálogo vacío. Registre al menos un concepto antes de finalizar.',
      );
    }

    catalogo.estatus_aprobacion = 'BLOQUEADO';
    catalogo.fecha_bloqueo = new Date();
    catalogo.bloqueado_por = idUsuario;

    const saved = await this.catalogoRepository.save(catalogo);
    this.logger.warn(
      `HU-018 — Catálogo ${idCatalogo} BLOQUEADO por usuario ${idUsuario}. Motivo: ${dto.motivo ?? 'Sin observaciones'}`,
    );
    return saved;
  }

  // =========================================================================
  // HU-019 — Impedir modificaciones directas al catálogo original
  // =========================================================================

  /**
   * HU-019: Como Administrador quiero controlar el estado del catálogo
   * original para asegurar que ningún usuario realice modificaciones
   * no autorizadas.
   *
   * Criterio de aceptación: Los intentos de modificación directa al catálogo
   * original son rechazados.
   *
   * Nota: Esta validación se aplica transversalmente en validarCatalogoEditable().
   */

  /**
   * Actualizar un concepto existente — solo si el catálogo NO está bloqueado (HU-019).
   */
  async actualizarConcepto(
    idCatalogo: number,
    idConcepto: number,
    dto: UpdateConceptoDto,
    idUsuario: number,
  ): Promise<Concepto> {
    // HU-019: Verificar que el catálogo NO esté bloqueado
    await this.validarCatalogoEditable(idCatalogo);

    const concepto = await this.conceptoRepository.findOne({
      where: { id_concepto: idConcepto, id_catalogo: idCatalogo, activo: true },
    });
    if (!concepto) {
      throw new NotFoundException(
        `Concepto ${idConcepto} no encontrado en catálogo ${idCatalogo}.`,
      );
    }

    // HU-016: Si se cambia la clave, verificar que siga siendo única
    if (dto.clave_concepto && dto.clave_concepto !== concepto.clave_concepto) {
      const duplicado = await this.conceptoRepository.findOne({
        where: {
          id_catalogo: idCatalogo,
          clave_concepto: dto.clave_concepto,
          activo: true,
        },
      });
      if (duplicado) {
        throw new ConflictException(
          `Ya existe un concepto con la clave '${dto.clave_concepto}' en este catálogo.`,
        );
      }
    }

    // Aplicar cambios parciales
    Object.assign(concepto, dto);
    const saved = await this.conceptoRepository.save(concepto);

    this.logger.log(
      `Concepto ${idConcepto} actualizado en catálogo ${idCatalogo} por usuario ${idUsuario}`,
    );

    // Re-consultar para obtener el importe recalculado
    return this.conceptoRepository.findOneOrFail({
      where: { id_concepto: saved.id_concepto },
    });
  }

  /**
   * Borrado lógico (soft-delete) de un concepto — solo si el catálogo NO está bloqueado.
   */
  async desactivarConcepto(
    idCatalogo: number,
    idConcepto: number,
  ): Promise<{ message: string }> {
    await this.validarCatalogoEditable(idCatalogo);

    const concepto = await this.conceptoRepository.findOne({
      where: { id_concepto: idConcepto, id_catalogo: idCatalogo, activo: true },
    });
    if (!concepto) {
      throw new NotFoundException(
        `Concepto ${idConcepto} no encontrado en catálogo ${idCatalogo}.`,
      );
    }

    concepto.activo = false;
    await this.conceptoRepository.save(concepto);

    this.logger.log(`Concepto ${idConcepto} desactivado (soft-delete) en catálogo ${idCatalogo}`);
    return { message: `Concepto '${concepto.clave_concepto}' desactivado correctamente.` };
  }

  // =========================================================================
  // MÉTODOS DE VALIDACIÓN INTERNOS
  // =========================================================================

  /**
   * Valida que el catálogo exista y esté activo.
   */
  private async validarCatalogoExiste(idCatalogo: number): Promise<Catalogo> {
    const catalogo = await this.catalogoRepository.findOne({
      where: { id_catalogo: idCatalogo, activo: true },
    });
    if (!catalogo) {
      throw new NotFoundException(`Catálogo ${idCatalogo} no encontrado o fue desactivado.`);
    }
    return catalogo;
  }

  /**
   * HU-018 / HU-019: Valida que el catálogo exista, esté activo y NO esté
   * bloqueado. Es el método central que impide modificaciones no autorizadas.
   *
   * Si el catálogo está BLOQUEADO, lanza ForbiddenException indicando que
   * las modificaciones directas están prohibidas conforme al Art. 59 LOPSRM.
   */
  private async validarCatalogoEditable(idCatalogo: number): Promise<Catalogo> {
    const catalogo = await this.validarCatalogoExiste(idCatalogo);

    if (catalogo.estatus_aprobacion === 'BLOQUEADO') {
      throw new ForbiddenException(
        `El catálogo ${idCatalogo} se encuentra BLOQUEADO desde ${catalogo.fecha_bloqueo?.toISOString()}. ` +
        `No se permiten modificaciones directas al catálogo original (HU-019). ` +
        `Para cambios posteriores, genere un catálogo de tipo MODIFICADO o EXTRAORDINARIO.`,
      );
    }

    return catalogo;
  }
}
