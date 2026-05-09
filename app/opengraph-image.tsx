import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Panel BCRA — tasas, deudores y cheques";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
          color: "#ededed",
          padding: "80px",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "20px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#8a8a8a",
          }}
        >
          <div style={{ width: "10px", height: "32px", background: "#f5c518" }} />
          <span>Datos públicos del BCRA</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            borderLeft: "4px solid #f5c518",
            paddingLeft: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              fontSize: "96px",
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#ededed",
              fontFamily: "serif",
            }}
          >
            <span>Panel</span>
            <span style={{ color: "#f5c518", fontStyle: "italic" }}>BCRA</span>
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "#8a8a8a",
              marginTop: "16px",
              maxWidth: "900px",
              lineHeight: 1.4,
            }}
          >
            Tasas, deudores, cheques y macro de Argentina. Sin registro.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "48px",
            fontSize: "16px",
            color: "#5a5a5a",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          <span>panel-bcra.vercel.app</span>
          <span>api.bcra.gob.ar</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
