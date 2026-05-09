import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import DeudoresClient from "./DeudoresClient";

export const metadata: Metadata = {
  title: "Consulta de CUIT — Central de Deudores BCRA",
  description:
    "Consultá gratis tu CUIT en la Central de Deudores del BCRA: deudas, situación crediticia y cheques rechazados. Sin registro.",
  alternates: { canonical: "/deudores" },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿La consulta es gratuita?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Sí. Panel BCRA usa el endpoint público de la Central de Deudores del BCRA. No requiere registro ni pago.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué datos incluye el informe?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Deudas declaradas por bancos, financieras, tarjetas y SGRs en el último período informado, historial de los últimos 24 meses y cheques rechazados por sin fondos. No incluye juicios, embargos, datos de AFIP/ANSES ni score crediticio.",
      },
    },
    {
      "@type": "Question",
      name: "¿Puedo consultar el CUIT de otra persona?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Sí. La Central de Deudores del BCRA es información pública según la Ley de Entidades Financieras. Se puede consultar cualquier CUIT, CUIL o CDI de 11 dígitos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cada cuánto se actualizan los datos?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "El BCRA publica nuevos períodos mensualmente. Las respuestas se cachean 6 horas en el edge de Vercel.",
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
      name: "Deudores",
      item: "https://panel-bcra.vercel.app/deudores",
    },
  ],
};

export default function DeudoresPage() {
  return (
    <section aria-labelledby="deudores-title">
      <Script
        id="ld-deudores"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqLd, breadcrumbsLd]),
        }}
      />
      <div className="mb-8 hero-rule">
        <div className="section-eyebrow" aria-hidden="true">
          Central de Deudores · BCRA
        </div>
        <h1
          id="deudores-title"
          className="font-display text-3xl md:text-4xl tracking-tight mt-1"
        >
          Mirá qué dice el BCRA de tu{" "}
          <span className="italic text-accent">CUIT</span>
        </h1>
        <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
          Informe oficial: deudas vigentes, historial de 24 meses y cheques
          rechazados. Sirve para saber cómo te ven los bancos antes de pedir un
          préstamo o alquilar. No garantiza solvencia ni reemplaza un informe
          comercial.
        </p>
      </div>

      <Suspense fallback={null}>
        <DeudoresClient />
      </Suspense>
    </section>
  );
}
