import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { User } from './modules/users/entities/user.entity.js';
import { Role } from './modules/users/entities/role.entity.js';
import { ObrasModule } from './modules/obras/obras.module.js';
import { Obra } from './modules/obras/entities/obra.entity.js';
import { AsignacionObra } from './modules/obras/entities/asignacion-obra.entity.js';
import { CatalogosModule } from './modules/catalogos/catalogos.module.js';
import { Catalogo } from './modules/catalogos/entities/catalogo.entity.js';
import { Partida } from './modules/catalogos/entities/partida.entity.js';
import { Subpartida } from './modules/catalogos/entities/subpartida.entity.js';
import { Concepto } from './modules/catalogos/entities/concepto.entity.js';
import { HistorialConcepto } from './modules/catalogos/entities/historial-concepto.entity.js';
import { Convenio } from './modules/catalogos/entities/convenio.entity.js';
import { ReportesModule } from './modules/reportes/reportes.module.js';
import { ReporteDiario } from './modules/reportes/entities/reporte-diario.entity.js';
import { FotoReporte } from './modules/reportes/entities/foto-reporte.entity.js';
import { IncidenciaReporte } from './modules/reportes/entities/incidencia-reporte.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<number>('DB_PORT', 5432)),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'lopsrm_db'),
        entities: [
          User,
          Role,
          Obra,
          AsignacionObra,
          Catalogo,
          Partida,
          Subpartida,
          Concepto,
          HistorialConcepto,
          Convenio,
          ReporteDiario,
          FotoReporte,
          IncidenciaReporte,
        ],
        autoLoadEntities: true,
        synchronize: false, // Desactivado para respetar schema.sql formal
      }),
    }),
    UsersModule,
    AuthModule,
    ObrasModule,
    CatalogosModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
