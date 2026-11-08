import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import type { ReporteDiario } from './reporte-diario.entity.js';

@Entity('incidencias_reporte')
export class IncidenciaReporte {
  @PrimaryGeneratedColumn({ name: 'id_incidencia' })
  id_incidencia: number;

  @Column({ name: 'id_reporte', type: 'int' })
  id_reporte: number;

  @ManyToOne('ReporteDiario', 'incidencias', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_reporte' })
  reporte: Relation<ReporteDiario>;

  @Column({ name: 'tipo', type: 'varchar', length: 50 })
  tipo: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({ name: 'acciones_a_seguir', type: 'text' })
  acciones_a_seguir: string;

  @Column({ name: 'estatus', type: 'varchar', length: 30, default: 'Pendiente' })
  estatus: string;

  @Column({ name: 'fecha_solucion', type: 'date', nullable: true })
  fecha_solucion: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamp with time zone' })
  fecha_creacion: Date;
}
