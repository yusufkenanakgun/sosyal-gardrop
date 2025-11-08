'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/api/auth';
import { restore } from '@/lib/api/session';
import { Sidebar, BottomNav } from '@/components/layout';
import { FloatingMessageBox } from '@/components/messages';
import { SocketProvider } from '@/contexts/SocketContext';

type Me = { id: string; email: string };

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        restore();
        const u = await auth.me();
        if (!alive) return;
        setMe(u);
        setReady(true);
      } catch (e) {
        console.warn('ProtectedLayout /me error:', e);

        // /upload sayfasında yumuşak davran: yönlendirme yok, sayfayı aç
        if (pathname?.startsWith('/upload')) {
          if (!alive) return;
          setMe(null);
          setReady(true);
          return;
        }

        // diğer protected sayfalarda login'e yönlendir
        const next = encodeURIComponent(pathname || '/');
        router.replace(`/login?next=${next}`);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, pathname]);

  const handleLogout = async () => {
    await auth.logout();
    router.replace('/login');
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <Sidebar user={me || undefined} onLogout={handleLogout} />

        {/* Main Content */}
        <div className="lg:ml-64 min-h-screen pb-16 lg:pb-0">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav />

        {/* Floating Message Box - Hidden on messages page */}
        {pathname !== '/messages' && <FloatingMessageBox />}
      </div>
    </SocketProvider>
  );
}
