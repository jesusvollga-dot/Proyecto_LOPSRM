import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { Partida } from './partida.entity.js';
import type { Concepto } from './concepto.entity.js';

@Entity('subpartidas')
export class Subpartida {
  @PrimaryGeneratedColumn({ name: 'id_subpartida' })
  id_subpartida: number;

  @Column({ name: 'id_partida', type: 'int' })
  id_partida: number;

  @ManyToOne('Partida', 'subpartidas', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_partida' })
  partida: Relation<Partida>;

  @Column({ name: 'codigo_subpartida', type: 'varchar', length: 50 })
  codigo_subpartida: string;

  @Column({ name: 'nombre_subpartida', type: 'varchar', length: 150 })
  nombre_subpartida: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @OneToMany('Concepto', 'subpartida_rel')
  conceptos: Relation<Concepto[]>;
}
