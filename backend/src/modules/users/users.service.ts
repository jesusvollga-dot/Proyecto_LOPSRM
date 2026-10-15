import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { Role } from './entities/role.entity.js';
import { AssignRoleDto } from './dto/assign-role.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto.js';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly BCRYPT_ROUNDS = 12; // RNF-01: Factor de costo >= 12

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Inicialización automática del Administrador Maestro inicial
   * Permite que el sistema no arranque bloqueado y que el Administrador
   * pueda comenzar de inmediato a asignar roles y activar cuadrillas.
   */
  async onModuleInit() {
    await this.seedAdminUser();
  }

  async seedAdminUser(): Promise<void> {
    const adminEmail = 'admin@lopsrm.gob.mx';
    const existingAdmin = await this.userRepository.findOne({
      where: { correo_electronico: adminEmail },
    });

    if (!existingAdmin) {
      const adminRole = await this.roleRepository.findOne({
        where: { nombre_rol: 'ADMINISTRADOR' },
      });

      if (!adminRole) {
        this.logger.warn('Rol ADMINISTRADOR aún no disponible en la base de datos');
        return;
      }

      const defaultPassword = 'AdminLOPSRM2026!';
      const salt = await bcrypt.genSalt(this.BCRYPT_ROUNDS);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      const adminUser = this.userRepository.create({
        nombre_completo: 'Administrador Maestro del Sistema',
        correo_electronico: adminEmail,
        contrasena_hash: hashedPassword,
        cedula_profesional: 'ADM-0000001',
        id_rol: adminRole.id_rol,
        activo: true,
      });

      await this.userRepository.save(adminUser);
      this.logger.log('======================================================');
      this.logger.log('✅ USUARIO ADMINISTRADOR MAESTRO INICIAL CREADO:');
      this.logger.log(`   Correo:     ${adminEmail}`);
      this.logger.log(`   Contraseña: ${defaultPassword}`);
      this.logger.log(`   Rol:        ADMINISTRADOR (id: ${adminRole.id_rol})`);
      this.logger.log('======================================================');
    }
  }

  /**
   * Registro base de usuario (RF-01):
   * Queda en estado INACTIVO (activo = false) y SIN ROL asignado (id_rol = null).
   */
  async createInactiveUser(data: {
    nombre_completo: string;
    correo_electronico: string;
    contrasena: string;
    cedula_profesional?: string;
  }): Promise<Omit<User, 'contrasena_hash'>> {
    const existing = await this.userRepository.findOne({
      where: { correo_electronico: data.correo_electronico },
    });

    if (existing) {
      throw new ConflictException(
        `El correo electrónico '${data.correo_electronico}' ya se encuentra registrado`,
      );
    }

    const salt = await bcrypt.genSalt(this.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(data.contrasena, salt);

    const newUser = this.userRepository.create({
      nombre_completo: data.nombre_completo,
      correo_electronico: data.correo_electronico,
      contrasena_hash: hashedPassword,
      cedula_profesional: data.cedula_profesional || null,
      id_rol: null,
      activo: false, // Inactivo por regla de negocio hasta validación por Administrador
    });

    const saved = await this.userRepository.save(newUser);
    const { contrasena_hash: _contrasena_hash, ...userWithoutPassword } = saved;
    return userWithoutPassword as Omit<User, 'contrasena_hash'>;
  }

  /**
   * Creación directa de usuario por el Administrador (US-02)
   */
  async createByAdmin(dto: CreateUserByAdminDto): Promise<Omit<User, 'contrasena_hash'>> {
    const existing = await this.userRepository.findOne({
      where: { correo_electronico: dto.correo_electronico },
    });

    if (existing) {
      throw new ConflictException(
        `El correo electrónico '${dto.correo_electronico}' ya se encuentra registrado`,
      );
    }

    const role = await this.roleRepository.findOne({
      where: { id_rol: dto.id_rol },
    });

    if (!role) {
      throw new BadRequestException(`El id_rol ${dto.id_rol} no existe en el catálogo`);
    }

    const salt = await bcrypt.genSalt(this.BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(dto.contrasena, salt);

    const newUser = this.userRepository.create({
      nombre_completo: dto.nombre_completo,
      correo_electronico: dto.correo_electronico,
      contrasena_hash: hashedPassword,
      cedula_profesional: dto.cedula_profesional || null,
      id_rol: role.id_rol,
      activo: true,
    });

    const saved = await this.userRepository.save(newUser);
    const { contrasena_hash: _contrasena_hash, ...userWithoutPassword } = saved;
    return userWithoutPassword as Omit<User, 'contrasena_hash'>;
  }

  /**
   * Listar todos los usuarios del sistema
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: { rol: true },
      order: { fecha_registro: 'DESC' },
    });
  }

  /**
   * Listar usuarios pendientes de validación o asignación de rol
   */
  async findPending(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.id_rol IS NULL')
      .orWhere('usuario.activo = FALSE')
      .orderBy('usuario.fecha_registro', 'ASC')
      .getMany();
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id_usuario: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id_usuario },
      relations: { rol: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    }

    return user;
  }

  /**
   * Buscar usuario por correo electrónico (con opción de incluir hash de contraseña para login)
   */
  async findByEmail(correo_electronico: string, includePassword = false): Promise<User | null> {
    const query = this.userRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.correo_electronico = :correo_electronico', { correo_electronico });

    if (includePassword) {
      query.addSelect('usuario.contrasena_hash');
    }

    return query.getOne();
  }

  /**
   * Asignación centralizada de roles (RF-02 / US-02)
   */
  async assignRole(id_usuario: number, dto: AssignRoleDto): Promise<User> {
    const user = await this.findById(id_usuario);
    const role = await this.roleRepository.findOne({
      where: { id_rol: dto.id_rol },
    });

    if (!role) {
      throw new BadRequestException(`El id_rol ${dto.id_rol} no es válido`);
    }

    user.id_rol = role.id_rol;
    if (dto.activo !== undefined) {
      user.activo = dto.activo;
    }

    await this.userRepository.save(user);
    return this.findById(id_usuario);
  }

  /**
   * Actualizar estado de activación (Soft Delete / Switch de estado)
   */
  async updateStatus(id_usuario: number, dto: UpdateUserStatusDto): Promise<User> {
    const user = await this.findById(id_usuario);
    user.activo = dto.activo;
    await this.userRepository.save(user);
    return this.findById(id_usuario);
  }

  /**
   * Obtener catálogo de los 5 roles
   */
  async getRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { id_rol: 'ASC' },
    });
  }
}
