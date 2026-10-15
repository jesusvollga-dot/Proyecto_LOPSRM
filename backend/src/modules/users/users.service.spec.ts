import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';
import { Role } from './entities/role.entity.js';

describe('UsersService', () => {
  let usersService: UsersService;
  let userRepository: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let roleRepository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    userRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    roleRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('createInactiveUser', () => {
    it('should throw ConflictException if email is already registered', async () => {
      userRepository.findOne.mockResolvedValue({ id_usuario: 1, correo_electronico: 'duplicado@correo.mx' });

      await expect(
        usersService.createInactiveUser({
          nombre_completo: 'Test User',
          correo_electronico: 'duplicado@correo.mx',
          contrasena: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create an inactive user with null role and hashed password', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockImplementation((dto) => ({
        ...dto,
        id_usuario: 10,
        fecha_registro: new Date(),
      }));
      userRepository.save.mockImplementation(async (u) => u);

      const result = await usersService.createInactiveUser({
        nombre_completo: 'Ing. Pedro Paramo',
        correo_electronico: 'pedro@correo.mx',
        contrasena: 'Password2026!',
        cedula_profesional: 'CED-12345',
      });

      expect(result.id_usuario).toBe(10);
      expect(result.activo).toBe(false);
      expect(result.id_rol).toBeNull();
      expect(result).not.toHaveProperty('contrasena_hash');
    });
  });

  describe('assignRole', () => {
    it('should throw BadRequestException if role does not exist', async () => {
      userRepository.findOne.mockResolvedValue({ id_usuario: 5, nombre_completo: 'Juan' });
      roleRepository.findOne.mockResolvedValue(null);

      await expect(usersService.assignRole(5, { id_rol: 99, activo: true })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should assign role and activate user successfully', async () => {
      const mockUser = {
        id_usuario: 5,
        nombre_completo: 'Juan Perez',
        id_rol: null,
        activo: false,
      };
      const mockRole = {
        id_rol: 2,
        nombre_rol: 'RESIDENTE',
        descripcion: 'Representante de la Dependencia',
      };

      userRepository.findOne.mockImplementation(({ where }) => {
        if (where.id_usuario === 5) {
          return Promise.resolve({ ...mockUser, rol: mockRole, id_rol: 2, activo: true });
        }
        return Promise.resolve(null);
      });
      roleRepository.findOne.mockResolvedValue(mockRole);
      userRepository.save.mockImplementation(async (u) => u);

      const updated = await usersService.assignRole(5, { id_rol: 2, activo: true });

      expect(updated.id_rol).toBe(2);
      expect(updated.activo).toBe(true);
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should toggle user active status (soft delete)', async () => {
      const mockUser = {
        id_usuario: 8,
        nombre_completo: 'Ana Silva',
        activo: true,
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockImplementation(async (u) => u);

      await usersService.updateStatus(8, { activo: false });

      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(usersService.findById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
