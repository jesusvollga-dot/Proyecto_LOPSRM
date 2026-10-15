import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateUserByAdminDto {
  @ApiProperty({
    example: 'Arq. Mariana Ruiz Soto',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty()
  nombre_completo: string;

  @ApiProperty({
    example: 'mariana.ruiz@dependencia.gob.mx',
    description: 'Correo electrónico institucional',
  })
  @IsEmail()
  @IsNotEmpty()
  correo_electronico: string;

  @ApiProperty({
    example: 'ClaveSegura2026!',
    description: 'Contraseña temporal o inicial',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  contrasena: string;

  @ApiPropertyOptional({
    example: 'CED-9182736',
    description: 'Cédula profesional',
  })
  @IsOptional()
  @IsString()
  cedula_profesional?: string;

  @ApiProperty({
    example: 2,
    description: 'Rol normativo a asignar (1: ADMIN, 2: RESIDENTE, 3: SUPERINTENDENTE, 4: SUPERVISOR, 5: DIRECTOR)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  id_rol: number;
}
