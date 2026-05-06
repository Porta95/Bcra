import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel BCRA — Macro & Deudores",
  description: "Dashboard de variables del Banco Central + consulta de deudores por CUIT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen relative">
        <div className="relative z-10">
          <header className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-accent text-lg leading-none">▮</span>
                <span className="font-display italic text-lg tracking-tight">
                  Panel <span className="text-accent">BCRA</span>
                </span>
              </Link>
              <nav className="flex gap-1 text-xs uppercase tracking-widest">
                <Link
                  href="/"
                  className="px-3 py-1.5 hover:text-accent transition-colors"
                >
                  Macro
                </Link>
                <Link
                  href="/deudores"
                  className="px-3 py-1.5 hover:text-accent transition-colors"
                >
                  Deudores
                </Link>
              </nav>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

          <footer className="border-t border-border mt-16 py-6 text-center text-xs text-muted">
            Datos: <span className="text-ink">api.bcra.gob.ar</span> · Sin
            autenticación · Cache en edge de Vercel
          </footer>
        </div>
      </body>
    </html>
  );
}
