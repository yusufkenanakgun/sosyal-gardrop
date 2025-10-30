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
    (async () => {
      try {
        api.restore(); // refresh token'ı localStorage'dan yükle
        const u = await api.me(); // mevcut kullanıcıyı doğrula
        setMe(u);
        setReady(true);
      } catch {
        router.replace('/login');
      }
    })();
  }, [router]);

  if (!ready) return <div style={{ padding: 24 }}>Loading…</div>;

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/explore', label: 'Explore' },
    { href: '/wardrobe', label: 'Wardrobe' },
    { href: '/messages', label: 'Messages' },
    { href: '/profile', label: 'Profile' },
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
            style={{
              textDecoration: pathname === l.href ? 'underline' : 'none',
            }}
          >
            {l.label}
          </Link>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>{me?.email}</span>
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
        </div>
      </nav>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
