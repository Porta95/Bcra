import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import ChequesClient from "./ChequesClient";

export const metadata: Metadata = {
  title: "Verificar cheque denunciado — BCRA",
  description:
    "Fijate si un cheque fue denunciado como extraviado, sustraído o adulterado antes de aceptarlo. Consulta gratuita a la base del BCRA.",
  alternates: { canonical: "/cheques" },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: '¿Qué significa que un cheque esté "denunciado"?',
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Que el titular o la entidad reportó al BCRA que el cheque fue extraviado, sustraído o adulterado. No es lo mismo que un cheque rechazado por sin fondos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo verifico un cheque rechazado por sin fondos?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Esa información se encuentra por CUIT del librador en la solapa Deudores, no en Cheques denunciados.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué necesito para consultar?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "El código de la entidad bancaria emisora y el número de cheque. La lista de entidades se carga automáticamente.",
      },
    },
    {
      "@type": "Question",
      name: "¿La consulta deja registro?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "No. La consulta a la API pública del BCRA es anónima y Panel BCRA no almacena datos.",
      },
    },
  ],
};

const breadcrumbsLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: "https://panel-bcra.vercel.app/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Cheques",
      item: "https://panel-bcra.vercel.app/cheques",
    },
  ],
};

export default function ChequesPage() {
  return (
    <section aria-labelledby="cheques-title">
      <Script
        id="ld-cheques"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqLd, breadcrumbsLd]),
        }}
      />
      <div className="mb-8 hero-rule">
        <div className="section-eyebrow" aria-hidden="true">
          Cheques Denunciados · BCRA
        </div>
        <h1
          id="cheques-title"
          className="font-display text-3xl md:text-4xl tracking-tight mt-1"
        >
          Antes de aceptar un cheque,{" "}
          <span className="italic text-accent">fijate</span>
        </h1>
        <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
          Verificá si un cheque figura como{" "}
          <span className="text-ink">extraviado, sustraído o adulterado</span> en
          la base del BCRA. Útil cuando alguien te paga con un cheque que no es
          suyo. Si lo que necesitás saber es si tiene fondos, usá{" "}
          <Link href="/deudores" className="text-accent hover:underline">
            Deudores
          </Link>{" "}
          con el CUIT del firmante.
        </p>
      </div>

      <ChequesClient />
    </section>
  );
}
