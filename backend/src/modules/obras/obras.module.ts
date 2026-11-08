import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obra } from './entities/obra.entity.js';
import { AsignacionObra } from './entities/asignacion-obra.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ObrasService } from './obras.service.js';
import { ObrasController } from './obras.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Obra, AsignacionObra, User])],
  controllers: [ObrasController],
  providers: [ObrasService],
  exports: [ObrasService],
})
export class ObrasModule {}
