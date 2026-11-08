import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { Obra } from '../../obras/entities/obra.entity.js';
import type { Catalogo } from './catalogo.entity.js';
import type { User } from '../../users/entities/user.entity.js';

@Entity('convenios')
export class Convenio {
  @PrimaryGeneratedColumn({ name: 'id_convenio' })
  id_convenio: number;

  @Column({ name: 'id_obra', type: 'int' })
  id_obra: number;

  @ManyToOne('Obra', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_obra' })
  obra: Relation<Obra>;

  @Column({ name: 'id_catalogo', type: 'int', nullable: true })
  id_catalogo: number | null;

  @ManyToOne('Catalogo', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_catalogo' })
  catalogo: Relation<Catalogo> | null;

  @Column({ name: 'numero_convenio', type: 'varchar', length: 100 })
  numero_convenio: string;

  @Column({
    name: 'tipo_convenio',
    type: 'varchar',
    length: 50,
    default: 'MODIFICATORIO_VOLUMEN',
  })
  tipo_convenio: 'MODIFICATORIO_VOLUMEN' | 'CONCEPTO_EXTRAORDINARIO' | 'PLAZO' | 'MIXTO';

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({ name: 'fecha_firma', type: 'date' })
  fecha_firma: string;

  @Column({
    name: 'monto_adicional',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0.0,
  })
  monto_adicional: number;

  @Column({
    name: 'porcentaje_variacion',
    type: 'numeric',
    precision: 6,
    scale: 2,
    default: 0.0,
  })
  porcentaje_variacion: number;

  @Column({ name: 'dias_ampliacion', type: 'int', default: 0 })
  dias_ampliacion: number;

  @Column({ name: 'id_usuario_registro', type: 'int' })
  id_usuario_registro: number;

  @ManyToOne('User', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario_registro' })
  usuario_registro: Relation<User>;

  @Column({
    name: 'estatus',
    type: 'varchar',
    length: 30,
    default: 'AUTORIZADO',
  })
  estatus: 'BORRADOR' | 'AUTORIZADO' | 'CANCELADO';

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fecha_creacion: Date;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;
}
