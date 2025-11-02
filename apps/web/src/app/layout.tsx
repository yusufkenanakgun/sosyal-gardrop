import './globals.css';
import Providers from './providers';
import ClientBootstrap from './client-bootstrap';

export const metadata = {
  title: 'Sosyal Gardrop',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: 'sans-serif' }}>
        <Providers>
          {/* Sadece client’ta çalışır, server’da çağrı yapmaz */}
          <ClientBootstrap />
          {children}
        </Providers>
      </body>
    </html>
  );
}
