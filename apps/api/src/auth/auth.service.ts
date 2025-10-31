import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';

type JwtPayload = {
  sub: string;
  email?: string;
  typ?: 'refresh' | 'access';
  iat?: number;
  exp?: number;
};

function isJwtPayload(v: unknown): v is JwtPayload {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  const subOk = typeof o.sub === 'string';
  const emailOk = o.email === undefined || typeof o.email === 'string';
  const typOk = o.typ === undefined || o.typ === 'refresh' || o.typ === 'access';
  return subOk && emailOk && typOk;
}

function parseTtl(input: string | number | undefined, fallbackSec: number): number {
  if (input == null) return fallbackSec;
  if (typeof input === 'number') return input;
  const s = String(input).trim(); // "15m", "7d", "3600" vs.
  if (/^\d+$/.test(s)) return Number(s);
  const m = s.match(/^(\d+)([smhd])$/i);
  if (!m) return fallbackSec;
  const val = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return val * mult;
}

@Injectable()
export class AuthService {
  private readonly secret = String(process.env.JWT_SECRET ?? '');
  private readonly accessTtlSec = parseTtl(process.env.ACCESS_TOKEN_TTL, 900); // 15m
  private readonly refreshTtlSec = parseTtl(process.env.REFRESH_TOKEN_TTL, 604800); // 7d

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  private pickSafeUser(user: User): { id: string; email: string } {
    return { id: user.id, email: user.email };
  }

  async register(email: string, password: string, name?: string) {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.create({ email, passwordHash, name });
    return this.issueTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email);
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, typ: 'access' as const },
      { secret: this.secret, expiresIn: this.accessTtlSec },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, typ: 'refresh' as const },
      { secret: this.secret, expiresIn: this.refreshTtlSec },
    );

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshTokenHash(userId, refreshHash);

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email },
    };
  }

  async refresh(userId: string, token: string) {
    const user = await this.users.findById(userId);
    if (!user?.refreshTokenHash) throw new UnauthorizedException('Invalid token');

    const ok = await bcrypt.compare(token, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException('Invalid token');

    // verifyAsync -> any döndürdüğü için önce unknown al
    const raw = await this.jwt.verifyAsync<JwtPayload>(token, { secret: this.secret });
      if (raw.typ !== 'refresh') {
        throw new UnauthorizedException('Invalid token');
      }

    // type guard ile daralt
    if (!isJwtPayload(raw) || raw.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid token');
    }

    return this.issueTokens(user.id, user.email);
  }


  async logout(userId: string) {
    await this.users.setRefreshTokenHash(userId, null);
    return { ok: true };
  }
}
