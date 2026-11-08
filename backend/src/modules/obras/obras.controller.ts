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
import { ObrasService } from './obras.service.js';
import { CreateObraDto } from './dto/create-obra.dto.js';
import { AssignCuadrillaDto } from './dto/assign-cuadrilla.dto.js';
import { UpdateObraStatusDto } from './dto/update-obra-status.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RoleEnum } from '../../common/enums/role.enum.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Obras Públicas y Cuadrillas (Sprint 2)')
@ApiBearerAuth('JWT-auth')
@Controller('obras')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Post()
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar una obra pública (HU-007, HU-008, HU-009)',
    description:
      'Permite al Administrador dar de alta un contrato con clave, nombre, presupuesto autorizado, anticipo y fechas contractuales.',
  })
  @ApiResponse({ status: 201, description: 'Obra registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Fechas inconsistentes o datos inválidos' })
  @ApiResponse({ status: 409, description: 'Clave de obra o número de contrato duplicado' })
  async create(@Body() dto: CreateObraDto) {
    return this.obrasService.create(dto);
  }

  @Get()
  @Roles(RoleEnum.ADMINISTRADOR, RoleEnum.DIRECTOR)
  @ApiOperation({
    summary: 'Listar todas las obras registradas (Exclusivo Administrador y Director)',
  })
  @ApiResponse({ status: 200, description: 'Listado completo de obras' })
  async findAll() {
    return this.obrasService.findAll();
  }

  @Get('mis-obras')
  @ApiOperation({
    summary: 'Consultar obras asignadas al usuario actual (HU-013)',
    description:
      'Filtra los proyectos para que el Superintendente, Supervisor o Residente solo visualicen sus contratos asignados.',
  })
  @ApiResponse({ status: 200, description: 'Listado de obras asignadas al usuario' })
  async findMyWorks(@CurrentUser() user: User) {
    return this.obrasService.findMyWorks(user.id_usuario, user.rol?.nombre_rol);
  }

  @Get('candidatos')
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Obtener candidatos activos para asignación de cuadrillas (HU-010, HU-011, HU-012)',
    description:
      'Devuelve listas separadas de Residentes, Superintendentes y Supervisores activos para alimentar los selectores del formulario.',
  })
  @ApiResponse({ status: 200, description: 'Candidatos agrupados por rol normativo' })
  async getCandidates() {
    return this.obrasService.getCandidates();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar detalle de una obra por ID',
  })
  @ApiResponse({ status: 200, description: 'Detalle de la obra y su cuadrilla' })
  @ApiResponse({ status: 404, description: 'Obra no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.obrasService.findById(id);
  }

  @Post(':id/asignar')
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Asignar o reasignar figura de la terna a una obra (HU-010, HU-011, HU-012)',
    description:
      'Vincula un Residente, Superintendente o Supervisor a la obra, asegurando la no duplicidad y la compatibilidad de roles.',
  })
  @ApiResponse({ status: 200, description: 'Cuadrilla actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Incompatibilidad de rol o usuario inactivo' })
  async assignCuadrilla(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignCuadrillaDto,
  ) {
    return this.obrasService.assignCuadrilla(id, dto);
  }

  @Patch(':id/status')
  @Roles(RoleEnum.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar el estatus operativo de una obra',
  })
  @ApiResponse({ status: 200, description: 'Estatus actualizado' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateObraStatusDto,
  ) {
    return this.obrasService.updateStatus(id, dto);
  }
}
