'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJSON } from '@/lib/api/client';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Check if user is authenticated
        await fetchJSON('/auth/me');
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
