import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, Min } from 'class-validator';

export class AssignCuadrillaDto {
  @ApiProperty({
    example: 2,
    description: 'Identificador del usuario a asignar a la obra (HU-010, HU-011, HU-012)',
  })
  @IsInt({ message: 'El id_usuario debe ser un número entero' })
  @Min(1, { message: 'El id_usuario debe ser válido' })
  @IsNotEmpty({ message: 'El id_usuario es obligatorio' })
  id_usuario: number;

  @ApiProperty({
    example: 'RESIDENTE',
    description: 'Rol operativo a desempeñar en la obra (RESIDENTE, SUPERINTENDENTE o SUPERVISOR)',
    enum: ['RESIDENTE', 'SUPERINTENDENTE', 'SUPERVISOR'],
  })
  @IsIn(['RESIDENTE', 'SUPERINTENDENTE', 'SUPERVISOR'], {
    message: 'El rol_en_obra debe ser estrictamente RESIDENTE, SUPERINTENDENTE o SUPERVISOR',
  })
  @IsNotEmpty({ message: 'El rol_en_obra es obligatorio' })
  rol_en_obra: 'RESIDENTE' | 'SUPERINTENDENTE' | 'SUPERVISOR';
}
