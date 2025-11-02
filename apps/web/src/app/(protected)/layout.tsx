'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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
        api.restore();
        const u = await api.me();
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
    return () => { alive = false; };
  }, [router, pathname]);

  if (!ready) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/explore', label: 'Explore' },
    { href: '/wardrobe', label: 'Wardrobe' },
    { href: '/messages', label: 'Messages' },
    { href: '/profile',  label: 'Profile'  },
  ];

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <nav
        style={{
          display: 'flex',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid #eee',
          alignItems: 'center',
        }}
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{ textDecoration: pathname === l.href ? 'underline' : 'none' }}
          >
            {l.label}
          </Link>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>{me?.email ?? 'guest'}</span>
          {me ? (
            <button
              onClick={async () => {
                await api.logout();
                router.replace('/login');
              }}
              style={{
                border: '1px solid #ddd',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(pathname || '/upload')}`}
              style={{
                border: '1px solid #ddd',
                padding: '4px 10px',
                borderRadius: 6,
                background: 'white',
              }}
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* /upload'ta misafirken presign 401 alırsın; ama sayfa login'e atmaz.
          UploadOptions içinde login formu veya yönlendirme linki gösterebilirsin. */}
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
