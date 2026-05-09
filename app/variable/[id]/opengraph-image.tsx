import { ImageResponse } from "next/og";
import { getVariables } from "@/lib/bcra";

export const runtime = "edge";
export const alt = "Variable del BCRA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const vars = await getVariables().catch(() => []);
  const v = vars.find((x) => x.idVariable === id);

  const titulo = v?.descripcion ?? `Variable #${params.id}`;
  const valor = v ? new Intl.NumberFormat("es-AR").format(v.ultValorInformado) : "—";
  const unidad = v?.unidadExpresion ?? "";
  const fecha = v?.ultFechaInformada ?? "";
  const categoria = v?.categoria ?? "Variable BCRA";

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
          padding: "72px",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "18px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#8a8a8a",
          }}
        >
          <div style={{ width: "10px", height: "28px", background: "#f5c518" }} />
          <span>{categoria}</span>
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
              fontSize: "36px",
              lineHeight: 1.2,
              color: "#ededed",
              fontFamily: "serif",
              fontStyle: "italic",
              maxWidth: "1000px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {titulo}
          </div>
          <div
            style={{
              fontSize: "120px",
              lineHeight: 1,
              fontWeight: 700,
              color: "#f5c518",
              marginTop: "24px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {valor}
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#8a8a8a",
              marginTop: "12px",
            }}
          >
            {unidad}
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
          <span>Panel BCRA</span>
          <span>{fecha}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
