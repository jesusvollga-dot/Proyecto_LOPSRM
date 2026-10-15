import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Obra } from './obra.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('asignaciones_obra')
@Unique('uq_obra_rol', ['id_obra', 'rol_en_obra'])
export class AsignacionObra {
  @PrimaryGeneratedColumn({ name: 'id_asignacion' })
  id_asignacion: number;

  @Column({ name: 'id_obra', type: 'int' })
  id_obra: number;

  @ManyToOne(() => Obra, (obra) => obra.asignaciones, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_obra' })
  obra: Obra;

  @Column({ name: 'id_usuario', type: 'int' })
  id_usuario: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: User;

  @Column({ name: 'rol_en_obra', type: 'varchar', length: 50 })
  rol_en_obra: string;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_asignacion', type: 'timestamptz' })
  fecha_asignacion: Date;
}
