import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registro público de cuenta (RF-01 / US-01):
   * La cuenta se crea en estado inactivo y sin rol para cumplir la separación de funciones.
   */
  async register(dto: RegisterDto) {
    const user = await this.usersService.createInactiveUser({
      nombre_completo: dto.nombre_completo,
      correo_electronico: dto.correo_electronico,
      contrasena: dto.contrasena,
      cedula_profesional: dto.cedula_profesional,
    });

    return {
      mensaje:
        'Registro exitoso. Su cuenta ha sido creada en estado inactivo. Conforme a la LOPSRM, un Administrador debe validar su perfil y asignar su rol correspondiente antes de poder ingresar.',
      usuario: user,
    };
  }

  /**
   * Inicio de sesión seguro (RF-01, RNF-01 / US-03):
   * Verifica credenciales (bcrypt), rol normativo asignado y estado activo.
   */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.correo_electronico, true);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas: Correo o contraseña inválidos');
    }

    const isPasswordValid = await bcrypt.compare(dto.contrasena, user.contrasena_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas: Correo o contraseña inválidos');
    }

    // Regla de Negocio LOPSRM: El usuario no puede entrar si no tiene rol legal asignado
    if (!user.id_rol || !user.rol) {
      throw new UnauthorizedException(
        'Cuenta pendiente de validación: El usuario no tiene un rol normativo asignado por el Administrador.',
      );
    }

    // Regla de Negocio LOPSRM: El usuario no puede entrar si no ha sido activado
    if (!user.activo) {
      throw new UnauthorizedException(
        'Cuenta inactiva: Su acceso se encuentra temporalmente suspendido o en espera de aprobación.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id_usuario,
      email: user.correo_electronico,
      role: user.rol.nombre_rol,
      name: user.nombre_completo,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      usuario: {
        id_usuario: user.id_usuario,
        nombre_completo: user.nombre_completo,
        correo_electronico: user.correo_electronico,
        cedula_profesional: user.cedula_profesional,
        rol: {
          id_rol: user.rol.id_rol,
          nombre_rol: user.rol.nombre_rol,
          descripcion: user.rol.descripcion,
        },
      },
    };
  }

  /**
   * Obtener perfil del usuario actualmente autenticado
   */
  async getProfile(userId: number) {
    return this.usersService.findById(userId);
  }
}
