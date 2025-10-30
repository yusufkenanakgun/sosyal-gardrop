import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

type JwtPayload = {
  sub: string;
  email?: string;
  typ?: 'refresh' | 'access';
  iat?: number;
  exp?: number;
};

function parseTtl(input: string | number | undefined, fallbackSec: number) {
  if (!input) return fallbackSec;
  if (typeof input === 'number') return input;
  const s = String(input).trim(); // "15m", "7d", "3600" vb.
  if (/^\d+$/.test(s)) return Number(s);
  const m = s.match(/^(\d+)([smhd])$/i);
  if (!m) return fallbackSec;
  const val = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult =
    unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return val * mult;
}

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  private readonly secret = process.env.JWT_SECRET!;
  private readonly accessTtlSec = parseTtl(process.env.ACCESS_TOKEN_TTL, 900); // 15m
  private readonly refreshTtlSec = parseTtl(
    process.env.REFRESH_TOKEN_TTL,
    604800,
  ); // 7d

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

  async issueTokens(userId: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, typ: 'access' satisfies JwtPayload['typ'] },
      { secret: this.secret, expiresIn: this.accessTtlSec },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, typ: 'refresh' as const },
      { secret: this.secret, expiresIn: this.refreshTtlSec },
    );

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshTokenHash(userId, refreshHash);

    return { accessToken, refreshToken, user: { id: userId, email } };
  }

  async refresh(userId: string, token: string) {
    // Not: tercihen UsersService üstünden bir getById metodu kullanın
    const user = await this.users['prisma'].user.findUnique({
      where: { id: userId },
    });

    if (!user?.refreshTokenHash) throw new UnauthorizedException();
    const ok = await bcrypt.compare(token, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException();

    // verifyAsync generics ile tip güvenli
    const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.secret,
    });
    if (payload?.typ !== 'refresh') throw new UnauthorizedException();

    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.users.setRefreshTokenHash(userId, null);
    return { ok: true };
  }
}
