'use client';

import { useEffect } from 'react';
import { restore } from '@/lib/api';

export default function ClientBootstrap() {
  // İlk render’da refresh token & uid’i memory’e al
  useEffect(() => {
    restore();
  }, []);

  return null;
}
