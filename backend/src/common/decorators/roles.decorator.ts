import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../enums/role.enum.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (RoleEnum | string)[]) => SetMetadata(ROLES_KEY, roles);
