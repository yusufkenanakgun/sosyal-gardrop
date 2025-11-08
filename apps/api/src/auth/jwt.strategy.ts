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
  validate(payload: unknown): { sub: string; email?: string; id: string; userId: string } {
    if (!isJwtPayload(payload) || (payload.typ && payload.typ !== 'access')) {
      throw new UnauthorizedException('Invalid access token payload');
    }
    // Return both 'sub', 'id', and 'userId' for backwards compatibility
    return { sub: payload.sub, id: payload.sub, userId: payload.sub, email: payload.email };
  }
}
