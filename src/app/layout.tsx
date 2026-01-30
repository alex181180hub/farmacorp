import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Farmatech POS',
  description: 'Sistema de Ventas e Inventarios Farmacéutico - Bolivia',
};

import Shell from '@/components/Shell';
import Header from '@/components/Header';

import { getSession } from '@/lib/auth';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const userRole = session?.user?.role || '';

  return (
    <html lang="es">
      <body suppressHydrationWarning>
        <Shell header={<Header />} userRole={userRole}>{children}</Shell>
      </body>
    </html>
  );
}
