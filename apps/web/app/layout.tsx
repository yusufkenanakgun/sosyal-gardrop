// apps/web/app/layout.tsx
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Sosyal Gardrop Web",
  description: "Wardrobe, Explore, Messages, Profile – MVP shell",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold">
              Sosyal Gardrop
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/explore" className="hover:underline">Explore</Link>
              <Link href="/wardrobe" className="hover:underline">Wardrobe</Link>
              <Link href="/messages" className="hover:underline">Messages</Link>
              <Link href="/profile" className="hover:underline">Profile</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
