import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obra } from './entities/obra.entity.js';
import { AsignacionObra } from './entities/asignacion-obra.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateObraDto } from './dto/create-obra.dto.js';
import { AssignCuadrillaDto } from './dto/assign-cuadrilla.dto.js';
import { UpdateObraStatusDto } from './dto/update-obra-status.dto.js';

@Injectable()
export class ObrasService {
  private readonly logger = new Logger(ObrasService.name);

  constructor(
    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
    @InjectRepository(AsignacionObra)
    private readonly asignacionRepository: Repository<AsignacionObra>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * HU-007, HU-008, HU-009: Alta formal de obra pública con presupuesto y fechas
   */
  async create(dto: CreateObraDto): Promise<Obra> {
    // Validación de anticipo máximo del 30%
    if (dto.porcentaje_anticipo !== undefined && (dto.porcentaje_anticipo < 0 || dto.porcentaje_anticipo > 30)) {
      throw new BadRequestException(
        'El porcentaje de anticipo debe encontrarse entre 0% y 30% del total de la obra.',
      );
    }

    // Validación de que la fecha de inicio no sea anterior a la fecha actual (no fechas pasadas)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (dto.fecha_inicio_programada < todayStr) {
      throw new BadRequestException(
        'Inconsistencia en fechas: La fecha de inicio programada no puede ser una fecha pasada (anterior a la fecha actual).',
      );
    }

    // Validación de que la fecha final no preceda a la inicial
    if (dto.fecha_termino_programada < dto.fecha_inicio_programada) {
      throw new BadRequestException(
        'Inconsistencia en fechas: La fecha de término programada no puede ser anterior a la fecha de inicio programada.',
      );
    }

    // HU-007: Unicidad de clave de obra
    const existingClave = await this.obraRepository.findOne({
      where: { clave_obra: dto.clave_obra },
    });
    if (existingClave) {
      throw new ConflictException(
        `La clave de obra '${dto.clave_obra}' ya se encuentra registrada`,
      );
    }

    // HU-007: Unicidad de número de contrato
    const existingContrato = await this.obraRepository.findOne({
      where: { numero_contrato: dto.numero_contrato },
    });
    if (existingContrato) {
      throw new ConflictException(
        `El número de contrato '${dto.numero_contrato}' ya se encuentra registrado`,
      );
    }

    const nuevaObra = this.obraRepository.create({
      clave_obra: dto.clave_obra,
      nombre_obra: dto.nombre_obra,
      numero_contrato: dto.numero_contrato,
      presupuesto_autorizado: dto.presupuesto_autorizado,
      porcentaje_anticipo: dto.porcentaje_anticipo ?? 30.0,
      fecha_inicio_programada: dto.fecha_inicio_programada,
      fecha_termino_programada: dto.fecha_termino_programada,
      estatus: 'EN_EJECUCION',
      activo: true,
    });

    return this.obraRepository.save(nuevaObra);
  }

  /**
   * Listar todas las obras activas (Vista general para Administrador y Director)
   */
  async findAll(): Promise<Obra[]> {
    return this.obraRepository.find({
      where: { activo: true },
      relations: {
        asignaciones: {
          usuario: {
            rol: true,
          },
        },
      },
      order: { fecha_creacion: 'DESC' },
    });
  }

  /**
   * HU-013: Consultar obras asignadas a un usuario según su rol operativo
   */
  async findMyWorks(userId: number, roleName?: string): Promise<Obra[]> {
    // Si es Administrador o Director, tiene visibilidad de todas las obras
    if (roleName === 'ADMINISTRADOR' || roleName === 'DIRECTOR') {
      return this.findAll();
    }

    // Para Residente, Superintendente o Supervisor: aislamiento por asignación
    return this.obraRepository
      .createQueryBuilder('obra')
      .innerJoinAndSelect('obra.asignaciones', 'asig', 'asig.activo = :asigActivo', { asigActivo: true })
      .innerJoinAndSelect('asig.usuario', 'usuario')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('obra.activo = :obraActivo', { obraActivo: true })
      .andWhere('asig.id_usuario = :userId', { userId })
      .orderBy('obra.fecha_creacion', 'DESC')
      .getMany();
  }

  /**
   * Buscar detalle de obra por ID
   */
  async findById(id_obra: number): Promise<Obra> {
    const obra = await this.obraRepository.findOne({
      where: { id_obra, activo: true },
      relations: {
        asignaciones: {
          usuario: {
            rol: true,
          },
        },
      },
    });

    if (!obra) {
      throw new NotFoundException(`Obra con ID ${id_obra} no encontrada`);
    }

    return obra;
  }

  /**
   * HU-010, HU-011, HU-012: Asignación de la terna operativa (Residente, Superintendente, Supervisor)
   * Valida existencia de obra, usuario activo, correspondencia de rol normativo y unicidad
   */
  async assignCuadrilla(id_obra: number, dto: AssignCuadrillaDto): Promise<Obra> {
    const obra = await this.findById(id_obra);

    const user = await this.userRepository.findOne({
      where: { id_usuario: dto.id_usuario },
      relations: { rol: true },
    });

    if (!user) {
      throw new NotFoundException(`El usuario con ID ${dto.id_usuario} no existe`);
    }

    if (!user.activo) {
      throw new BadRequestException(
        `El usuario '${user.nombre_completo}' se encuentra inactivo. Debe ser activado antes de asignarlo a una obra.`,
      );
    }

    // Regla de Negocio LOPSRM: El rol en el sistema debe coincidir con la figura operativa
    if (!user.rol || user.rol.nombre_rol !== dto.rol_en_obra) {
      throw new BadRequestException(
        `Incompatibilidad de rol: El usuario '${user.nombre_completo}' tiene rol '${user.rol?.nombre_rol || 'SIN ROL'}', pero se intenta asignar como '${dto.rol_en_obra}'.`,
      );
    }

    // Manejo de duplicados y reasignación limpia (respetando uq_obra_rol)
    let asignacion = await this.asignacionRepository.findOne({
      where: { id_obra: obra.id_obra, rol_en_obra: dto.rol_en_obra },
    });

    if (asignacion) {
      asignacion.id_usuario = user.id_usuario;
      asignacion.activo = true;
    } else {
      asignacion = this.asignacionRepository.create({
        id_obra: obra.id_obra,
        id_usuario: user.id_usuario,
        rol_en_obra: dto.rol_en_obra,
        activo: true,
      });
    }

    await this.asignacionRepository.save(asignacion);
    return this.findById(id_obra);
  }

  /**
   * Obtener candidatos activos agrupados por los 3 roles de la terna
   * Facilita el llenado de los selectores en el frontend
   */
  async getCandidates() {
    const activeUsers = await this.userRepository.find({
      where: { activo: true },
      relations: { rol: true },
      order: { nombre_completo: 'ASC' },
    });

    return {
      residentes: activeUsers.filter((u) => u.rol?.nombre_rol === 'RESIDENTE'),
      superintendentes: activeUsers.filter((u) => u.rol?.nombre_rol === 'SUPERINTENDENTE'),
      supervisores: activeUsers.filter((u) => u.rol?.nombre_rol === 'SUPERVISOR'),
    };
  }

  /**
   * Actualizar estatus operativo de la obra (EN_EJECUCION, SUSPENDIDA, TERMINADA, FINIQUITADA)
   */
  async updateStatus(id_obra: number, dto: UpdateObraStatusDto): Promise<Obra> {
    const obra = await this.findById(id_obra);
    obra.estatus = dto.estatus;
    await this.obraRepository.save(obra);
    return this.findById(id_obra);
  }
}
