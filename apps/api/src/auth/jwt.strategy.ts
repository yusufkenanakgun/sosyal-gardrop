import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { isJwtPayload } from './jwt-payload';

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

  // Passport 'validate' can receive unknown payload -> narrow safely
  validate(payload: unknown): { id: string; email?: string } {
    if (!isJwtPayload(payload) || (payload.typ && payload.typ !== 'access')) {
      throw new UnauthorizedException('Invalid access token payload');
    }
    return { id: payload.sub, email: payload.email };
  }
}
