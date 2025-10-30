import 'express';

declare global {
  namespace Express {
    interface User {
      sub: string;
      email?: string;
      id?: string;
      [k: string]: unknown;
    }
  }
}

export {}; // dosyayı module yapmak için
