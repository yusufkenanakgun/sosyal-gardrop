'use client';

import { fetchJSON } from './client';
import { setSession, clearSession } from './session';
import { AuthResponse, User } from './types';

export const auth = {
  async register(email: string, password: string, name?: string) {
    // Register artık otomatik login yapmıyor - sadece kullanıcı oluşturuyor
    const data = await fetchJSON<AuthResponse>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name }) },
      false // retry = false for register
    );

    // Session set etmiyoruz - kullanıcı login sayfasına yönlendirilecek
    return data;
  },

  async login(email: string, password: string) {
    const data = await fetchJSON<AuthResponse>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false // retry = false for login
    );

    // Login başarılı - session'ı set et (rememberMe her zaman true - localStorage kullanıyoruz)
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userId: data.user.id
    });

    return data;
  },

  async me() {
    const d = await fetchJSON<{ userId: string; email: string }>('/auth/me');
    return { id: d.userId, email: d.email } as User;
  },

  async logout() {
    try {
      await fetchJSON('/auth/logout', { method: 'POST' });
    } catch {
      /* no-op */
    }
    clearSession();
  },
};
