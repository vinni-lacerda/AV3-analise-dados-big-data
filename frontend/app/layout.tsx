import type { Metadata } from 'next';
import '../src/styles/global.css';

export const metadata: Metadata = {
  title: 'Observatório RAIS Turismo 2025',
  description: 'Observatório de empregos formais no turismo com dados RAIS.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
