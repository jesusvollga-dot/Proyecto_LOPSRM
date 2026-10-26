import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CatalogosService } from './catalogos.service.js';
import { Catalogo } from './entities/catalogo.entity.js';
import { Partida } from './entities/partida.entity.js';
import { Subpartida } from './entities/subpartida.entity.js';
import { Concepto } from './entities/concepto.entity.js';

describe('CatalogosService (Sprint 3: HU-014 a HU-019)', () => {
  let catalogosService: CatalogosService;
  let catalogoRepository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let partidaRepository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let subpartidaRepository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let conceptoRepository: {
    findOne: ReturnType<typeof vi.fn>;
    findOneOrFail: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  const mockCatalogoBorrador: Partial<Catalogo> = {
    id_catalogo: 1,
    id_obra: 10,
    tipo_catalogo: 'ORIGINAL',
    version: 1,
    estatus_aprobacion: 'BORRADOR',
    activo: true,
  };

  const mockCatalogoBloqueado: Partial<Catalogo> = {
    id_catalogo: 2,
    id_obra: 20,
    tipo_catalogo: 'ORIGINAL',
    version: 1,
    estatus_aprobacion: 'BLOQUEADO',
    fecha_bloqueo: new Date('2026-10-20T10:00:00Z'),
    bloqueado_por: 5,
    activo: true,
  };

  beforeEach(async () => {
    catalogoRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    partidaRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    subpartidaRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    conceptoRepository = {
      findOne: vi.fn(),
      findOneOrFail: vi.fn(),
      find: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogosService,
        {
          provide: getRepositoryToken(Catalogo),
          useValue: catalogoRepository,
        },
        {
          provide: getRepositoryToken(Partida),
          useValue: partidaRepository,
        },
        {
          provide: getRepositoryToken(Subpartida),
          useValue: subpartidaRepository,
        },
        {
          provide: getRepositoryToken(Concepto),
          useValue: conceptoRepository,
        },
      ],
    }).compile();

    catalogosService = module.get<CatalogosService>(CatalogosService);
  });

  // =========================================================================
  // HU-014: Registrar partidas
  // =========================================================================
  describe('HU-014: Registrar partidas del catálogo original', () => {
    it('debe registrar exitosamente una nueva partida en un catálogo en borrador', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue(null);
      const dto = {
        codigo_partida: 'PREL',
        nombre_partida: 'Trabajos Preliminares',
        descripcion: 'Limpieza, trazo y nivelación',
      };
      partidaRepository.create.mockReturnValue({ id_partida: 101, id_catalogo: 1, ...dto });
      partidaRepository.save.mockResolvedValue({ id_partida: 101, id_catalogo: 1, ...dto });

      const result = await catalogosService.crearPartida(1, dto);

      expect(result).toHaveProperty('id_partida', 101);
      expect(result.codigo_partida).toBe('PREL');
      expect(partidaRepository.save).toHaveBeenCalled();
    });

    it('debe rechazar el registro si el código de partida ya existe en el catálogo (duplicado)', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue({ id_partida: 100, codigo_partida: 'PREL' });

      await expect(
        catalogosService.crearPartida(1, {
          codigo_partida: 'PREL',
          nombre_partida: 'Otra partida duplicada',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================================================================
  // HU-015: Registrar subpartidas asociadas a una partida
  // =========================================================================
  describe('HU-015: Registrar subpartidas asociadas a una partida', () => {
    it('debe registrar exitosamente una subpartida asociada a la partida correcta', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue({
        id_partida: 101,
        id_catalogo: 1,
        codigo_partida: 'PREL',
        activo: true,
      });
      subpartidaRepository.findOne.mockResolvedValue(null);

      const dto = {
        codigo_subpartida: 'TRAZO',
        nombre_subpartida: 'Trazo y nivelación',
        descripcion: 'Trazo topográfico',
      };
      subpartidaRepository.create.mockReturnValue({ id_subpartida: 201, id_partida: 101, ...dto });
      subpartidaRepository.save.mockResolvedValue({ id_subpartida: 201, id_partida: 101, ...dto });

      const result = await catalogosService.crearSubpartida(1, 101, dto);

      expect(result).toHaveProperty('id_subpartida', 201);
      expect(result.codigo_subpartida).toBe('TRAZO');
      expect(subpartidaRepository.save).toHaveBeenCalled();
    });

    it('debe rechazar si la partida no pertenece al catálogo o no existe', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue(null);

      await expect(
        catalogosService.crearSubpartida(1, 999, {
          codigo_subpartida: 'SUB1',
          nombre_subpartida: 'Subpartida invalida',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar código de subpartida duplicado dentro de la misma partida', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue({
        id_partida: 101,
        id_catalogo: 1,
        codigo_partida: 'PREL',
        activo: true,
      });
      subpartidaRepository.findOne.mockResolvedValue({ id_subpartida: 200, codigo_subpartida: 'TRAZO' });

      await expect(
        catalogosService.crearSubpartida(1, 101, {
          codigo_subpartida: 'TRAZO',
          nombre_subpartida: 'Duplicado',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================================================================
  // HU-016 y HU-017: ID único y captura de datos requeridos del concepto
  // =========================================================================
  describe('HU-016 y HU-017: Capturar conceptos con ID único y campos requeridos', () => {
    it('debe registrar un concepto con clave única y calcular el importe en base de datos', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue({ id_partida: 101, nombre_partida: 'PRELIMINARES' });
      subpartidaRepository.findOne.mockResolvedValue(null);
      conceptoRepository.findOne.mockResolvedValue(null);

      const dto = {
        id_partida: 101,
        clave_concepto: 'CONC-001',
        descripcion: 'Excavación a mano en cepa hasta 2m',
        unidad_medida: 'M3',
        cantidad: 150.5,
        costo_directo_unitario: 320.0,
      };

      conceptoRepository.create.mockReturnValue({
        id_concepto: 501,
        id_catalogo: 1,
        partida: 'PRELIMINARES',
        ...dto,
      });
      conceptoRepository.save.mockResolvedValue({
        id_concepto: 501,
        id_catalogo: 1,
        ...dto,
      });
      conceptoRepository.findOneOrFail.mockResolvedValue({
        id_concepto: 501,
        id_catalogo: 1,
        partida: 'PRELIMINARES',
        ...dto,
        importe_costo_directo: 48160.0,
      });

      const result = await catalogosService.crearConcepto(1, dto as any);

      expect(result).toHaveProperty('id_concepto', 501);
      expect(result.clave_concepto).toBe('CONC-001');
      expect(result.importe_costo_directo).toBe(48160.0);
    });

    it('HU-016: debe rechazar concepto con clave/ID duplicado en el mismo catálogo', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue({ id_partida: 101, nombre_partida: 'PRELIMINARES' });
      conceptoRepository.findOne.mockResolvedValue({ id_concepto: 500, clave_concepto: 'CONC-001' });

      await expect(
        catalogosService.crearConcepto(1, {
          id_partida: 101,
          clave_concepto: 'CONC-001',
          descripcion: 'Concepto con clave repetida',
          unidad_medida: 'M3',
          cantidad: 10,
          costo_directo_unitario: 100,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================================================================
  // HU-018: Bloquear catálogo original
  // =========================================================================
  describe('HU-018: Bloquear el catálogo original después de su captura', () => {
    it('debe permitir bloquear un catálogo con conceptos capturados', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      conceptoRepository.count.mockResolvedValue(5);
      catalogoRepository.save.mockImplementation(async (cat) => cat);

      const result = await catalogosService.bloquearCatalogo(1, 3, {
        motivo: 'Revisión final de proyecto ejecutivo autorizada',
      });

      expect(result.estatus_aprobacion).toBe('BLOQUEADO');
      expect(result.bloqueado_por).toBe(3);
      expect(result.fecha_bloqueo).toBeInstanceOf(Date);
    });

    it('debe rechazar el bloqueo si el catálogo original no tiene conceptos (vacío)', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      conceptoRepository.count.mockResolvedValue(0);

      await expect(
        catalogosService.bloquearCatalogo(1, 3, { motivo: 'Intento en vacío' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si el catálogo ya se encuentra bloqueado previamente', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBloqueado });

      await expect(
        catalogosService.bloquearCatalogo(2, 3, { motivo: 'Re-bloqueo' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // HU-019: Impedir modificaciones directas al catálogo original
  // =========================================================================
  describe('HU-019: Impedir modificaciones directas al catálogo original', () => {
    it('debe rechazar la creación de partidas si el catálogo está bloqueado', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBloqueado });

      await expect(
        catalogosService.crearPartida(2, {
          codigo_partida: 'ESTR',
          nombre_partida: 'Estructura',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar la creación de subpartidas si el catálogo está bloqueado', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBloqueado });

      await expect(
        catalogosService.crearSubpartida(2, 101, {
          codigo_subpartida: 'CIM',
          nombre_subpartida: 'Cimentación',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar la captura de conceptos si el catálogo está bloqueado', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBloqueado });

      await expect(
        catalogosService.crearConcepto(2, {
          clave_concepto: 'CONC-999',
          descripcion: 'Intento de inserción ilegal',
          unidad_medida: 'PZA',
          cantidad: 1,
          costo_directo_unitario: 500,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar la actualización de conceptos existentes si el catálogo está bloqueado', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBloqueado });

      await expect(
        catalogosService.actualizarConcepto(2, 501, { cantidad: 50 }, 3),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar la eliminación o desactivación de conceptos si el catálogo está bloqueado', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBloqueado });

      await expect(catalogosService.desactivarConcepto(2, 501)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
