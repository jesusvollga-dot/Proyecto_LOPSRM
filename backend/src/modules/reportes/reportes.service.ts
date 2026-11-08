import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReporteDiario } from './entities/reporte-diario.entity.js';
import { FotoReporte } from './entities/foto-reporte.entity.js';
import { IncidenciaReporte } from './entities/incidencia-reporte.entity.js';
import { Obra } from '../obras/entities/obra.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateReporteDiarioDto } from './dto/create-reporte-diario.dto.js';
import { FilterReportesDto } from './dto/filter-reportes.dto.js';
import { RoleEnum } from '../../common/enums/role.enum.js';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    @InjectRepository(ReporteDiario)
    private readonly reporteRepository: Repository<ReporteDiario>,
    @InjectRepository(FotoReporte)
    private readonly fotoRepository: Repository<FotoReporte>,
    @InjectRepository(IncidenciaReporte)
    private readonly incidenciaRepository: Repository<IncidenciaReporte>,
    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * HU-034: Registrar reporte diario de obra
   * HU-035: Registrar condiciones meteorológicas
   * HU-036: Registrar condiciones de seguridad
   * HU-037: Registrar cumplimiento del EPP
   * HU-038: Registrar personal presente (cuadrillas)
   * HU-039: Registrar maquinaria utilizada
   */
  async crearReporte(usuario: any, dto: CreateReporteDiarioDto): Promise<ReporteDiario> {
    const idSupervisor = usuario.sub || usuario.id_usuario;

    // 1. Validar que la obra exista y esté activa
    const obra = await this.obraRepository.findOne({
      where: { id_obra: dto.id_obra, activo: true },
    });
    if (!obra) {
      throw new NotFoundException(`La obra con ID ${dto.id_obra} no existe o no se encuentra activa.`);
    }

    // 2. Validar que no exista ya un reporte para esa fecha en la misma obra (Unicidad)
    const reporteExistente = await this.reporteRepository.findOne({
      where: { id_obra: dto.id_obra, fecha_reporte: dto.fecha_reporte },
    });
    if (reporteExistente) {
      throw new ConflictException(
        `Ya existe un reporte diario registrado para la obra "${obra.clave_obra}" en la fecha ${dto.fecha_reporte}.`,
      );
    }

    // 3. Validar consistencia de avance físico acumulado (Avance_t >= Avance_t-1)
    const ultimoReporte = await this.reporteRepository
      .createQueryBuilder('r')
      .where('r.id_obra = :idObra', { idObra: dto.id_obra })
      .andWhere('r.activo = true')
      .orderBy('r.fecha_reporte', 'DESC')
      .getOne();

    const avanceNuevo = Number(dto.avance_fisico_acumulado ?? 0);
    if (ultimoReporte) {
      const avanceAnterior = Number(ultimoReporte.avance_fisico_acumulado);
      if (avanceNuevo < avanceAnterior) {
        throw new BadRequestException(
          `El avance físico acumulado (${avanceNuevo}%) no puede ser inferior al último reportado (${avanceAnterior}% registrado el ${ultimoReporte.fecha_reporte}).`,
        );
      }
    }

    // 4. Validar límite de fotos (máximo 6 según RF-13)
    if (dto.fotos && dto.fotos.length > 6) {
      throw new BadRequestException('El reporte permite un máximo de 6 fotografías de evidencia (RF-13).');
    }

    // 5. Crear la entidad ReporteDiario
    const nuevoReporte = this.reporteRepository.create({
      id_obra: dto.id_obra,
      id_supervisor: idSupervisor,
      fecha_reporte: dto.fecha_reporte,
      clima: dto.clima,
      temperatura_celsius: dto.temperatura_celsius ?? null,
      observaciones_clima: dto.observaciones_clima ?? null,
      senalamiento_preventivo: dto.senalamiento_preventivo ?? false,
      condiciones_seguridad: dto.condiciones_seguridad ?? null,
      checklist_seguridad: dto.checklist_seguridad ?? null,
      observaciones_seguridad: dto.observaciones_seguridad ?? null,
      equipo_proteccion_epp: dto.equipo_proteccion_epp ?? false,
      checklist_epp: dto.checklist_epp ?? null,
      observaciones_epp: dto.observaciones_epp ?? null,
      suministro_material: dto.suministro_material ?? false,
      estatus_personal: dto.estatus_personal ?? 'Suficiente',
      resumen_cuadrilla: dto.resumen_cuadrilla ?? [],
      maquinaria_sitio: dto.maquinaria_sitio ?? [],
      actividades_realizadas: dto.actividades_realizadas ?? null,
      avance_fisico_acumulado: avanceNuevo,
      fecha_estimada_fin: dto.fecha_estimada_fin ?? null,
      activo: true,
    });

    const reporteGuardado = await this.reporteRepository.save(nuevoReporte);

    // 6. Persistir fotos si se proveyeron
    if (dto.fotos && dto.fotos.length > 0) {
      const fotosEntities = dto.fotos.map((f) =>
        this.fotoRepository.create({
          id_reporte: reporteGuardado.id_reporte,
          numero_foto: f.numero_foto,
          url_archivo: f.url_archivo,
          descripcion_foto: f.descripcion_foto ?? null,
        }),
      );
      await this.fotoRepository.save(fotosEntities);
    }

    // 7. Persistir incidencias si se proveyeron
    if (dto.incidencias && dto.incidencias.length > 0) {
      const incidenciasEntities = dto.incidencias.map((inc) =>
        this.incidenciaRepository.create({
          id_reporte: reporteGuardado.id_reporte,
          tipo: inc.tipo,
          descripcion: inc.descripcion,
          acciones_a_seguir: inc.acciones_a_seguir,
          estatus: inc.estatus ?? 'Pendiente',
          fecha_solucion: inc.fecha_solucion ?? null,
        }),
      );
      await this.incidenciaRepository.save(incidenciasEntities);
    }

    this.logger.log(
      `Reporte diario #${reporteGuardado.id_reporte} registrado para obra ID ${dto.id_obra} por supervisor ID ${idSupervisor}.`,
    );

    return this.obtenerReportePorId(reporteGuardado.id_reporte);
  }

  /**
   * HU-040: Consultar bitácora diaria con filtros por fecha, obra y clima
   */
  async consultarBitacora(usuario: any, filtros?: FilterReportesDto): Promise<ReporteDiario[]> {
    const qb = this.reporteRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.obra', 'obra')
      .leftJoinAndSelect('r.supervisor', 'supervisor')
      .leftJoinAndSelect('r.fotos', 'fotos')
      .leftJoinAndSelect('r.incidencias', 'incidencias')
      .where('r.activo = true');

    if (filtros?.id_obra) {
      qb.andWhere('r.id_obra = :idObra', { idObra: filtros.id_obra });
    }

    if (filtros?.fecha_inicio) {
      qb.andWhere('r.fecha_reporte >= :fechaInicio', { fechaInicio: filtros.fecha_inicio });
    }

    if (filtros?.fecha_fin) {
      qb.andWhere('r.fecha_reporte <= :fechaFin', { fechaFin: filtros.fecha_fin });
    }

    if (filtros?.clima) {
      qb.andWhere('r.clima = :clima', { clima: filtros.clima });
    }

    qb.orderBy('r.fecha_reporte', 'DESC').addOrderBy('r.id_reporte', 'DESC');

    return qb.getMany();
  }

  /**
   * Consulta el detalle completo de un reporte diario
   */
  async obtenerReportePorId(idReporte: number): Promise<ReporteDiario> {
    const reporte = await this.reporteRepository.findOne({
      where: { id_reporte: idReporte, activo: true },
      relations: { obra: true, supervisor: true, fotos: true, incidencias: true },
    });

    if (!reporte) {
      throw new NotFoundException(`El reporte diario #${idReporte} no existe.`);
    }

    return reporte;
  }

  /**
   * Obtiene el último reporte diario de una obra para precargar datos de avance
   */
  async obtenerUltimoReporteObra(idObra: number): Promise<ReporteDiario | null> {
    const reporte = await this.reporteRepository.findOne({
      where: { id_obra: idObra, activo: true },
      order: { fecha_reporte: 'DESC' },
      relations: { fotos: true, incidencias: true },
    });

    return reporte;
  }
}
