'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: '🏠', label: 'Home', href: '/dashboard' },
  { icon: '🔍', label: 'Explore', href: '/explore' },
  { icon: '📦', label: 'Outfits', href: '/outfits' },
  { icon: '👕', label: 'Wardrobe', href: '/wardrobe' },
  { icon: '👤', label: 'Profile', href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-2 flex-1"
            >
              <span className={`text-2xl ${isActive ? 'scale-110' : 'opacity-70'}`}>
                {item.icon}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-black"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
