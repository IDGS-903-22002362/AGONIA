
import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GymCentral - Tu Gimnasio Digital',
  description: 'Prototipo de gestión de suscripciones para gimnasios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="mobile-view shadow-2xl overflow-hidden bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
