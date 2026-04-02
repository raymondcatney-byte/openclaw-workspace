export const metadata = {
  title: 'Polymarket Engine',
  description: 'Search + Anomaly Detection for Prediction Markets'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
