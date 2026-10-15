import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    createInactiveUser: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
  };
  let jwtService: {
    sign: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersService = {
      createInactiveUser: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };

    jwtService = {
      sign: vi.fn().mockReturnValue('mocked.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user in inactive state and without role', async () => {
      const registerDto = {
        nombre_completo: 'Ing. Carlos Mendoza',
        correo_electronico: 'carlos@empresa.mx',
        contrasena: 'Password123!',
        cedula_profesional: 'CED-123456',
      };

      const mockCreatedUser = {
        id_usuario: 1,
        nombre_completo: registerDto.nombre_completo,
        correo_electronico: registerDto.correo_electronico,
        cedula_profesional: registerDto.cedula_profesional,
        id_rol: null,
        activo: false,
        fecha_registro: new Date(),
      };

      usersService.createInactiveUser.mockResolvedValue(mockCreatedUser);

      const result = await authService.register(registerDto);

      expect(usersService.createInactiveUser).toHaveBeenCalledWith({
        nombre_completo: registerDto.nombre_completo,
        correo_electronico: registerDto.correo_electronico,
        contrasena: registerDto.contrasena,
        cedula_profesional: registerDto.cedula_profesional,
      });
      expect(result.mensaje).toContain('Registro exitoso');
      expect(result.usuario.activo).toBe(false);
      expect(result.usuario.id_rol).toBeNull();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          correo_electronico: 'inexistente@correo.mx',
          contrasena: 'clave',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);
      usersService.findByEmail.mockResolvedValue({
        id_usuario: 1,
        correo_electronico: 'test@correo.mx',
        contrasena_hash: hashedPassword,
      });

      await expect(
        authService.login({
          correo_electronico: 'test@correo.mx',
          contrasena: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user has no assigned role (LOPSRM rule)', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      usersService.findByEmail.mockResolvedValue({
        id_usuario: 1,
        correo_electronico: 'test@correo.mx',
        contrasena_hash: hashedPassword,
        id_rol: null,
        rol: null,
        activo: true,
      });

      await expect(
        authService.login({
          correo_electronico: 'test@correo.mx',
          contrasena: 'Password123!',
        }),
      ).rejects.toThrow(
        /Cuenta pendiente de validación: El usuario no tiene un rol normativo asignado/,
      );
    });

    it('should throw UnauthorizedException if user is inactive (LOPSRM rule)', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      usersService.findByEmail.mockResolvedValue({
        id_usuario: 1,
        correo_electronico: 'test@correo.mx',
        contrasena_hash: hashedPassword,
        id_rol: 3,
        rol: { id_rol: 3, nombre_rol: 'SUPERINTENDENTE' },
        activo: false,
      });

      await expect(
        authService.login({
          correo_electronico: 'test@correo.mx',
          contrasena: 'Password123!',
        }),
      ).rejects.toThrow(/Cuenta inactiva/);
    });

    it('should return access token and user info when credentials, role, and active status are valid', async () => {
      const rawPassword = 'ValidPassword2026!';
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      const mockUser = {
        id_usuario: 1,
        nombre_completo: 'Ing. Laura Torres',
        correo_electronico: 'laura@constructora.mx',
        contrasena_hash: hashedPassword,
        cedula_profesional: 'CED-998877',
        id_rol: 4,
        rol: { id_rol: 4, nombre_rol: 'SUPERVISOR', descripcion: 'Supervisión en campo' },
        activo: true,
      };

      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await authService.login({
        correo_electronico: mockUser.correo_electronico,
        contrasena: rawPassword,
      });

      expect(result).toHaveProperty('access_token', 'mocked.jwt.token');
      expect(result.token_type).toBe('Bearer');
      expect(result.usuario.id_usuario).toBe(1);
      expect(result.usuario.rol.nombre_rol).toBe('SUPERVISOR');
      expect(jwtService.sign).toHaveBeenCalled();
    });
  });
});
