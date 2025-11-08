import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Log for debugging
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers?.authorization;
      console.error('[JwtAuthGuard] Authentication failed:', {
        error: err?.message,
        info: info?.message || info?.name,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 20),
      });
    }

    if (err || !user) {
      // Daha açıklayıcı hata mesajları
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token süresi dolmuş. Lütfen yeniden giriş yapın.');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Geçersiz token. Lütfen yeniden giriş yapın.');
      }
      if (info?.message === 'No auth token') {
        throw new UnauthorizedException('Token bulunamadı. Lütfen giriş yapın.');
      }
      throw err || new UnauthorizedException('Yetkisiz erişim.');
    }
    return user;
  }
}
