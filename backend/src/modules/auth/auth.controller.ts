import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Autenticación y Registro (Auth)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registro público de nuevos usuarios (US-01 / RF-01)',
    description:
      'Registra un usuario en la plataforma. Por regla legal, el usuario queda inactivo (activo = false) y sin rol hasta que el Administrador lo valide.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado en espera de aprobación por el Administrador',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo electrónico ya se encuentra registrado',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Inicio de sesión seguro con emisión de JWT (US-03 / RF-01)',
    description:
      'Autentica credenciales con bcrypt y genera un token JWT firmado si la cuenta está activa y tiene un rol normativo asignado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso con token Bearer retornado',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas, cuenta inactiva o sin rol asignado',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener información del usuario autenticado actual',
    description: 'Ruta protegida que devuelve los datos y rol del usuario firmado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Token no provisto o inválido',
  })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id_usuario);
  }
}
