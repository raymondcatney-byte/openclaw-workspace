// app/biotech/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Biotech Protocol | Research & Intelligence',
  description: 'Biohacking research, compound database, and intelligence dashboard',
};

export default function BiotechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950">{children}</body>
    </html>
  );
}
