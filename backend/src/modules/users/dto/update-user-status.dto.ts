import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    example: true,
    description: 'Estado de activación de la cuenta (true: activa / false: inactiva)',
  })
  @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
  @IsNotEmpty({ message: 'El campo activo es obligatorio' })
  activo: boolean;
}
