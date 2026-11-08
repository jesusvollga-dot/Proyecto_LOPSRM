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
import { HistorialConcepto } from './entities/historial-concepto.entity.js';
import { Convenio } from './entities/convenio.entity.js';
import { Obra } from '../obras/entities/obra.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreatePartidaDto } from './dto/create-partida.dto.js';
import { CreateSubpartidaDto } from './dto/create-subpartida.dto.js';
import { CreateConceptoDto } from './dto/create-concepto.dto.js';
import { UpdateConceptoDto } from './dto/update-concepto.dto.js';
import { BloquearCatalogoDto } from './dto/bloquear-catalogo.dto.js';
import { CreateCatalogoModificadoDto } from './dto/create-catalogo-modificado.dto.js';
import { CreateConceptoExtraordinarioDto } from './dto/create-concepto-extraordinario.dto.js';
import { ModificarCantidadDto } from './dto/modificar-cantidad.dto.js';
import { CreateConvenioDto } from './dto/create-convenio.dto.js';

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
    @InjectRepository(HistorialConcepto)
    private readonly historialRepository: Repository<HistorialConcepto>,
    @InjectRepository(Convenio)
    private readonly convenioRepository: Repository<Convenio>,
    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // =========================================================================
  // CATÁLOGO ORIGINAL — Sprint 3 (HU-014 a HU-019)
  // =========================================================================

  /**
   * Crea un catálogo de tipo ORIGINAL para una obra determinada.
   * Solo puede existir un catálogo ORIGINAL activo por obra.
   */
  async crearCatalogo(idObra: number): Promise<Catalogo> {
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
        catalogo_origen: true,
        usuario_bloqueo: true,
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
        usuario_bloqueo: true,
      },
    });
    if (!catalogo) {
      throw new NotFoundException(
        `No existe un catálogo original activo para la obra ${idObra}.`,
      );
    }
    return catalogo;
  }

  /**
   * HU-027 / HU-033: Obtener todos los catálogos de una obra (Original, Modificados, Extraordinarios).
   */
  async listarCatalogosPorObra(idObra: number): Promise<Catalogo[]> {
    return this.catalogoRepository.find({
      where: { id_obra: idObra, activo: true },
      order: { version: 'ASC', fecha_creacion: 'ASC' },
      relations: {
        catalogo_origen: true,
        usuario_bloqueo: true,
      },
    });
  }

  // =========================================================================
  // HU-014 — Registrar partidas en el catálogo
  // =========================================================================

  async crearPartida(idCatalogo: number, dto: CreatePartidaDto): Promise<Partida> {
    const catalogo = await this.validarCatalogoEditable(idCatalogo);

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

  async crearSubpartida(
    idCatalogo: number,
    idPartida: number,
    dto: CreateSubpartidaDto,
  ): Promise<Subpartida> {
    await this.validarCatalogoEditable(idCatalogo);

    const partida = await this.partidaRepository.findOne({
      where: { id_partida: idPartida, id_catalogo: idCatalogo, activo: true },
    });
    if (!partida) {
      throw new NotFoundException(
        `Partida ${idPartida} no encontrada en el catálogo ${idCatalogo}.`,
      );
    }

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

  async listarSubpartidas(idPartida: number): Promise<Subpartida[]> {
    return this.subpartidaRepository.find({
      where: { id_partida: idPartida, activo: true },
      order: { codigo_subpartida: 'ASC' },
    });
  }

  // =========================================================================
  // HU-016 + HU-017 — Asignar ID único y capturar datos de cada concepto
  // =========================================================================

  async crearConcepto(idCatalogo: number, dto: CreateConceptoDto): Promise<Concepto> {
    const catalogo = await this.validarCatalogoEditable(idCatalogo);

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

    return this.conceptoRepository.findOneOrFail({
      where: { id_concepto: saved.id_concepto },
    });
  }

  async listarConceptos(idCatalogo: number): Promise<Concepto[]> {
    await this.validarCatalogoExiste(idCatalogo);
    return this.conceptoRepository.find({
      where: { id_catalogo: idCatalogo, activo: true },
      order: { clave_concepto: 'ASC' },
    });
  }

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
  // HU-018 — Bloquear el catálogo original
  // =========================================================================

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

  async actualizarConcepto(
    idCatalogo: number,
    idConcepto: number,
    dto: UpdateConceptoDto,
    idUsuario: number,
  ): Promise<Concepto> {
    await this.validarCatalogoEditable(idCatalogo);

    const concepto = await this.conceptoRepository.findOne({
      where: { id_concepto: idConcepto, id_catalogo: idCatalogo, activo: true },
    });
    if (!concepto) {
      throw new NotFoundException(
        `Concepto ${idConcepto} no encontrado en catálogo ${idCatalogo}.`,
      );
    }

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

    Object.assign(concepto, dto);
    const saved = await this.conceptoRepository.save(concepto);

    this.logger.log(
      `Concepto ${idConcepto} actualizado en catálogo ${idCatalogo} por usuario ${idUsuario}`,
    );

    return this.conceptoRepository.findOneOrFail({
      where: { id_concepto: saved.id_concepto },
    });
  }

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
  // ===================== SPRINT 5: HU-027 A HU-033 ==========================
  // =========================================================================

  // =========================================================================
  // HU-027 — Crear catálogo modificado a partir del original
  // =========================================================================

  /**
   * HU-027: Como Superintendente quiero crear un catálogo modificado mediante
   * un formulario para registrar los cambios de cantidades autorizados para la obra.
   *
   * Criterio de Aceptación: Un usuario autorizado puede crear una versión
   * modificada sin alterar el catálogo original.
   * Tareas: Copiar estructura base; permitir modificaciones autorizadas; relacionar con original; probar trazabilidad
   */
  async crearCatalogoModificado(
    idObra: number,
    idUsuario: number,
    dto: CreateCatalogoModificadoDto,
  ): Promise<Catalogo> {
    const obra = await this.obraRepository.findOne({
      where: { id_obra: idObra, activo: true },
    });
    if (!obra) {
      throw new NotFoundException(`La obra con ID ${idObra} no existe o fue desactivada.`);
    }

    // El catálogo original debe existir
    const catalogoOriginal = await this.catalogoRepository.findOne({
      where: { id_obra: idObra, tipo_catalogo: 'ORIGINAL', activo: true },
      relations: {
        partidas: {
          subpartidas: true,
        },
        conceptos: true,
      },
    });
    if (!catalogoOriginal) {
      throw new BadRequestException(
        `Para crear un catálogo modificado, la obra debe contar primero con un catálogo original.`,
      );
    }

    // Calcular la siguiente versión del catálogo
    const todosCatalogosObra = await this.catalogoRepository.find({
      where: { id_obra: idObra, activo: true },
    });
    const maxVersion = todosCatalogosObra.reduce(
      (max, cat) => (cat.version > max ? cat.version : max),
      1,
    );
    const siguienteVersion = maxVersion + 1;

    // Crear la entidad del catálogo modificado vinculada al original
    const nuevoCatalogo = this.catalogoRepository.create({
      id_obra: idObra,
      tipo_catalogo: 'MODIFICADO',
      version: siguienteVersion,
      estatus_aprobacion: 'BORRADOR',
      id_catalogo_origen: catalogoOriginal.id_catalogo,
      id_convenio: dto.id_convenio ?? null,
      descripcion:
        dto.descripcion ??
        `Catálogo modificado Versión ${siguienteVersion} derivado de ajustes volumétricos autorizados conforme a la LOPSRM.`,
    });

    const savedCatalogo = await this.catalogoRepository.save(nuevoCatalogo);

    // Mapeo de IDs de partidas para mantener la integridad referencial en la copia
    const mapaPartidas = new Map<number, number>();
    const mapaSubpartidas = new Map<number, number>();

    // 1. Copiar partidas base
    if (catalogoOriginal.partidas && catalogoOriginal.partidas.length > 0) {
      for (const pOrig of catalogoOriginal.partidas) {
        if (!pOrig.activo) continue;
        const nuevaPartida = this.partidaRepository.create({
          id_catalogo: savedCatalogo.id_catalogo,
          codigo_partida: pOrig.codigo_partida,
          nombre_partida: pOrig.nombre_partida,
          descripcion: pOrig.descripcion,
        });
        const savedPartida = await this.partidaRepository.save(nuevaPartida);
        mapaPartidas.set(pOrig.id_partida, savedPartida.id_partida);

        // Copiar subpartidas de la partida
        if (pOrig.subpartidas && pOrig.subpartidas.length > 0) {
          for (const sOrig of pOrig.subpartidas) {
            if (!sOrig.activo) continue;
            const nuevaSub = this.subpartidaRepository.create({
              id_partida: savedPartida.id_partida,
              codigo_subpartida: sOrig.codigo_subpartida,
              nombre_subpartida: sOrig.nombre_subpartida,
              descripcion: sOrig.descripcion,
            });
            const savedSub = await this.subpartidaRepository.save(nuevaSub);
            mapaSubpartidas.set(sOrig.id_subpartida, savedSub.id_subpartida);
          }
        }
      }
    }

    // 2. Copiar conceptos base (preservando clave, unidad, precios y relacionando al original)
    if (catalogoOriginal.conceptos && catalogoOriginal.conceptos.length > 0) {
      for (const cOrig of catalogoOriginal.conceptos) {
        if (!cOrig.activo) continue;
        const nuevoConcepto = this.conceptoRepository.create({
          id_catalogo: savedCatalogo.id_catalogo,
          id_partida: cOrig.id_partida ? mapaPartidas.get(cOrig.id_partida) ?? null : null,
          id_subpartida: cOrig.id_subpartida
            ? mapaSubpartidas.get(cOrig.id_subpartida) ?? null
            : null,
          partida: cOrig.partida,
          subpartida: cOrig.subpartida,
          clave_concepto: cOrig.clave_concepto,
          descripcion: cOrig.descripcion,
          unidad_medida: cOrig.unidad_medida,
          cantidad: cOrig.cantidad,
          costo_directo_unitario: cOrig.costo_directo_unitario,
          id_concepto_origen: cOrig.id_concepto,
          es_extraordinario: false,
        });
        await this.conceptoRepository.save(nuevoConcepto);
      }
    }

    this.logger.log(
      `HU-027 — Catálogo Modificado v${siguienteVersion} creado (ID: ${savedCatalogo.id_catalogo}) ` +
      `a partir de Catálogo Original ${catalogoOriginal.id_catalogo} sin alterarlo.`,
    );

    // HU-030/HU-031/HU-033: Registrar evento de auditoría de creación de catálogo modificado
    // Buscamos un concepto representativo o registramos el evento
    const primerConcepto = await this.conceptoRepository.findOne({
      where: { id_catalogo: savedCatalogo.id_catalogo, activo: true },
    });
    if (primerConcepto) {
      await this.registrarHistorial({
        id_concepto: primerConcepto.id_concepto,
        id_catalogo: savedCatalogo.id_catalogo,
        id_usuario_modifica: idUsuario,
        campo_modificado: 'creacion_catalogo_modificado',
        valor_anterior: `Catálogo Original v${catalogoOriginal.version}`,
        valor_nuevo: `Catálogo Modificado v${siguienteVersion}`,
        justificacion:
          dto.descripcion ??
          'Creación de versión modificada para registrar ajustes de volumen autorizados (HU-027)',
        evento: 'CREACION_CATALOGO_MODIFICADO',
      });
    }

    return this.obtenerCatalogo(savedCatalogo.id_catalogo);
  }

  // =========================================================================
  // HU-028 — Registrar conceptos extraordinarios
  // =========================================================================

  /**
   * HU-028: Como Superintendente quiero registrar conceptos extraordinarios
   * para incorporar trabajos no contemplados en el catálogo original.
   *
   * Criterio de Aceptación: Se pueden registrar conceptos no contemplados originalmente.
   * Tareas: Crear formulario; validar concepto; asignar identificador; guardar extraordinario
   */
  async crearConceptoExtraordinario(
    idObra: number,
    idUsuario: number,
    dto: CreateConceptoExtraordinarioDto,
  ): Promise<Concepto> {
    const obra = await this.obraRepository.findOne({
      where: { id_obra: idObra, activo: true },
    });
    if (!obra) {
      throw new NotFoundException(`La obra con ID ${idObra} no existe.`);
    }

    // Buscar o inicializar catálogo de tipo EXTRAORDINARIO para la obra
    let catalogoExtra = await this.catalogoRepository.findOne({
      where: { id_obra: idObra, tipo_catalogo: 'EXTRAORDINARIO', activo: true },
    });

    if (!catalogoExtra) {
      catalogoExtra = this.catalogoRepository.create({
        id_obra: idObra,
        tipo_catalogo: 'EXTRAORDINARIO',
        version: 1,
        estatus_aprobacion: 'BORRADOR',
        descripcion: 'Catálogo de Conceptos Extraordinarios (Trabajos no contemplados originalmente).',
      });
      catalogoExtra = await this.catalogoRepository.save(catalogoExtra);
      this.logger.log(
        `Catálogo EXTRAORDINARIO creado automáticamente para obra ${idObra} → ID ${catalogoExtra.id_catalogo}`,
      );
    }

    // Validar que no exista un concepto con la misma clave en este catálogo extraordinario
    const duplicado = await this.conceptoRepository.findOne({
      where: {
        id_catalogo: catalogoExtra.id_catalogo,
        clave_concepto: dto.clave_concepto.trim().toUpperCase(),
        activo: true,
      },
    });
    if (duplicado) {
      throw new ConflictException(
        `Ya existe un concepto extraordinario con la clave '${dto.clave_concepto}' en esta obra.`,
      );
    }

    // Asegurar una partida de conceptos extraordinarios
    const nombrePartida = dto.partida?.trim() || 'TRABAJOS EXTRAORDINARIOS';
    let partida = await this.partidaRepository.findOne({
      where: {
        id_catalogo: catalogoExtra.id_catalogo,
        codigo_partida: 'EXT',
        activo: true,
      },
    });

    if (!partida) {
      partida = this.partidaRepository.create({
        id_catalogo: catalogoExtra.id_catalogo,
        codigo_partida: 'EXT',
        nombre_partida: nombrePartida,
        descripcion: 'Partida especial para conceptos y trabajos extraordinarios no contemplados en contrato base.',
      });
      partida = await this.partidaRepository.save(partida);
    }

    // Crear el concepto extraordinario
    const concepto = this.conceptoRepository.create({
      id_catalogo: catalogoExtra.id_catalogo,
      id_partida: partida.id_partida,
      partida: partida.nombre_partida,
      subpartida: dto.subpartida ?? null,
      clave_concepto: dto.clave_concepto.trim().toUpperCase(),
      descripcion: dto.descripcion.trim(),
      unidad_medida: dto.unidad_medida.trim().toUpperCase(),
      cantidad: dto.cantidad,
      costo_directo_unitario: dto.costo_directo_unitario,
      es_extraordinario: true,
    });

    const saved = await this.conceptoRepository.save(concepto);

    // HU-030/HU-031/HU-033: Registrar evento de auditoría
    await this.registrarHistorial({
      id_concepto: saved.id_concepto,
      id_catalogo: catalogoExtra.id_catalogo,
      id_usuario_modifica: idUsuario,
      campo_modificado: 'alta_concepto_extraordinario',
      valor_anterior: null,
      valor_nuevo: `Clave: ${saved.clave_concepto} | Cantidad: ${saved.cantidad} | P.U: $${saved.costo_directo_unitario}`,
      justificacion:
        dto.justificacion ??
        'Registro de concepto extraordinario no previsto en el proyecto original (HU-028)',
      evento: 'CONCEPTO_EXTRAORDINARIO',
    });

    this.logger.log(
      `HU-028 — Concepto extraordinario '${saved.clave_concepto}' registrado con éxito en obra ${idObra}.`,
    );

    return this.conceptoRepository.findOneOrFail({
      where: { id_concepto: saved.id_concepto },
    });
  }

  // =========================================================================
  // HU-029 — Registrar convenios relacionados con volumen
  // =========================================================================

  /**
   * HU-029: Como Supervisor, Residente o Administrador quiero registrar y
   * consultar convenios relacionados con modificaciones de volumen para
   * mantener actualizada la información de la obra.
   *
   * Criterio de Aceptación: Los convenios de volumen quedan registrados y
   * relacionados con la obra/catálogo.
   * Tareas: Diseñar entidad/convenio; capturar volumen; validar datos; consultar convenio
   */
  async crearConvenio(
    idObra: number,
    idUsuario: number,
    dto: CreateConvenioDto,
  ): Promise<Convenio> {
    const obra = await this.obraRepository.findOne({
      where: { id_obra: idObra, activo: true },
    });
    if (!obra) {
      throw new NotFoundException(`La obra con ID ${idObra} no existe.`);
    }

    // Validar unicidad del número de convenio por obra
    const existente = await this.convenioRepository.findOne({
      where: {
        id_obra: idObra,
        numero_convenio: dto.numero_convenio.trim().toUpperCase(),
        activo: true,
      },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe un convenio registrado con el número '${dto.numero_convenio}' para esta obra.`,
      );
    }

    // Si viene id_catalogo, verificar que pertenezca a la obra
    if (dto.id_catalogo) {
      const cat = await this.catalogoRepository.findOne({
        where: { id_catalogo: dto.id_catalogo, id_obra: idObra, activo: true },
      });
      if (!cat) {
        throw new NotFoundException(
          `El catálogo ${dto.id_catalogo} no pertenece a la obra ${idObra}.`,
        );
      }
    }

    const convenio = this.convenioRepository.create({
      id_obra: idObra,
      id_catalogo: dto.id_catalogo ?? null,
      numero_convenio: dto.numero_convenio.trim().toUpperCase(),
      tipo_convenio: dto.tipo_convenio ?? 'MODIFICATORIO_VOLUMEN',
      descripcion: dto.descripcion.trim(),
      fecha_firma: dto.fecha_firma,
      monto_adicional: dto.monto_adicional ?? 0.0,
      porcentaje_variacion: dto.porcentaje_variacion ?? 0.0,
      dias_ampliacion: dto.dias_ampliacion ?? 0,
      id_usuario_registro: idUsuario,
      estatus: 'AUTORIZADO',
    });

    const saved = await this.convenioRepository.save(convenio);

    // Si el catálogo existe, actualizar su referencia de id_convenio
    if (dto.id_catalogo) {
      await this.catalogoRepository.update(
        { id_catalogo: dto.id_catalogo },
        { id_convenio: saved.id_convenio },
      );
    }

    this.logger.log(
      `HU-029 — Convenio '${saved.numero_convenio}' (${saved.tipo_convenio}) registrado para obra ${idObra}`,
    );

    return this.convenioRepository.findOneOrFail({
      where: { id_convenio: saved.id_convenio },
      relations: {
        obra: true,
        catalogo: true,
        usuario_registro: true,
      },
    });
  }

  /**
   * Listar convenios de una obra.
   */
  async listarConveniosPorObra(idObra: number): Promise<Convenio[]> {
    return this.convenioRepository.find({
      where: { id_obra: idObra, activo: true },
      relations: {
        catalogo: true,
        usuario_registro: true,
      },
      order: { fecha_firma: 'DESC', fecha_creacion: 'DESC' },
    });
  }

  /**
   * Consultar detalle de un convenio individual.
   */
  async obtenerConvenio(idConvenio: number): Promise<Convenio> {
    const conv = await this.convenioRepository.findOne({
      where: { id_convenio: idConvenio, activo: true },
      relations: {
        obra: true,
        catalogo: true,
        usuario_registro: true,
      },
    });
    if (!conv) {
      throw new NotFoundException(`Convenio ${idConvenio} no encontrado.`);
    }
    return conv;
  }

  // =========================================================================
  // HU-030 / HU-031 / HU-033 — Modificación de cantidad con auditoría estricta
  // =========================================================================

  /**
   * Modifica la cantidad/volumen de un concepto en un catálogo modificado,
   * registrando estrictamente quién (HU-030), cuándo (HU-031) y conservando
   * la trazabilidad inalterable (HU-033).
   */
  async modificarCantidadConcepto(
    idCatalogo: number,
    idConcepto: number,
    idUsuario: number,
    dto: ModificarCantidadDto,
  ): Promise<Concepto> {
    const catalogo = await this.catalogoRepository.findOne({
      where: { id_catalogo: idCatalogo, activo: true },
    });
    if (!catalogo) {
      throw new NotFoundException(`Catálogo ${idCatalogo} no encontrado.`);
    }

    // Si es ORIGINAL y está BLOQUEADO, se prohíbe terminantemente (HU-019)
    if (catalogo.tipo_catalogo === 'ORIGINAL' && catalogo.estatus_aprobacion === 'BLOQUEADO') {
      throw new ForbiddenException(
        `El catálogo ORIGINAL está formalmente BLOQUEADO conforme al Art. 59 LOPSRM. ` +
        `Para modificar cantidades, cree un catálogo MODIFICADO a partir del original (HU-027).`,
      );
    }

    const concepto = await this.conceptoRepository.findOne({
      where: { id_concepto: idConcepto, id_catalogo: idCatalogo, activo: true },
    });
    if (!concepto) {
      throw new NotFoundException(
        `Concepto ${idConcepto} no encontrado en el catálogo ${idCatalogo}.`,
      );
    }

    const cantidadAnterior = Number(concepto.cantidad);
    const cantidadNueva = Number(dto.cantidad_nueva);

    if (cantidadNueva === cantidadAnterior) {
      throw new BadRequestException(
        `La nueva cantidad (${cantidadNueva}) es idéntica a la cantidad actual. No se detectan cambios de volumen.`,
      );
    }

    concepto.cantidad = cantidadNueva;
    const saved = await this.conceptoRepository.save(concepto);

    // HU-030 & HU-031: Registrar automáticamente usuario y timestamp en historial inmutable
    await this.registrarHistorial({
      id_concepto: concepto.id_concepto,
      id_catalogo: idCatalogo,
      id_usuario_modifica: idUsuario,
      campo_modificado: 'cantidad',
      valor_anterior: String(cantidadAnterior),
      valor_nuevo: String(cantidadNueva),
      justificacion: dto.justificacion.trim(),
      evento: 'MODIFICACION_CANTIDAD',
    });

    this.logger.log(
      `HU-030/031 — Cantidad de concepto '${concepto.clave_concepto}' modificada ` +
      `de ${cantidadAnterior} a ${cantidadNueva} por usuario ${idUsuario}. Justificación: ${dto.justificacion}`,
    );

    return this.conceptoRepository.findOneOrFail({
      where: { id_concepto: saved.id_concepto },
    });
  }

  // =========================================================================
  // HU-032 & HU-033 — Consultar historial de modificaciones y trazabilidad
  // =========================================================================

  /**
   * HU-032: Como Supervisor, Residente o Administrador quiero consultar el
   * historial de modificaciones para conocer quién realizó cada cambio y
   * cuándo se realizó.
   *
   * Criterio de Aceptación: Un usuario autorizado puede consultar quién
   * modificó qué y cuándo.
   */
  async obtenerHistorialCatalogo(idCatalogo: number): Promise<HistorialConcepto[]> {
    await this.validarCatalogoExiste(idCatalogo);
    return this.historialRepository.find({
      where: { id_catalogo: idCatalogo },
      relations: {
        concepto: true,
        usuario: {
          rol: true,
        },
      },
      order: { fecha_modificacion: 'DESC' },
    });
  }

  /**
   * HU-032 / HU-033: Consulta histórica consolidada por obra con filtros periciales.
   */
  async obtenerHistorialObra(
    idObra: number,
    filtros?: {
      id_concepto?: number;
      id_usuario?: number;
      evento?: string;
    },
  ): Promise<HistorialConcepto[]> {
    const qb = this.historialRepository
      .createQueryBuilder('hist')
      .leftJoinAndSelect('hist.concepto', 'concepto')
      .leftJoinAndSelect('hist.catalogo', 'catalogo')
      .leftJoinAndSelect('hist.usuario', 'usuario')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('catalogo.id_obra = :idObra', { idObra });

    if (filtros?.id_concepto) {
      qb.andWhere('hist.id_concepto = :idConcepto', { idConcepto: filtros.id_concepto });
    }

    if (filtros?.id_usuario) {
      qb.andWhere('hist.id_usuario_modifica = :idUsuario', { idUsuario: filtros.id_usuario });
    }

    if (filtros?.evento) {
      qb.andWhere('hist.evento = :evento', { evento: filtros.evento });
    }

    qb.orderBy('hist.fecha_modificacion', 'DESC');
    return qb.getMany();
  }

  /**
   * HU-033: Registro inmutable de eventos de auditoría pericial.
   * Este método garantiza que no existan operaciones de modificación o borrado
   * sobre los logs de auditoría, protegiendo la trazabilidad jurídica.
   */
  private async registrarHistorial(data: {
    id_concepto: number;
    id_catalogo?: number | null;
    id_usuario_modifica: number;
    campo_modificado: string;
    valor_anterior: string | null;
    valor_nuevo: string | null;
    justificacion: string;
    evento?: string;
  }): Promise<HistorialConcepto> {
    const registro = this.historialRepository.create({
      id_concepto: data.id_concepto,
      id_catalogo: data.id_catalogo ?? null,
      id_usuario_modifica: data.id_usuario_modifica,
      campo_modificado: data.campo_modificado,
      valor_anterior: data.valor_anterior,
      valor_nuevo: data.valor_nuevo,
      justificacion: data.justificacion,
      evento: data.evento ?? 'MODIFICACION_CANTIDAD',
      fecha_modificacion: new Date(),
    });
    return this.historialRepository.save(registro);
  }

  // =========================================================================
  // MÉTODOS DE VALIDACIÓN INTERNOS
  // =========================================================================

  private async validarCatalogoExiste(idCatalogo: number): Promise<Catalogo> {
    const catalogo = await this.catalogoRepository.findOne({
      where: { id_catalogo: idCatalogo, activo: true },
    });
    if (!catalogo) {
      throw new NotFoundException(`Catálogo ${idCatalogo} no encontrado o fue desactivado.`);
    }
    return catalogo;
  }

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
