import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Catalogo } from './entities/catalogo.entity.js';
import { Partida } from './entities/partida.entity.js';
import { Subpartida } from './entities/subpartida.entity.js';
import { Concepto } from './entities/concepto.entity.js';
import { CatalogosService } from './catalogos.service.js';
import { CatalogosController } from './catalogos.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Catalogo, Partida, Subpartida, Concepto])],
  controllers: [CatalogosController],
  providers: [CatalogosService],
  exports: [CatalogosService],
})
export class CatalogosModule {}
