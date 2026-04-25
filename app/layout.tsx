import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tru Blu V2',
  description: 'Local-only internal operations portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
