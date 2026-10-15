import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { AssignRoleDto } from './dto/assign-role.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RoleEnum } from '../../common/enums/role.enum.js';

@ApiTags('Usuarios y Roles (Administración RBAC)')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('roles')
  @ApiOperation({
    summary: 'Consultar el catálogo oficial de roles de la LOPSRM',
    description: 'Devuelve los 5 roles permitidos en el sistema.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de roles' })
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get()
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar todos los usuarios (Exclusivo Administrador)',
    description: 'Obtiene el listado completo de usuarios y sus roles asignados.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('pending')
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Listar usuarios pendientes de activación o rol (Exclusivo Administrador)',
    description: 'Obtiene solicitudes de nuevos registros que no tienen rol o están inactivos.',
  })
  @ApiResponse({ status: 200, description: 'Usuarios pendientes de asignación de rol' })
  async findPending() {
    return this.usersService.findPending();
  }

  @Get(':id')
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Consultar detalle de un usuario por ID (Exclusivo Administrador)',
  })
  @ApiResponse({ status: 200, description: 'Detalle del usuario' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Crear usuario directamente por el Administrador (US-02)',
    description: 'Permite al administrador dar de alta un usuario ya activo con rol asignado.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  async createByAdmin(@Body() dto: CreateUserByAdminDto) {
    return this.usersService.createByAdmin(dto);
  }

  @Patch(':id/role')
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Asignar o modificar rol de un usuario (RF-02 / US-02)',
    description: 'Permite al Administrador asignar uno de los 5 roles y activar la cuenta.',
  })
  @ApiResponse({ status: 200, description: 'Rol asignado exitosamente' })
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRoleDto,
  ) {
    return this.usersService.assignRole(id, dto);
  }

  @Patch(':id/status')
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Activar o suspender cuenta de usuario (Soft Delete / RF-20)',
    description: 'Permite habilitar o deshabilitar el acceso al sistema sin eliminar registros históricos.',
  })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, dto);
  }
}
