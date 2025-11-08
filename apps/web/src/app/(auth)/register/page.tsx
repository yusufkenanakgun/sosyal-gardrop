'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/api/auth';
import { restore } from '@/lib/api/session';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    restore();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await auth.register(email, password);
      // Register başarılı - login sayfasına yönlendir
      router.push('/login?registered=true');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            StyleGram
          </h1>
          <p className="text-gray-500 text-sm">
            Sign up to share your wardrobe and get style inspiration
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading || !email || !password || !confirmPassword}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            By signing up, you agree to our Terms, Data Policy and Cookies Policy.
          </p>
        </div>

        {/* Login Link */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-sm">
            Have an account?{' '}
            <Link
              href="/login"
              className="text-blue-500 font-semibold hover:text-blue-600"
            >
              Log in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2025 StyleGram</p>
        </div>
      </div>
    </div>
  );
}
