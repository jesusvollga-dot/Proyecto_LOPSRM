import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ReportesService } from './reportes.service.js';
import { ReporteDiario } from './entities/reporte-diario.entity.js';
import { FotoReporte } from './entities/foto-reporte.entity.js';
import { IncidenciaReporte } from './entities/incidencia-reporte.entity.js';
import { Obra } from '../obras/entities/obra.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateReporteDiarioDto } from './dto/create-reporte-diario.dto.js';

describe('ReportesService (Sprint 6: HU-034 a HU-040)', () => {
  let reportesService: ReportesService;
  let reporteRepository: any;
  let fotoRepository: any;
  let incidenciaRepository: any;
  let obraRepository: any;
  let userRepository: any;

  const mockUserSupervisor = {
    id_usuario: 5,
    sub: 5,
    email: 'supervisor@lopsrm.gob.mx',
    role: 'SUPERVISOR',
    name: 'Ing. Supervisor Técnico',
  };

  const mockObra = {
    id_obra: 1,
    clave_obra: 'OBRA-2026-ED-001',
    nombre_obra: 'Construcción de Laboratorios',
    activo: true,
  };

  beforeEach(async () => {
    reporteRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((data) => ({ id_reporte: 10, ...data })),
      save: vi.fn(async (data) => ({ id_reporte: 10, ...data })),
      createQueryBuilder: vi.fn(),
    };

    fotoRepository = {
      create: vi.fn((data) => ({ id_foto: 1, ...data })),
      save: vi.fn(async (data) => data),
    };

    incidenciaRepository = {
      create: vi.fn((data) => ({ id_incidencia: 1, ...data })),
      save: vi.fn(async (data) => data),
    };

    obraRepository = {
      findOne: vi.fn(),
    };

    userRepository = {
      findOne: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesService,
        {
          provide: getRepositoryToken(ReporteDiario),
          useValue: reporteRepository,
        },
        {
          provide: getRepositoryToken(FotoReporte),
          useValue: fotoRepository,
        },
        {
          provide: getRepositoryToken(IncidenciaReporte),
          useValue: incidenciaRepository,
        },
        {
          provide: getRepositoryToken(Obra),
          useValue: obraRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    reportesService = module.get<ReportesService>(ReportesService);
  });

  // =========================================================================
  // HU-034: Registrar reporte diario de obra
  // =========================================================================
  describe('HU-034: Registrar reporte diario de obra', () => {
    const baseDto: CreateReporteDiarioDto = {
      id_obra: 1,
      fecha_reporte: '2026-11-09',
      clima: 'Soleado',
      actividades_realizadas: 'Excavación para cimentación y armado de contratrabes',
      avance_fisico_acumulado: 12.5,
    };

    it('debe registrar exitosamente un reporte diario para una obra asignada', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne
        .mockResolvedValueOnce(null) // no reporte previo esa fecha
        .mockResolvedValueOnce({
          id_reporte: 10,
          ...baseDto,
          id_supervisor: 5,
          obra: mockObra,
          fotos: [],
          incidencias: [],
        }); // findOne de obtenerReportePorId

      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null), // no reporte anterior para avance
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      const resultado = await reportesService.crearReporte(mockUserSupervisor, baseDto);

      expect(obraRepository.findOne).toHaveBeenCalledWith({
        where: { id_obra: 1, activo: true },
      });
      expect(reporteRepository.create).toHaveBeenCalled();
      expect(reporteRepository.save).toHaveBeenCalled();
      expect(resultado.id_reporte).toBe(10);
      expect(resultado.actividades_realizadas).toBe(baseDto.actividades_realizadas);
    });

    it('debe lanzar NotFoundException si la obra no existe o está inactiva', async () => {
      obraRepository.findOne.mockResolvedValue(null);

      await expect(
        reportesService.crearReporte(mockUserSupervisor, baseDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si ya existe un reporte para esa fecha en la misma obra', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne.mockResolvedValue({ id_reporte: 5, fecha_reporte: '2026-11-09' });

      await expect(
        reportesService.crearReporte(mockUserSupervisor, baseDto),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si el avance físico acumulado es menor al anterior', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne.mockResolvedValue(null);

      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          id_reporte: 9,
          fecha_reporte: '2026-11-08',
          avance_fisico_acumulado: 15.0,
        }),
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      await expect(
        reportesService.crearReporte(mockUserSupervisor, {
          ...baseDto,
          avance_fisico_acumulado: 10.0, // menor a 15.0
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // HU-035: Registrar condiciones meteorológicas
  // =========================================================================
  describe('HU-035: Registrar condiciones meteorológicas', () => {
    it('debe registrar el clima, temperatura y observaciones meteorológicas', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id_reporte: 11,
          id_obra: 1,
          clima: 'Lluvia Ligera',
          temperatura_celsius: 19.5,
          observaciones_clima: 'Lluvia intermitente entre 14:00 y 16:00 hrs',
        });

      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      const dto: CreateReporteDiarioDto = {
        id_obra: 1,
        fecha_reporte: '2026-11-10',
        clima: 'Lluvia Ligera',
        temperatura_celsius: 19.5,
        observaciones_clima: 'Lluvia intermitente entre 14:00 y 16:00 hrs',
      };

      const resultado = await reportesService.crearReporte(mockUserSupervisor, dto);

      expect(reporteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clima: 'Lluvia Ligera',
          temperatura_celsius: 19.5,
          observaciones_clima: 'Lluvia intermitente entre 14:00 y 16:00 hrs',
        }),
      );
      expect(resultado.clima).toBe('Lluvia Ligera');
    });
  });

  // =========================================================================
  // HU-036: Registrar condiciones de seguridad
  // =========================================================================
  describe('HU-036: Registrar condiciones de seguridad', () => {
    it('debe registrar el estado de seguridad, señalamiento preventivo y checklist', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id_reporte: 12,
          senalamiento_preventivo: true,
          condiciones_seguridad: 'Área perimetral acordonada y señalizada',
          checklist_seguridad: { senalizacion: true, extintores: true, botiquin: true },
        });

      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      const dto: CreateReporteDiarioDto = {
        id_obra: 1,
        fecha_reporte: '2026-11-11',
        clima: 'Soleado',
        senalamiento_preventivo: true,
        condiciones_seguridad: 'Área perimetral acordonada y señalizada',
        checklist_seguridad: { senalizacion: true, extintores: true, botiquin: true },
        observaciones_seguridad: 'Inspección matutina sin novedades',
      };

      const resultado = await reportesService.crearReporte(mockUserSupervisor, dto);

      expect(reporteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senalamiento_preventivo: true,
          condiciones_seguridad: 'Área perimetral acordonada y señalizada',
          checklist_seguridad: { senalizacion: true, extintores: true, botiquin: true },
        }),
      );
      expect(resultado.senalamiento_preventivo).toBe(true);
    });
  });

  // =========================================================================
  // HU-037: Registrar cumplimiento del EPP
  // =========================================================================
  describe('HU-037: Registrar cumplimiento del EPP', () => {
    it('debe registrar el cumplimiento de EPP con desglose de equipo y observaciones', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id_reporte: 13,
          equipo_proteccion_epp: true,
          checklist_epp: { casco: true, chaleco: true, botas: true, guantes: true, lentes: true },
          observaciones_epp: '100% del personal porta EPP completo',
        });

      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      const dto: CreateReporteDiarioDto = {
        id_obra: 1,
        fecha_reporte: '2026-11-12',
        clima: 'Soleado',
        equipo_proteccion_epp: true,
        checklist_epp: { casco: true, chaleco: true, botas: true, guantes: true, lentes: true },
        observaciones_epp: '100% del personal porta EPP completo',
      };

      const resultado = await reportesService.crearReporte(mockUserSupervisor, dto);

      expect(reporteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          equipo_proteccion_epp: true,
          checklist_epp: { casco: true, chaleco: true, botas: true, guantes: true, lentes: true },
          observaciones_epp: '100% del personal porta EPP completo',
        }),
      );
      expect(resultado.equipo_proteccion_epp).toBe(true);
    });
  });

  // =========================================================================
  // HU-038: Registrar personal presente
  // =========================================================================
  describe('HU-038: Registrar personal presente (cuadrillas)', () => {
    it('debe registrar las cuadrillas y trabajadores presentes en obra', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id_reporte: 14,
          estatus_personal: 'Suficiente',
          resumen_cuadrilla: [
            { categoria: 'Cabos', cantidad: 1, descripcion: 'Control general' },
            { categoria: 'Albañiles', cantidad: 6, descripcion: 'Pegado de tabique' },
            { categoria: 'Peones', cantidad: 8, descripcion: 'Acarreo de materiales' },
          ],
        });

      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      const dto: CreateReporteDiarioDto = {
        id_obra: 1,
        fecha_reporte: '2026-11-13',
        clima: 'Soleado',
        estatus_personal: 'Suficiente',
        resumen_cuadrilla: [
          { categoria: 'Cabos', cantidad: 1, descripcion: 'Control general' },
          { categoria: 'Albañiles', cantidad: 6, descripcion: 'Pegado de tabique' },
          { categoria: 'Peones', cantidad: 8, descripcion: 'Acarreo de materiales' },
        ],
      };

      const resultado = await reportesService.crearReporte(mockUserSupervisor, dto);

      expect(reporteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          estatus_personal: 'Suficiente',
          resumen_cuadrilla: expect.arrayContaining([
            expect.objectContaining({ categoria: 'Albañiles', cantidad: 6 }),
          ]),
        }),
      );
      expect(resultado.resumen_cuadrilla).toHaveLength(3);
    });
  });

  // =========================================================================
  // HU-039: Registrar maquinaria utilizada
  // =========================================================================
  describe('HU-039: Registrar maquinaria utilizada', () => {
    it('debe registrar el equipo y maquinaria operados en la jornada', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id_reporte: 15,
          maquinaria_sitio: [
            { tipo: 'Retroexcavadora CAT 416', cantidad: 1, horas_uso: 7, estatus: 'Operativa' },
            { tipo: 'Camión de volteo 14m3', cantidad: 2, horas_uso: 6, estatus: 'Operativa' },
          ],
        });

      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      const dto: CreateReporteDiarioDto = {
        id_obra: 1,
        fecha_reporte: '2026-11-14',
        clima: 'Soleado',
        maquinaria_sitio: [
          { tipo: 'Retroexcavadora CAT 416', cantidad: 1, horas_uso: 7, estatus: 'Operativa' },
          { tipo: 'Camión de volteo 14m3', cantidad: 2, horas_uso: 6, estatus: 'Operativa' },
        ],
      };

      const resultado = await reportesService.crearReporte(mockUserSupervisor, dto);

      expect(reporteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          maquinaria_sitio: expect.arrayContaining([
            expect.objectContaining({ tipo: 'Retroexcavadora CAT 416', cantidad: 1 }),
          ]),
        }),
      );
      expect(resultado.maquinaria_sitio).toHaveLength(2);
    });

    it('debe lanzar BadRequestException si se intentan guardar más de 6 fotografías', async () => {
      obraRepository.findOne.mockResolvedValue(mockObra);
      reporteRepository.findOne.mockResolvedValue(null);

      const mockQb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      const dtoCon7Fotos: CreateReporteDiarioDto = {
        id_obra: 1,
        fecha_reporte: '2026-11-14',
        clima: 'Soleado',
        fotos: [
          { numero_foto: 1, url_archivo: 'f1.jpg' },
          { numero_foto: 2, url_archivo: 'f2.jpg' },
          { numero_foto: 3, url_archivo: 'f3.jpg' },
          { numero_foto: 4, url_archivo: 'f4.jpg' },
          { numero_foto: 5, url_archivo: 'f5.jpg' },
          { numero_foto: 6, url_archivo: 'f6.jpg' },
          { numero_foto: 7, url_archivo: 'f7.jpg' }, // 7ma foto inválida
        ],
      };

      await expect(
        reportesService.crearReporte(mockUserSupervisor, dtoCon7Fotos),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // HU-040: Consultar bitácora diaria
  // =========================================================================
  describe('HU-040: Consultar bitácora diaria', () => {
    it('debe permitir a usuarios autorizados consultar reportes con filtros aplicados', async () => {
      const mockReportes = [
        {
          id_reporte: 1,
          fecha_reporte: '2026-11-10',
          clima: 'Soleado',
          actividades_realizadas: 'Armado de acero',
        },
        {
          id_reporte: 2,
          fecha_reporte: '2026-11-09',
          clima: 'Nublado',
          actividades_realizadas: 'Corte y relleno',
        },
      ];

      const mockQb = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockReportes),
      };
      reporteRepository.createQueryBuilder.mockReturnValue(mockQb);

      const resultado = await reportesService.consultarBitacora(mockUserSupervisor, {
        id_obra: 1,
        fecha_inicio: '2026-11-01',
        fecha_fin: '2026-11-30',
        clima: 'Soleado',
      });

      expect(mockQb.andWhere).toHaveBeenCalledWith('r.id_obra = :idObra', { idObra: 1 });
      expect(mockQb.andWhere).toHaveBeenCalledWith('r.fecha_reporte >= :fechaInicio', {
        fechaInicio: '2026-11-01',
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith('r.fecha_reporte <= :fechaFin', {
        fechaFin: '2026-11-30',
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith('r.clima = :clima', { clima: 'Soleado' });
      expect(resultado).toHaveLength(2);
    });

    it('debe obtener el detalle completo de un reporte por ID', async () => {
      const mockReporteDetalle = {
        id_reporte: 10,
        fecha_reporte: '2026-11-09',
        obra: mockObra,
        supervisor: mockUserSupervisor,
        fotos: [{ id_foto: 1, numero_foto: 1, url_archivo: 'f1.jpg' }],
        incidencias: [],
      };
      reporteRepository.findOne.mockResolvedValue(mockReporteDetalle);

      const resultado = await reportesService.obtenerReportePorId(10);

      expect(reporteRepository.findOne).toHaveBeenCalledWith({
        where: { id_reporte: 10, activo: true },
        relations: { obra: true, supervisor: true, fotos: true, incidencias: true },
      });
      expect(resultado.id_reporte).toBe(10);
      expect(resultado.fotos).toHaveLength(1);
    });

    it('debe lanzar NotFoundException si el reporte consultado por ID no existe', async () => {
      reporteRepository.findOne.mockResolvedValue(null);

      await expect(reportesService.obtenerReportePorId(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
