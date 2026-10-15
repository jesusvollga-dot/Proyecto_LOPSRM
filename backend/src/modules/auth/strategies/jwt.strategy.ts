import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string | null;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'super_secret_lopsrm_key_jwt_2026_ads'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id_usuario: payload.sub },
      relations: { rol: true },
    });

    if (!user) {
      throw new UnauthorizedException('Token inválido: Usuario no encontrado');
    }

    if (!user.activo) {
      throw new UnauthorizedException('La cuenta de usuario ha sido desactivada');
    }

    return user;
  }
}
