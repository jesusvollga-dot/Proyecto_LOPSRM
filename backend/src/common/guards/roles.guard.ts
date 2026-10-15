import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(string)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const userRole = user.rol?.nombre_rol || user.role;

    if (!userRole) {
      throw new ForbiddenException(
        'El usuario no tiene un rol asignado en el sistema. Contacte al Administrador.',
      );
    }

    const hasRole = requiredRoles.some((role) => role.toUpperCase() === userRole.toUpperCase());

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado: El rol '${userRole}' no tiene los permisos suficientes para esta operación. Roles requeridos: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
