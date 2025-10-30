// apps/api/src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

type TokenHeader = string | undefined;

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() b: { email: string; password: string; name?: string }) {
    return this.auth.register(b.email, b.password, b.name);
  }

  @Post('login')
  login(@Body() b: { email: string; password: string }) {
    return this.auth.login(b.email, b.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: Request) {
    const userId = String(req.user?.id ?? req.user?.sub ?? '');
    const email = req.user?.email ?? '';
    if (!userId) throw new UnauthorizedException('Unauthorized');
    return { userId, email };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(@Req() req: Request) {
    const authHeader: TokenHeader =
      typeof req.headers?.authorization === 'string'
        ? req.headers.authorization
        : undefined;

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    const sub = String(req.user?.sub ?? '');
    if (!token || !sub) throw new UnauthorizedException('Unauthorized');

    return this.auth.refresh(sub, token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Req() req: Request) {
    const sub = String(req.user?.sub ?? '');
    if (!sub) throw new UnauthorizedException('Unauthorized');
    return this.auth.logout(sub);
  }
}
