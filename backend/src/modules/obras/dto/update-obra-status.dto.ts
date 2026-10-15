import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateObraStatusDto {
  @ApiProperty({
    example: 'SUSPENDIDA',
    description: 'Nuevo estado operativo de la obra pública',
    enum: ['EN_EJECUCION', 'SUSPENDIDA', 'TERMINADA', 'FINIQUITADA'],
  })
  @IsIn(['EN_EJECUCION', 'SUSPENDIDA', 'TERMINADA', 'FINIQUITADA'], {
    message: 'El estatus debe ser EN_EJECUCION, SUSPENDIDA, TERMINADA o FINIQUITADA',
  })
  @IsNotEmpty({ message: 'El estatus es obligatorio' })
  estatus: 'EN_EJECUCION' | 'SUSPENDIDA' | 'TERMINADA' | 'FINIQUITADA';
}
