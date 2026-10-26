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
import type { Catalogo } from './catalogo.entity.js';
import type { Subpartida } from './subpartida.entity.js';
import type { Concepto } from './concepto.entity.js';

@Entity('partidas')
export class Partida {
  @PrimaryGeneratedColumn({ name: 'id_partida' })
  id_partida: number;

  @Column({ name: 'id_catalogo', type: 'int' })
  id_catalogo: number;

  @ManyToOne('Catalogo', 'partidas', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_catalogo' })
  catalogo: Relation<Catalogo>;

  @Column({ name: 'codigo_partida', type: 'varchar', length: 50 })
  codigo_partida: string;

  @Column({ name: 'nombre_partida', type: 'varchar', length: 150 })
  nombre_partida: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @OneToMany('Subpartida', 'partida')
  subpartidas: Relation<Subpartida[]>;

  @OneToMany('Concepto', 'partida_rel')
  conceptos: Relation<Concepto[]>;
}
