import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@lopsrm.gob.mx',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  correo_electronico: string;

  @ApiProperty({
    example: 'AdminLOPSRM2026!',
    description: 'Contraseña de acceso',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  contrasena: string;
}
