'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    api.restore();
  }, []);

  return (
    <div style={{ maxWidth: 360, margin: '48px auto', display: 'grid', gap: 12 }}>
      <h1>Register</h1>
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button
        onClick={async () => {
          try {
            await api.register(email, password);
            router.replace('/');
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Register failed';
            setMsg(message);
          }
        }}
      >
        Register
      </button>
      <div style={{ color: 'crimson' }}>{msg}</div>
      <Link href="/login">Zaten hesabın var mı? Giriş yap</Link>
    </div>
  );
}
