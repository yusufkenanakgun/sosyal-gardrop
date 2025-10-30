import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not set');
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
      throw new UnauthorizedException('Invalid refresh token payload');
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
