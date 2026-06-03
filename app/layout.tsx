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

const NAV = [
  { href: "/",            label: "Inicio"    },
  { href: "/comparador",  label: "Tasas"     },
  { href: "/macro",       label: "Macro"     },
  { href: "/deudores",    label: "Deudores"  },
  { href: "/cheques",     label: "Cheques"   },
  { href: "/contexto",    label: "Contexto"  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body className="min-h-screen relative">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.dataset.theme='light';}catch(e){}",
          }}
        />

        <div className="relative z-10">
          {/* ── Header ───────────────────────────────────────────────────── */}
          <header className="sticky top-0 z-20 border-b border-border/60 bg-bg/75 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-4 h-14">

                {/* Logo */}
                <Link
                  href="/"
                  aria-label="Panel BCRA — Inicio"
                  className="flex items-center gap-2 shrink-0 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <rect x="1" y="7" width="3" height="6" rx="1" fill="rgb(var(--accent))"/>
                      <rect x="5.5" y="4" width="3" height="9" rx="1" fill="rgb(var(--accent))"/>
                      <rect x="10" y="1" width="3" height="12" rx="1" fill="rgb(var(--accent))"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-sm tracking-tight text-ink">
                    Panel <span className="text-accent">BCRA</span>
                  </span>
                </Link>

                {/* Search — desktop */}
                <div className="flex-1 min-w-0 hidden md:block max-w-xs">
                  <GlobalSearch />
                </div>

                {/* Nav */}
                <nav
                  aria-label="Principal"
                  className="flex items-center gap-0.5 text-sm overflow-x-auto ml-auto"
                >
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-1.5 rounded-md text-muted hover:text-ink hover:bg-panel2 transition-all text-sm whitespace-nowrap font-medium"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <ThemeToggle />
              </div>

              {/* Search — mobile */}
              <div className="md:hidden pb-3">
                <GlobalSearch />
              </div>
            </div>
          </header>

          {/* ── Main ─────────────────────────────────────────────────────── */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <footer className="border-t border-border/60 mt-20 py-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <rect x="1" y="7" width="3" height="6" rx="1" fill="rgb(var(--accent))"/>
                      <rect x="5.5" y="4" width="3" height="9" rx="1" fill="rgb(var(--accent))"/>
                      <rect x="10" y="1" width="3" height="12" rx="1" fill="rgb(var(--accent))"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-ink">Panel BCRA</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-xs text-muted">
                  <span>
                    Datos de{" "}
                    <span className="text-ink font-medium">api.bcra.gob.ar</span>
                    {" "}· Sin login · Sin tracking
                  </span>
                  <span>No es asesoría financiera</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
