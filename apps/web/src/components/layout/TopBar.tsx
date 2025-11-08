'use client';

import { useRouter } from 'next/navigation';
import { NotificationBell } from '../notifications';

export function TopBar() {
  const router = useRouter();

  return (
    <header className="lg:hidden sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-40">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          StyleGram
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/posts/create')}
            className="text-2xl hover:scale-110 transition-transform"
            title="Create Post"
          >
            ➕
          </button>
          <NotificationBell />
          <button
            onClick={() => router.push('/messages')}
            className="text-2xl hover:scale-110 transition-transform"
            title="Messages"
          >
            💬
          </button>
        </div>
      </div>
    </header>
  );
}
