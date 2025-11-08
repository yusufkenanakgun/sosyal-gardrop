'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '../ui';

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: '🏠', label: 'Home', href: '/dashboard' },
  { icon: '🔍', label: 'Search', href: '/search' },
  { icon: '🧭', label: 'Explore', href: '/explore' },
  { icon: '👕', label: 'Wardrobe', href: '/wardrobe' },
  { icon: '💬', label: 'Messages', href: '/messages' },
  { icon: '👤', label: 'Profile', href: '/profile' },
];

interface SidebarProps {
  user?: { name?: string; email: string };
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-gray-200 bg-white h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          StyleGram
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gray-100 font-semibold'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-base">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
          <Avatar
            alt={user?.name || user?.email || 'User'}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full mt-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
