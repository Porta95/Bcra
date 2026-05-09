"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Surface details in console for debugging
      // eslint-disable-next-line no-console
      console.error("[Panel BCRA] error boundary:", error);
    }
  }, [error]);

  return (
    <div className="border-l-2 border-danger pl-4">
      <div className="section-eyebrow">Error · Panel BCRA</div>
      <h1 className="font-display italic text-3xl md:text-4xl tracking-tight mt-1 text-danger">
        Algo se rompió en esta página
      </h1>
      <p className="text-xs text-muted mt-3 max-w-2xl leading-relaxed">
        Capturamos el error para que puedas reportarlo. Probá recargar; si
        sigue, mandanos el detalle de abajo.
      </p>

      <div className="mt-6 border border-danger/40 bg-danger/5 p-4 text-xs space-y-2">
        <div>
          <span className="text-muted">Mensaje: </span>
          <span className="text-danger break-words">
            {error.message || "Sin mensaje."}
          </span>
        </div>
        {error.digest && (
          <div>
            <span className="text-muted">Digest: </span>
            <span className="text-ink tabular">{error.digest}</span>
          </div>
        )}
        {error.stack && (
          <details className="mt-2">
            <summary className="cursor-pointer text-muted hover:text-ink">
              Stack trace
            </summary>
            <pre className="mt-2 text-[10px] text-muted whitespace-pre-wrap break-all leading-relaxed">
              {error.stack}
            </pre>
          </details>
        )}
      </div>

      <button
        type="button"
        onClick={() => reset()}
        className="btn-primary mt-6"
      >
        Reintentar
      </button>
    </div>
  );
}
