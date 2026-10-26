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
import type { Obra } from '../../obras/entities/obra.entity.js';
import type { User } from '../../users/entities/user.entity.js';
import type { Partida } from './partida.entity.js';
import type { Concepto } from './concepto.entity.js';

@Entity('catalogos')
export class Catalogo {
  @PrimaryGeneratedColumn({ name: 'id_catalogo' })
  id_catalogo: number;

  @Column({ name: 'id_obra', type: 'int' })
  id_obra: number;

  @ManyToOne('Obra', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_obra' })
  obra: Relation<Obra>;

  @Column({
    name: 'tipo_catalogo',
    type: 'varchar',
    length: 30,
    default: 'ORIGINAL',
  })
  tipo_catalogo: 'ORIGINAL' | 'MODIFICADO' | 'EXTRAORDINARIO';

  @Column({ name: 'version', type: 'int', default: 1 })
  version: number;

  @Column({
    name: 'estatus_aprobacion',
    type: 'varchar',
    length: 30,
    default: 'BORRADOR',
  })
  estatus_aprobacion: 'BORRADOR' | 'AUTORIZADO' | 'BLOQUEADO';

  @Column({ name: 'fecha_bloqueo', type: 'timestamptz', nullable: true })
  fecha_bloqueo: Date | null;

  @Column({ name: 'bloqueado_por', type: 'int', nullable: true })
  bloqueado_por: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bloqueado_por' })
  usuario_bloqueo: Relation<User> | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @OneToMany('Partida', 'catalogo')
  partidas: Relation<Partida[]>;

  @OneToMany('Concepto', 'catalogo')
  conceptos: Relation<Concepto[]>;
}
