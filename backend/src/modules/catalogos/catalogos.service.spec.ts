import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CatalogosService } from './catalogos.service.js';
import { Catalogo } from './entities/catalogo.entity.js';
import { Partida } from './entities/partida.entity.js';
import { Subpartida } from './entities/subpartida.entity.js';
import { Concepto } from './entities/concepto.entity.js';
import { HistorialConcepto } from './entities/historial-concepto.entity.js';
import { Convenio } from './entities/convenio.entity.js';
import { Obra } from '../obras/entities/obra.entity.js';
import { User } from '../users/entities/user.entity.js';

describe('CatalogosService (Sprint 3 y Sprint 5: HU-014 a HU-033)', () => {
  let catalogosService: CatalogosService;
  let catalogoRepository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
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
  let historialRepository: {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let convenioRepository: {
    findOne: ReturnType<typeof vi.fn>;
    findOneOrFail: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let obraRepository: {
    findOne: ReturnType<typeof vi.fn>;
  };
  let userRepository: {
    findOne: ReturnType<typeof vi.fn>;
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
      update: vi.fn(),
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

    historialRepository = {
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    convenioRepository = {
      findOne: vi.fn(),
      findOneOrFail: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    obraRepository = {
      findOne: vi.fn(),
    };

    userRepository = {
      findOne: vi.fn(),
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
        {
          provide: getRepositoryToken(HistorialConcepto),
          useValue: historialRepository,
        },
        {
          provide: getRepositoryToken(Convenio),
          useValue: convenioRepository,
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

    catalogosService = module.get<CatalogosService>(CatalogosService);
  });

  // =========================================================================
  // SPRINT 3: HU-014 A HU-019
  // =========================================================================

  describe('HU-014: Registrar partidas del catálogo original', () => {
    it('debe registrar exitosamente una nueva partida en un catálogo en borrador', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue(null);
      partidaRepository.create.mockReturnValue({
        id_partida: 101,
        id_catalogo: 1,
        codigo_partida: 'PREL',
        nombre_partida: 'Trabajos Preliminares',
      });
      partidaRepository.save.mockResolvedValue({
        id_partida: 101,
        id_catalogo: 1,
        codigo_partida: 'PREL',
        nombre_partida: 'Trabajos Preliminares',
      });

      const res = await catalogosService.crearPartida(1, {
        codigo_partida: 'PREL',
        nombre_partida: 'Trabajos Preliminares',
      });

      expect(res.id_partida).toBe(101);
      expect(res.codigo_partida).toBe('PREL');
    });

    it('debe rechazar el registro si el código de partida ya existe en el catálogo (duplicado)', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue({ id_partida: 101, codigo_partida: 'PREL' });

      await expect(
        catalogosService.crearPartida(1, {
          codigo_partida: 'PREL',
          nombre_partida: 'Duplicado',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('HU-015: Registrar subpartidas asociadas a una partida', () => {
    it('debe registrar exitosamente una subpartida asociada a la partida correcta', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue({
        id_partida: 101,
        id_catalogo: 1,
        codigo_partida: 'PREL',
      });
      subpartidaRepository.findOne.mockResolvedValue(null);
      subpartidaRepository.create.mockReturnValue({
        id_subpartida: 201,
        id_partida: 101,
        codigo_subpartida: 'TRAZO',
        nombre_subpartida: 'Trazo y Nivelación',
      });
      subpartidaRepository.save.mockResolvedValue({
        id_subpartida: 201,
        id_partida: 101,
        codigo_subpartida: 'TRAZO',
        nombre_subpartida: 'Trazo y Nivelación',
      });

      const res = await catalogosService.crearSubpartida(1, 101, {
        codigo_subpartida: 'TRAZO',
        nombre_subpartida: 'Trazo y Nivelación',
      });

      expect(res.id_subpartida).toBe(201);
      expect(res.codigo_subpartida).toBe('TRAZO');
    });

    it('debe rechazar si la partida no pertenece al catálogo o no existe', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue(null);

      await expect(
        catalogosService.crearSubpartida(1, 999, {
          codigo_subpartida: 'TRAZO',
          nombre_subpartida: 'Trazo y Nivelación',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar código de subpartida duplicado dentro de la misma partida', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      partidaRepository.findOne.mockResolvedValue({ id_partida: 101, id_catalogo: 1 });
      subpartidaRepository.findOne.mockResolvedValue({ id_subpartida: 201, codigo_subpartida: 'TRAZO' });

      await expect(
        catalogosService.crearSubpartida(1, 101, {
          codigo_subpartida: 'TRAZO',
          nombre_subpartida: 'Trazo y Nivelación',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('HU-016 y HU-017: Capturar conceptos con ID único y campos requeridos', () => {
    it('debe registrar un concepto con clave única y calcular el importe en base de datos', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      conceptoRepository.findOne.mockResolvedValue(null);
      conceptoRepository.create.mockReturnValue({
        id_concepto: 301,
        id_catalogo: 1,
        clave_concepto: 'PREL-001',
        descripcion: 'Limpieza y despalme de terreno',
        unidad_medida: 'M2',
        cantidad: 1500,
        costo_directo_unitario: 25.5,
      });
      conceptoRepository.save.mockResolvedValue({ id_concepto: 301 });
      conceptoRepository.findOneOrFail.mockResolvedValue({
        id_concepto: 301,
        id_catalogo: 1,
        clave_concepto: 'PREL-001',
        descripcion: 'Limpieza y despalme de terreno',
        unidad_medida: 'M2',
        cantidad: 1500,
        costo_directo_unitario: 25.5,
        importe_costo_directo: 38250,
      });

      const res = await catalogosService.crearConcepto(1, {
        clave_concepto: 'PREL-001',
        descripcion: 'Limpieza y despalme de terreno',
        unidad_medida: 'M2',
        cantidad: 1500,
        costo_directo_unitario: 25.5,
      });

      expect(res.id_concepto).toBe(301);
      expect(res.clave_concepto).toBe('PREL-001');
      expect(res.importe_costo_directo).toBe(38250);
    });

    it('HU-016: debe rechazar concepto con clave/ID duplicado en el mismo catálogo', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      conceptoRepository.findOne.mockResolvedValue({ id_concepto: 301, clave_concepto: 'PREL-001' });

      await expect(
        catalogosService.crearConcepto(1, {
          clave_concepto: 'PREL-001',
          descripcion: 'Duplicado',
          unidad_medida: 'M2',
          cantidad: 10,
          costo_directo_unitario: 10,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('HU-018: Bloquear el catálogo original después de su captura', () => {
    it('debe permitir bloquear un catálogo con conceptos capturados', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      conceptoRepository.count.mockResolvedValue(5);
      catalogoRepository.save.mockImplementation(async (cat: any) => cat);

      const res = await catalogosService.bloquearCatalogo(1, 3, {
        motivo: 'Proyecto ejecutivo formalizado.',
      });

      expect(res.estatus_aprobacion).toBe('BLOQUEADO');
      expect(res.bloqueado_por).toBe(3);
      expect(res.fecha_bloqueo).toBeInstanceOf(Date);
    });

    it('debe rechazar el bloqueo si el catálogo original no tiene conceptos (vacío)', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBorrador });
      conceptoRepository.count.mockResolvedValue(0);

      await expect(
        catalogosService.bloquearCatalogo(1, 3, { motivo: 'Intento vacío' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si el catálogo ya se encuentra bloqueado previamente', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBloqueado });

      await expect(
        catalogosService.bloquearCatalogo(2, 3, { motivo: 'Re-bloqueo' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('HU-019: Impedir modificaciones directas al catálogo original', () => {
    it('debe rechazar la creación de partidas si el catálogo está bloqueado', async () => {
      catalogoRepository.findOne.mockResolvedValue({ ...mockCatalogoBloqueado });

      await expect(
        catalogosService.crearPartida(2, {
          codigo_partida: 'CIM',
          nombre_partida: 'Cimentación',
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

  // =========================================================================
  // SPRINT 5: HU-027 A HU-033
  // =========================================================================

  describe('Sprint 5: Catálogos Modificados, Extraordinarios y Auditoría (HU-027 a HU-033)', () => {
    describe('HU-027: Crear catálogo modificado a partir del original', () => {
      it('debe clonar exitosamente la estructura base sin alterar el catálogo original', async () => {
        obraRepository.findOne.mockResolvedValue({ id_obra: 10, activo: true });
        catalogoRepository.findOne.mockImplementation(async ({ where }: any) => {
          if (where.tipo_catalogo === 'ORIGINAL') {
            return {
              id_catalogo: 1,
              id_obra: 10,
              tipo_catalogo: 'ORIGINAL',
              version: 1,
              partidas: [
                {
                  id_partida: 11,
                  codigo_partida: 'PREL',
                  nombre_partida: 'Preliminares',
                  activo: true,
                  subpartidas: [],
                },
              ],
              conceptos: [
                {
                  id_concepto: 21,
                  id_partida: 11,
                  clave_concepto: 'PREL-001',
                  descripcion: 'Despalme',
                  unidad_medida: 'M2',
                  cantidad: 100,
                  costo_directo_unitario: 50,
                  activo: true,
                },
              ],
            };
          }
          if (where.id_catalogo === 2) {
            return {
              id_catalogo: 2,
              id_obra: 10,
              tipo_catalogo: 'MODIFICADO',
              version: 2,
              partidas: [],
              conceptos: [],
            };
          }
          return null;
        });

        catalogoRepository.find.mockResolvedValue([{ id_catalogo: 1, version: 1 }]);
        catalogoRepository.create.mockReturnValue({
          id_catalogo: 2,
          id_obra: 10,
          tipo_catalogo: 'MODIFICADO',
          version: 2,
        });
        catalogoRepository.save.mockResolvedValue({
          id_catalogo: 2,
          id_obra: 10,
          tipo_catalogo: 'MODIFICADO',
          version: 2,
        });

        partidaRepository.create.mockReturnValue({ id_partida: 12, id_catalogo: 2 });
        partidaRepository.save.mockResolvedValue({ id_partida: 12, id_catalogo: 2 });

        conceptoRepository.create.mockReturnValue({ id_concepto: 22, id_catalogo: 2 });
        conceptoRepository.save.mockResolvedValue({ id_concepto: 22, id_catalogo: 2 });
        historialRepository.create.mockReturnValue({});
        historialRepository.save.mockResolvedValue({});

        const res = await catalogosService.crearCatalogoModificado(10, 4, {
          descripcion: 'Modificación autorizada por convenio 1',
        });

        expect(res).toBeDefined();
        expect(res.tipo_catalogo).toBe('MODIFICADO');
        expect(res.version).toBe(2);
      });

      it('debe rechazar si la obra no cuenta con un catálogo original', async () => {
        obraRepository.findOne.mockResolvedValue({ id_obra: 99, activo: true });
        catalogoRepository.findOne.mockResolvedValue(null);

        await expect(
          catalogosService.crearCatalogoModificado(99, 4, {}),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('HU-028: Registrar conceptos extraordinarios', () => {
      it('debe registrar un concepto extraordinario con identificador único y guardarlo en el catálogo extraordinario', async () => {
        obraRepository.findOne.mockResolvedValue({ id_obra: 10, activo: true });
        catalogoRepository.findOne.mockResolvedValue(null); // No existe catalogo EXTRAORDINARIO aun
        catalogoRepository.create.mockReturnValue({
          id_catalogo: 5,
          id_obra: 10,
          tipo_catalogo: 'EXTRAORDINARIO',
        });
        catalogoRepository.save.mockResolvedValue({
          id_catalogo: 5,
          id_obra: 10,
          tipo_catalogo: 'EXTRAORDINARIO',
        });

        conceptoRepository.findOne.mockResolvedValue(null); // No duplicado
        partidaRepository.findOne.mockResolvedValue(null); // Se crea partida EXT
        partidaRepository.create.mockReturnValue({ id_partida: 50, codigo_partida: 'EXT' });
        partidaRepository.save.mockResolvedValue({ id_partida: 50, codigo_partida: 'EXT' });

        conceptoRepository.create.mockReturnValue({
          id_concepto: 90,
          clave_concepto: 'EXT-001',
          es_extraordinario: true,
        });
        conceptoRepository.save.mockResolvedValue({ id_concepto: 90 });
        conceptoRepository.findOneOrFail.mockResolvedValue({
          id_concepto: 90,
          clave_concepto: 'EXT-001',
          es_extraordinario: true,
          cantidad: 15,
          costo_directo_unitario: 350,
        });
        historialRepository.create.mockReturnValue({});
        historialRepository.save.mockResolvedValue({});

        const res = await catalogosService.crearConceptoExtraordinario(10, 4, {
          clave_concepto: 'EXT-001',
          descripcion: 'Excavación adicional en roca',
          unidad_medida: 'M3',
          cantidad: 15,
          costo_directo_unitario: 350,
          justificacion: 'Imprevisto geotécnico en terreno',
        });

        expect(res.clave_concepto).toBe('EXT-001');
        expect(res.es_extraordinario).toBe(true);
      });

      it('debe rechazar clave duplicada en conceptos extraordinarios', async () => {
        obraRepository.findOne.mockResolvedValue({ id_obra: 10, activo: true });
        catalogoRepository.findOne.mockResolvedValue({
          id_catalogo: 5,
          tipo_catalogo: 'EXTRAORDINARIO',
        });
        conceptoRepository.findOne.mockResolvedValue({ id_concepto: 90, clave_concepto: 'EXT-001' });

        await expect(
          catalogosService.crearConceptoExtraordinario(10, 4, {
            clave_concepto: 'EXT-001',
            descripcion: 'Duplicado',
            unidad_medida: 'M3',
            cantidad: 5,
            costo_directo_unitario: 100,
          }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('HU-029: Registrar convenios relacionados con volumen', () => {
      it('debe registrar un convenio modificatorio de volumen y asociarlo a la obra', async () => {
        obraRepository.findOne.mockResolvedValue({ id_obra: 10, activo: true });
        convenioRepository.findOne.mockResolvedValue(null);
        convenioRepository.create.mockReturnValue({
          id_convenio: 1,
          numero_convenio: 'CONV-MOD-VOL-01',
          tipo_convenio: 'MODIFICATORIO_VOLUMEN',
        });
        convenioRepository.save.mockResolvedValue({ id_convenio: 1 });
        convenioRepository.findOneOrFail.mockResolvedValue({
          id_convenio: 1,
          numero_convenio: 'CONV-MOD-VOL-01',
          tipo_convenio: 'MODIFICATORIO_VOLUMEN',
          monto_adicional: 250000,
          dias_ampliacion: 10,
        });

        const res = await catalogosService.crearConvenio(10, 2, {
          numero_convenio: 'CONV-MOD-VOL-01',
          tipo_convenio: 'MODIFICATORIO_VOLUMEN',
          descripcion: 'Ampliación de volumen en terracerías',
          fecha_firma: '2026-11-05',
          monto_adicional: 250000,
          dias_ampliacion: 10,
        });

        expect(res.id_convenio).toBe(1);
        expect(res.numero_convenio).toBe('CONV-MOD-VOL-01');
      });

      it('debe rechazar número de convenio duplicado en la misma obra', async () => {
        obraRepository.findOne.mockResolvedValue({ id_obra: 10, activo: true });
        convenioRepository.findOne.mockResolvedValue({ id_convenio: 1, numero_convenio: 'CONV-01' });

        await expect(
          catalogosService.crearConvenio(10, 2, {
            numero_convenio: 'CONV-01',
            descripcion: 'Duplicado',
            fecha_firma: '2026-11-05',
          }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('HU-030 & HU-031: Registrar quién y cuándo realizó la modificación', () => {
      it('debe registrar en auditoría el id_usuario_modifica y generar el timestamp al alterar volumen', async () => {
        catalogoRepository.findOne.mockResolvedValue({
          id_catalogo: 2,
          tipo_catalogo: 'MODIFICADO',
          estatus_aprobacion: 'BORRADOR',
          activo: true,
        });
        conceptoRepository.findOne.mockResolvedValue({
          id_concepto: 22,
          id_catalogo: 2,
          clave_concepto: 'PREL-001',
          cantidad: 100,
          costo_directo_unitario: 50,
          activo: true,
        });
        conceptoRepository.save.mockResolvedValue({ id_concepto: 22, cantidad: 140 });
        conceptoRepository.findOneOrFail.mockResolvedValue({
          id_concepto: 22,
          clave_concepto: 'PREL-001',
          cantidad: 140,
          costo_directo_unitario: 50,
        });

        let savedHistorial: any = null;
        historialRepository.create.mockImplementation((data: any) => {
          savedHistorial = { ...data, id_historial: 1 };
          return savedHistorial;
        });
        historialRepository.save.mockImplementation(async (hist: any) => hist);

        const res = await catalogosService.modificarCantidadConcepto(2, 22, 7, {
          cantidad_nueva: 140,
          justificacion: 'Ajuste de volumen conforme a convenio 1',
        });

        expect(res.cantidad).toBe(140);
        expect(savedHistorial).toBeDefined();
        expect(savedHistorial.id_usuario_modifica).toBe(7); // HU-030
        expect(savedHistorial.fecha_modificacion).toBeInstanceOf(Date); // HU-031
        expect(savedHistorial.valor_anterior).toBe('100');
        expect(savedHistorial.valor_nuevo).toBe('140');
      });

      it('debe rechazar modificar cantidades si el catálogo es ORIGINAL y está BLOQUEADO', async () => {
        catalogoRepository.findOne.mockResolvedValue({
          id_catalogo: 1,
          tipo_catalogo: 'ORIGINAL',
          estatus_aprobacion: 'BLOQUEADO',
          activo: true,
        });

        await expect(
          catalogosService.modificarCantidadConcepto(1, 21, 7, {
            cantidad_nueva: 120,
            justificacion: 'Intento ilegal',
          }),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('HU-032 & HU-033: Consultar historial y conservar trazabilidad inmutable', () => {
      it('debe devolver el historial ordenado cronológicamente para el catálogo', async () => {
        catalogoRepository.findOne.mockResolvedValue({ id_catalogo: 2, activo: true });
        historialRepository.find.mockResolvedValue([
          {
            id_historial: 2,
            campo_modificado: 'cantidad',
            valor_anterior: '100',
            valor_nuevo: '140',
            fecha_modificacion: new Date('2026-11-05T12:00:00Z'),
            usuario: { nombre_completo: 'Ing. Carlos Residente' },
          },
        ]);

        const historial = await catalogosService.obtenerHistorialCatalogo(2);
        expect(historial).toHaveLength(1);
        expect(historial[0].valor_nuevo).toBe('140');
      });
    });
  });
});
