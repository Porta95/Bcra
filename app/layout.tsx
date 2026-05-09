import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import GlobalSearch from "@/components/GlobalSearch";

export const metadata: Metadata = {
  metadataBase: new URL("https://panel-bcra.vercel.app"),
  title: {
    default: "Panel BCRA — tasas, deudores y cheques",
    template: "%s",
  },
  description:
    "Compará tasas, consultá tu CUIT en la Central de Deudores y verificá si un cheque fue denunciado. Datos del BCRA, sin registro.",
  applicationName: "Panel BCRA",
  authors: [{ name: "Panel BCRA" }],
  keywords: [
    "BCRA",
    "tasa plazo fijo",
    "central de deudores",
    "consulta CUIT BCRA",
    "cheque denunciado",
    "reservas BCRA",
    "variables monetarias",
    "tasas bancos Argentina",
  ],
  category: "finance",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Panel BCRA",
    title: "Panel BCRA — tasas, deudores y cheques",
    description:
      "Datos públicos del BCRA en una sola interfaz: tasas, deudores, cheques y macro.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Panel BCRA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Panel BCRA",
    description:
      "Tasas, deudores, cheques y macro de Argentina. Datos del BCRA, sin registro.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

const NO_FLASH = `
(function(){
  try {
    var t = localStorage.getItem('theme') || 'dark';
    if (t === 'light') document.documentElement.dataset.theme = 'light';
  } catch(e){}
})();
`;

const NAV = [
  { href: "/", label: "Comparador" },
  { href: "/macro", label: "Macro" },
  { href: "/deudores", label: "Deudores" },
  { href: "/cheques", label: "Cheques" },
  { href: "/contexto", label: "Contexto" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body className="min-h-screen relative">
        <div className="relative z-10">
          <header className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
              <Link
                href="/"
                aria-label="Panel BCRA — Inicio"
                className="flex items-center gap-2 group shrink-0"
              >
                <span
                  aria-hidden="true"
                  className="inline-block w-1.5 h-3.5 bg-accent"
                />
                <span className="font-display italic text-lg tracking-tight hidden sm:inline">
                  Panel <span className="text-accent">BCRA</span>
                </span>
                <span className="font-display italic text-lg tracking-tight sm:hidden">
                  <span className="text-accent">BCRA</span>
                </span>
              </Link>

              <div className="flex-1 min-w-0 hidden md:block">
                <GlobalSearch />
              </div>

              <nav
                aria-label="Principal"
                className="relative flex gap-0 text-[10px] sm:text-xs uppercase tracking-widest overflow-x-auto"
              >
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-2 sm:px-3 py-2.5 sm:py-2 hover:text-accent transition-colors whitespace-nowrap text-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg to-transparent sm:hidden"
                />
              </nav>

              <ThemeToggle />
            </div>
            <div className="md:hidden border-t border-border bg-bg/80">
              <div className="max-w-6xl mx-auto px-4 py-2">
                <GlobalSearch />
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

          <footer className="border-t border-border mt-16 pt-8 pb-12">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <div className="section-eyebrow mb-2">Fuentes</div>
                <p className="text-muted leading-relaxed">
                  Datos públicos de{" "}
                  <span className="text-ink">api.bcra.gob.ar</span>. Sin login,
                  sin tracking. Cache en edge de Vercel.
                </p>
              </div>
              <div>
                <div className="section-eyebrow mb-2">Aviso</div>
                <p className="text-muted leading-relaxed">
                  Esto no es asesoría financiera. La información puede tener
                  desfase respecto del valor real publicado por las entidades.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
