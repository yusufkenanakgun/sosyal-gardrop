import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  validate(payload: unknown): JwtPayload {
    const p = payload as Partial<JwtPayload> | null | undefined;

    if (!p?.sub) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return {
      sub: String(p.sub),
      email: typeof p.email === 'string' ? p.email : undefined,
      id:
        typeof p.id === 'string'
          ? p.id
          : p.id != null
            ? String(p.id)
            : undefined,
    };
  }
}
