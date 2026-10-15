import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AsignacionObra } from './asignacion-obra.entity.js';

@Entity('obras')
export class Obra {
  @PrimaryGeneratedColumn({ name: 'id_obra' })
  id_obra: number;

  @Column({ name: 'clave_obra', type: 'varchar', length: 50, unique: true })
  clave_obra: string;

  @Column({ name: 'nombre_obra', type: 'varchar', length: 255 })
  nombre_obra: string;

  @Column({ name: 'numero_contrato', type: 'varchar', length: 100, unique: true })
  numero_contrato: string;

  @Column({ name: 'presupuesto_autorizado', type: 'numeric', precision: 14, scale: 2 })
  presupuesto_autorizado: number;

  @Column({ name: 'porcentaje_anticipo', type: 'numeric', precision: 5, scale: 2, default: 30.0 })
  porcentaje_anticipo: number;

  @Column({ name: 'fecha_inicio_programada', type: 'date' })
  fecha_inicio_programada: string;

  @Column({ name: 'fecha_termino_programada', type: 'date' })
  fecha_termino_programada: string;

  @Column({ name: 'estatus', type: 'varchar', length: 30, default: 'EN_EJECUCION' })
  estatus: string;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @OneToMany(() => AsignacionObra, (asig) => asig.obra)
  asignaciones: AsignacionObra[];
}
