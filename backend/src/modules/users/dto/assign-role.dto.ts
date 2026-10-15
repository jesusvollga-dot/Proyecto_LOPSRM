import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    example: 4,
    description: 'Identificador del rol a asignar (1: ADMIN, 2: RESIDENTE, 3: SUPERINTENDENTE, 4: SUPERVISOR, 5: DIRECTOR)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'El id_rol debe ser un número entero válido' })
  @Min(1)
  @Max(5)
  @IsNotEmpty({ message: 'El id_rol es obligatorio' })
  id_rol: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Activar o dejar inactiva la cuenta al asignar el rol (por defecto true)',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo?: boolean = true;
}
