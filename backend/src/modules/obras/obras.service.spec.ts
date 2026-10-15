import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ObrasService } from './obras.service.js';
import { Obra } from './entities/obra.entity.js';
import { AsignacionObra } from './entities/asignacion-obra.entity.js';
import { User } from '../users/entities/user.entity.js';

describe('ObrasService (Sprint 2: HU-007 a HU-013)', () => {
  let obrasService: ObrasService;
  let obraRepository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let asignacionRepository: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let userRepository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    obraRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    asignacionRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    userRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ObrasService,
        {
          provide: getRepositoryToken(Obra),
          useValue: obraRepository,
        },
        {
          provide: getRepositoryToken(AsignacionObra),
          useValue: asignacionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    obrasService = module.get<ObrasService>(ObrasService);
  });

  describe('HU-007, HU-008, HU-009: Registro de Obra Pública', () => {
    const validDto = {
      clave_obra: 'OBRA-2026-ED-001',
      nombre_obra: 'Construcción de Laboratorios',
      numero_contrato: 'DGCOP-LPN-045-2026',
      presupuesto_autorizado: 12500000.5,
      porcentaje_anticipo: 30.0,
      fecha_inicio_programada: '2026-11-01',
      fecha_termino_programada: '2027-05-31',
    };

    it('HU-009: debe rechazar fechas inconsistentes si fecha_termino < fecha_inicio', async () => {
      const invalidDatesDto = {
        ...validDto,
        fecha_inicio_programada: '2027-06-01',
        fecha_termino_programada: '2026-11-01',
      };

      await expect(obrasService.create(invalidDatesDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('HU-007: debe lanzar ConflictException si la clave_obra ya existe', async () => {
      obraRepository.findOne.mockResolvedValueOnce({ id_obra: 1, clave_obra: validDto.clave_obra });

      await expect(obrasService.create(validDto)).rejects.toThrow(
        /ya se encuentra registrada/,
      );
    });

    it('HU-007: debe lanzar ConflictException si el numero_contrato ya existe', async () => {
      obraRepository.findOne
        .mockResolvedValueOnce(null) // clave libre
        .mockResolvedValueOnce({ id_obra: 2, numero_contrato: validDto.numero_contrato }); // contrato duplicado

      await expect(obrasService.create(validDto)).rejects.toThrow(
        /ya se encuentra registrado/,
      );
    });

    it('HU-007 & HU-008: debe guardar exitosamente la obra con presupuesto y anticipo válido', async () => {
      obraRepository.findOne.mockResolvedValue(null);
      obraRepository.create.mockImplementation((d) => ({ ...d, id_obra: 10, estatus: 'EN_EJECUCION', activo: true }));
      obraRepository.save.mockImplementation(async (o) => o);

      const result = await obrasService.create(validDto);

      expect(result.id_obra).toBe(10);
      expect(result.clave_obra).toBe(validDto.clave_obra);
      expect(result.presupuesto_autorizado).toBe(validDto.presupuesto_autorizado);
      expect(result.porcentaje_anticipo).toBe(30.0);
      expect(result.estatus).toBe('EN_EJECUCION');
      expect(obraRepository.save).toHaveBeenCalled();
    });
  });

  describe('HU-010, HU-011, HU-012: Asignación de Cuadrilla (Terna LOPSRM)', () => {
    const mockObra = {
      id_obra: 1,
      clave_obra: 'OBRA-01',
      nombre_obra: 'Hospital General',
      asignaciones: [],
    };

    beforeEach(() => {
      obraRepository.findOne.mockResolvedValue(mockObra);
    });

    it('debe lanzar NotFoundException si el usuario asignado no existe', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        obrasService.assignCuadrilla(1, { id_usuario: 99, rol_en_obra: 'RESIDENTE' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el usuario asignado está inactivo', async () => {
      userRepository.findOne.mockResolvedValue({
        id_usuario: 5,
        nombre_completo: 'Ing. Inactivo',
        activo: false,
        rol: { nombre_rol: 'RESIDENTE' },
      });

      await expect(
        obrasService.assignCuadrilla(1, { id_usuario: 5, rol_en_obra: 'RESIDENTE' }),
      ).rejects.toThrow(/se encuentra inactivo/);
    });

    it('debe lanzar BadRequestException si el rol del usuario no coincide con la figura operativa', async () => {
      userRepository.findOne.mockResolvedValue({
        id_usuario: 6,
        nombre_completo: 'Ing. Supervisor Perez',
        activo: true,
        rol: { nombre_rol: 'SUPERVISOR' },
      });

      // Intento asignar a un SUPERVISOR como RESIDENTE
      await expect(
        obrasService.assignCuadrilla(1, { id_usuario: 6, rol_en_obra: 'RESIDENTE' }),
      ).rejects.toThrow(/Incompatibilidad de rol/);
    });

    it('HU-010: debe asignar exitosamente un RESIDENTE válido a la obra', async () => {
      userRepository.findOne.mockResolvedValue({
        id_usuario: 7,
        nombre_completo: 'Arq. Mariana Ruiz',
        activo: true,
        rol: { nombre_rol: 'RESIDENTE' },
      });

      asignacionRepository.findOne.mockResolvedValue(null);
      asignacionRepository.create.mockReturnValue({
        id_obra: 1,
        id_usuario: 7,
        rol_en_obra: 'RESIDENTE',
        activo: true,
      });
      asignacionRepository.save.mockImplementation(async (a) => a);

      const result = await obrasService.assignCuadrilla(1, { id_usuario: 7, rol_en_obra: 'RESIDENTE' });

      expect(asignacionRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('HU-011: debe reasignar un SUPERINTENDENTE reemplazando la asignación previa sin duplicados', async () => {
      userRepository.findOne.mockResolvedValue({
        id_usuario: 8,
        nombre_completo: 'Ing. Roberto Valdes',
        activo: true,
        rol: { nombre_rol: 'SUPERINTENDENTE' },
      });

      const existingAsig = {
        id_asignacion: 20,
        id_obra: 1,
        id_usuario: 999, // superintendente previo
        rol_en_obra: 'SUPERINTENDENTE',
        activo: true,
      };

      asignacionRepository.findOne.mockResolvedValue(existingAsig);
      asignacionRepository.save.mockImplementation(async (a) => a);

      await obrasService.assignCuadrilla(1, { id_usuario: 8, rol_en_obra: 'SUPERINTENDENTE' });

      expect(existingAsig.id_usuario).toBe(8);
      expect(asignacionRepository.save).toHaveBeenCalledWith(existingAsig);
    });
  });

  describe('HU-013: Consultar Obras Asignadas (Aislamiento Operativo)', () => {
    it('debe devolver todas las obras si el usuario es ADMINISTRADOR o DIRECTOR', async () => {
      obraRepository.find.mockResolvedValue([{ id_obra: 1 }, { id_obra: 2 }]);

      const resultAdmin = await obrasService.findMyWorks(1, 'ADMINISTRADOR');
      const resultDirector = await obrasService.findMyWorks(2, 'DIRECTOR');

      expect(resultAdmin.length).toBe(2);
      expect(resultDirector.length).toBe(2);
      expect(obraRepository.find).toHaveBeenCalledTimes(2);
    });

    it('debe filtrar exclusivamente las obras asignadas si es usuario operativo', async () => {
      const qbMock: any = {
        innerJoinAndSelect: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([{ id_obra: 1, nombre_obra: 'Mi Obra Asignada' }]),
      };

      obraRepository.createQueryBuilder.mockReturnValue(qbMock);

      const result = await obrasService.findMyWorks(10, 'SUPERINTENDENTE');

      expect(result.length).toBe(1);
      expect(result[0].nombre_obra).toBe('Mi Obra Asignada');
      expect(qbMock.where).toHaveBeenCalledWith('obra.activo = :obraActivo', { obraActivo: true });
      expect(qbMock.andWhere).toHaveBeenCalledWith('asig.id_usuario = :userId', { userId: 10 });
    });
  });

  describe('getCandidates: Listar candidatos para selectores de cuadrilla', () => {
    it('debe clasificar a los usuarios activos en las 3 figuras de la terna', async () => {
      userRepository.find.mockResolvedValue([
        { id_usuario: 1, nombre_completo: 'Residente 1', activo: true, rol: { nombre_rol: 'RESIDENTE' } },
        { id_usuario: 2, nombre_completo: 'Superintendente 1', activo: true, rol: { nombre_rol: 'SUPERINTENDENTE' } },
        { id_usuario: 3, nombre_completo: 'Supervisor 1', activo: true, rol: { nombre_rol: 'SUPERVISOR' } },
        { id_usuario: 4, nombre_completo: 'Director 1', activo: true, rol: { nombre_rol: 'DIRECTOR' } },
      ]);

      const candidatos = await obrasService.getCandidates();

      expect(candidatos.residentes.length).toBe(1);
      expect(candidatos.superintendentes.length).toBe(1);
      expect(candidatos.supervisores.length).toBe(1);
      expect(candidatos.residentes[0].nombre_completo).toBe('Residente 1');
    });
  });
});
