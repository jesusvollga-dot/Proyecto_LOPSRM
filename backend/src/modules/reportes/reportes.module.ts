import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller.js';
import { ReportesService } from './reportes.service.js';
import { ReporteDiario } from './entities/reporte-diario.entity.js';
import { FotoReporte } from './entities/foto-reporte.entity.js';
import { IncidenciaReporte } from './entities/incidencia-reporte.entity.js';
import { Obra } from '../obras/entities/obra.entity.js';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReporteDiario,
      FotoReporte,
      IncidenciaReporte,
      Obra,
      User,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
