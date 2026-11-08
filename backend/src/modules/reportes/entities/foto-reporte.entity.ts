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

@Entity('fotos_reporte')
export class FotoReporte {
  @PrimaryGeneratedColumn({ name: 'id_foto' })
  id_foto: number;

  @Column({ name: 'id_reporte', type: 'int' })
  id_reporte: number;

  @ManyToOne('ReporteDiario', 'fotos', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_reporte' })
  reporte: Relation<ReporteDiario>;

  @Column({ name: 'numero_foto', type: 'int' })
  numero_foto: number;

  @Column({ name: 'url_archivo', type: 'varchar', length: 255 })
  url_archivo: string;

  @Column({ name: 'descripcion_foto', type: 'varchar', length: 255, nullable: true })
  descripcion_foto: string | null;

  @CreateDateColumn({ name: 'fecha_subida', type: 'timestamp with time zone' })
  fecha_subida: Date;
}
