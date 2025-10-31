'use client';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        api.restore();
        await api.me();
        // Kullanıcı giriş yaptıysa Dashboard'a yönlendir
        router.replace('/dashboard');
      } catch {
        // Giriş yapılmamışsa Login sayfasına yönlendir
        router.replace('/login');
      }
    })();
  }, [router]);

  return (
    <div style={{ padding: 24 }}>
      Yönlendiriliyor…
    </div>
  );
}
