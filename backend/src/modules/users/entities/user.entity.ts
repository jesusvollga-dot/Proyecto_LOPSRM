import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity.js';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'id_rol', type: 'int', nullable: true })
  id_rol: number | null;

  @ManyToOne(() => Role, (role) => role.usuarios, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_rol' })
  rol: Role | null;

  @Column({ name: 'nombre_completo', type: 'varchar', length: 150 })
  nombre_completo: string;

  @Column({ name: 'correo_electronico', type: 'varchar', length: 100, unique: true })
  correo_electronico: string;

  @Column({ name: 'contrasena_hash', type: 'varchar', length: 255, select: false })
  contrasena_hash: string;

  @Column({ name: 'cedula_profesional', type: 'varchar', length: 30, nullable: true })
  cedula_profesional: string | null;

  @Column({ name: 'activo', type: 'boolean', default: false })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamptz' })
  fecha_registro: Date;
}
