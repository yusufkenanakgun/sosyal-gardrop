import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Sosyal Gardrop',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: 'sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
