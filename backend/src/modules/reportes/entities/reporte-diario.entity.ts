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
import type { FotoReporte } from './foto-reporte.entity.js';
import type { IncidenciaReporte } from './incidencia-reporte.entity.js';

@Entity('reportes_diarios')
export class ReporteDiario {
  @PrimaryGeneratedColumn({ name: 'id_reporte' })
  id_reporte: number;

  @Column({ name: 'id_obra', type: 'int' })
  id_obra: number;

  @ManyToOne('Obra', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_obra' })
  obra: Relation<Obra>;

  @Column({ name: 'id_supervisor', type: 'int' })
  id_supervisor: number;

  @ManyToOne('User', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_supervisor' })
  supervisor: Relation<User>;

  @Column({ name: 'fecha_reporte', type: 'date' })
  fecha_reporte: string;

  @Column({
    name: 'clima',
    type: 'varchar',
    length: 50,
  })
  clima: string;

  @Column({
    name: 'temperatura_celsius',
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  temperatura_celsius: number | null;

  @Column({ name: 'observaciones_clima', type: 'text', nullable: true })
  observaciones_clima: string | null;

  @Column({
    name: 'senalamiento_preventivo',
    type: 'boolean',
    default: false,
  })
  senalamiento_preventivo: boolean;

  @Column({
    name: 'equipo_proteccion_epp',
    type: 'boolean',
    default: false,
  })
  equipo_proteccion_epp: boolean;

  @Column({
    name: 'suministro_material',
    type: 'boolean',
    default: false,
  })
  suministro_material: boolean;

  @Column({
    name: 'estatus_personal',
    type: 'varchar',
    length: 30,
    default: 'Suficiente',
  })
  estatus_personal: string;

  @Column({ name: 'condiciones_seguridad', type: 'text', nullable: true })
  condiciones_seguridad: string | null;

  @Column({ name: 'checklist_seguridad', type: 'jsonb', nullable: true })
  checklist_seguridad: Record<string, boolean> | null;

  @Column({ name: 'observaciones_seguridad', type: 'text', nullable: true })
  observaciones_seguridad: string | null;

  @Column({ name: 'checklist_epp', type: 'jsonb', nullable: true })
  checklist_epp: Record<string, boolean> | null;

  @Column({ name: 'observaciones_epp', type: 'text', nullable: true })
  observaciones_epp: string | null;

  @Column({ name: 'resumen_cuadrilla', type: 'jsonb', nullable: true })
  resumen_cuadrilla: Array<{ categoria: string; cantidad: number; descripcion?: string }> | null;

  @Column({ name: 'maquinaria_sitio', type: 'jsonb', nullable: true })
  maquinaria_sitio: Array<{ tipo: string; cantidad: number; horas_uso?: number; estatus?: string }> | null;

  @Column({ name: 'actividades_realizadas', type: 'text', nullable: true })
  actividades_realizadas: string | null;

  @Column({
    name: 'avance_fisico_acumulado',
    type: 'numeric',
    precision: 6,
    scale: 2,
    default: 0.0,
  })
  avance_fisico_acumulado: number;

  @Column({ name: 'fecha_estimada_fin', type: 'date', nullable: true })
  fecha_estimada_fin: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp with time zone' })
  fecha_creacion: Date;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @OneToMany('FotoReporte', 'reporte', { cascade: true })
  fotos: Relation<FotoReporte>[];

  @OneToMany('IncidenciaReporte', 'reporte', { cascade: true })
  incidencias: Relation<IncidenciaReporte>[];
}
