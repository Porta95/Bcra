"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[Panel BCRA] global error:", error);
    }
  }, [error]);

  return (
    <html lang="es-AR">
      <body
        style={{
          background: "#0a0a0a",
          color: "#ededed",
          fontFamily: "ui-monospace, monospace",
          padding: 24,
          margin: 0,
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 720, margin: "60px auto" }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#8a8a8a",
              borderLeft: "2px solid #ef4444",
              paddingLeft: 12,
            }}
          >
            Error global · Panel BCRA
          </div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 36,
              color: "#ef4444",
              borderLeft: "2px solid #ef4444",
              paddingLeft: 12,
              margin: "8px 0 24px",
            }}
          >
            Algo se rompió antes de que pudiéramos cargar la página
          </h1>
          <div
            style={{
              border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.05)",
              padding: 16,
              fontSize: 12,
            }}
          >
            <div>
              <span style={{ color: "#8a8a8a" }}>Mensaje: </span>
              <span style={{ color: "#ef4444", wordBreak: "break-word" }}>
                {error.message || "Sin mensaje."}
              </span>
            </div>
            {error.digest && (
              <div style={{ marginTop: 8 }}>
                <span style={{ color: "#8a8a8a" }}>Digest: </span>
                <span style={{ color: "#ededed" }}>{error.digest}</span>
              </div>
            )}
            {error.stack && (
              <pre
                style={{
                  marginTop: 12,
                  fontSize: 10,
                  color: "#8a8a8a",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  lineHeight: 1.5,
                }}
              >
                {error.stack}
              </pre>
            )}
          </div>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#f5c518",
              color: "#0a0a0a",
              padding: "12px 24px",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              border: "none",
              cursor: "pointer",
              marginTop: 20,
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
