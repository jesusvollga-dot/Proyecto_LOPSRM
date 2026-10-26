import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { Catalogo } from './catalogo.entity.js';
import type { Partida } from './partida.entity.js';
import type { Subpartida } from './subpartida.entity.js';

@Entity('conceptos')
export class Concepto {
  @PrimaryGeneratedColumn({ name: 'id_concepto' })
  id_concepto: number;

  @Column({ name: 'id_catalogo', type: 'int' })
  id_catalogo: number;

  @ManyToOne('Catalogo', 'conceptos', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_catalogo' })
  catalogo: Relation<Catalogo>;

  @Column({ name: 'id_partida', type: 'int', nullable: true })
  id_partida: number | null;

  @ManyToOne('Partida', 'conceptos', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_partida' })
  partida_rel: Relation<Partida> | null;

  @Column({ name: 'id_subpartida', type: 'int', nullable: true })
  id_subpartida: number | null;

  @ManyToOne('Subpartida', 'conceptos', {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_subpartida' })
  subpartida_rel: Relation<Subpartida> | null;

  @Column({ name: 'partida', type: 'varchar', length: 100 })
  partida: string;

  @Column({ name: 'subpartida', type: 'varchar', length: 100, nullable: true })
  subpartida: string | null;

  @Column({ name: 'clave_concepto', type: 'varchar', length: 50 })
  clave_concepto: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({ name: 'unidad_medida', type: 'varchar', length: 20 })
  unidad_medida: string;

  @Column({ name: 'cantidad', type: 'numeric', precision: 14, scale: 2 })
  cantidad: number;

  @Column({
    name: 'costo_directo_unitario',
    type: 'numeric',
    precision: 14,
    scale: 2,
  })
  costo_directo_unitario: number;

  @Column({
    name: 'importe_costo_directo',
    type: 'numeric',
    precision: 14,
    scale: 2,
    insert: false,
    update: false,
  })
  importe_costo_directo: number;

  @Column({
    name: 'porcentaje_incidencia',
    type: 'numeric',
    precision: 6,
    scale: 4,
    default: 0.0,
  })
  porcentaje_incidencia: number;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;
}
