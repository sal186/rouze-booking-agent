import './globals.css';
import type { Metadata } from 'next';

// Force all routes to be dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Rouze Booking Agent',
  description: 'Book your appointments easily',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
