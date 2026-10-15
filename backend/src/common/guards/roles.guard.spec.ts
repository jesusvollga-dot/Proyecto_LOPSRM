import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no roles are required on handler or class', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: 'ADMINISTRADOR' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not present in request', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRADOR']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no role assigned', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRADOR']);
    const context = createMockContext({ id_usuario: 1, role: null, rol: null });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user role does not match required roles', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRADOR']);
    const context = createMockContext({
      id_usuario: 2,
      rol: { nombre_rol: 'SUPERINTENDENTE' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user role matches one of the required roles (case-insensitive)', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMINISTRADOR', 'RESIDENTE']);
    const context = createMockContext({
      id_usuario: 3,
      rol: { nombre_rol: 'administrador' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
