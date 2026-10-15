import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Ing. Carlos Mendoza Silva',
    description: 'Nombre completo del profesional o usuario',
  })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  nombre_completo: string;

  @ApiProperty({
    example: 'carlos.mendoza@empresa-constructora.mx',
    description: 'Correo electrónico único para inicio de sesión',
  })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  correo_electronico: string;

  @ApiProperty({
    example: 'SuperSecreta123!',
    description: 'Contraseña de acceso (mínimo 8 caracteres)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  contrasena: string;

  @ApiPropertyOptional({
    example: 'CED-8472910',
    description: 'Cédula profesional de ingeniero o arquitecto (obligatoria para terna legal)',
  })
  @IsOptional()
  @IsString()
  cedula_profesional?: string;
}
