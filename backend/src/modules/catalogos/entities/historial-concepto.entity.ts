import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { Concepto } from './concepto.entity.js';
import type { Catalogo } from './catalogo.entity.js';
import type { User } from '../../users/entities/user.entity.js';

@Entity('historial_conceptos')
export class HistorialConcepto {
  @PrimaryGeneratedColumn({ name: 'id_historial' })
  id_historial: number;

  @Column({ name: 'id_concepto', type: 'int' })
  id_concepto: number;

  @ManyToOne('Concepto', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_concepto' })
  concepto: Relation<Concepto>;

  @Column({ name: 'id_catalogo', type: 'int', nullable: true })
  id_catalogo: number | null;

  @ManyToOne('Catalogo', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_catalogo' })
  catalogo: Relation<Catalogo> | null;

  @Column({ name: 'id_usuario_modifica', type: 'int' })
  id_usuario_modifica: number;

  @ManyToOne('User', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario_modifica' })
  usuario: Relation<User>;

  @CreateDateColumn({ name: 'fecha_modificacion', type: 'timestamptz' })
  fecha_modificacion: Date;

  @Column({ name: 'campo_modificado', type: 'varchar', length: 50 })
  campo_modificado: string;

  @Column({ name: 'valor_anterior', type: 'text', nullable: true })
  valor_anterior: string | null;

  @Column({ name: 'valor_nuevo', type: 'text', nullable: true })
  valor_nuevo: string | null;

  @Column({ name: 'justificacion', type: 'text' })
  justificacion: string;

  @Column({ name: 'evento', type: 'varchar', length: 50, default: 'MODIFICACION_CANTIDAD' })
  evento: string;
}
