# Panel BCRA

Dashboard del Banco Central de la República Argentina + consulta de deudores
por CUIT. Todo gratis en Vercel, sin backend separado.

**Stack:** Next.js 14 (App Router) · Tailwind · Recharts · APIs públicas del BCRA

## Qué hace

- **Macro** (`/`): listado y búsqueda de las ~50 variables principales que
  publica el BCRA (reservas, tipos de cambio, base monetaria, tasas, inflación).
  Click en una variable abre el gráfico histórico con rangos 30D/90D/1A/5A/MAX.
- **Deudores** (`/deudores`): consulta por CUIT/CUIL/CDI con
  - deudas actuales en el sistema financiero,
  - histórico de los últimos 24 meses,
  - cheques rechazados con causal y monto.

## APIs upstream (sin auth)

- `https://api.bcra.gob.ar/estadisticas/v3.0/Monetarias`
- `https://api.bcra.gob.ar/estadisticas/v3.0/Monetarias/{id}`
- `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/{cuit}`
- `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/Historicas/{cuit}`
- `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/{cuit}`

Cache: usamos `next: { revalidate }` para que Vercel cachee las respuestas en
su edge — gratis, sin Redis, sin servidor.

## Deploy desde el celular (recomendado)

1. Crear repo nuevo en GitHub: **Porta95/panel-bcra**.
2. Subir esta carpeta (desde el celular podés usar la app de GitHub o
   Working Copy, o desde la PC `git push` y listo).
3. Entrar a [vercel.com/new](https://vercel.com/new) desde el celular.
4. *Import* el repo `panel-bcra`. Vercel detecta Next.js automáticamente —
   no toques nada, dale **Deploy**.
5. En ~2 minutos tenés `panel-bcra-xxx.vercel.app` funcionando.
6. (Opcional) Settings → Domains → agregar dominio propio.

No hay variables de entorno que configurar. Todo va contra APIs públicas.

## Local

```bash
npm install
npm run dev
# http://localhost:3000
```

## Limitaciones honestas

Esto **no es Nosis**. Nosis cruza datos privados (Veraz, juicios, AFIP,
ANSES, scoring propietario). Acá usamos solo lo que el BCRA publica:

- ✅ Deudas declaradas por bancos / financieras / tarjetas / SGRs
- ✅ Cheques rechazados informados al BCRA
- ❌ Score crediticio
- ❌ Juicios, embargos, quiebras
- ❌ Datos AFIP / ANSES
- ❌ Domicilios, teléfonos, vínculos societarios

Para un Argentino promedio sin antecedentes muchos endpoints van a devolver
404 — eso es **buena señal**, no error. La UI lo refleja como "Sin
antecedentes informados".

## Estructura

```
app/
├── page.tsx                Dashboard macro (server component)
├── variable/[id]/page.tsx  Gráfico histórico
├── deudores/page.tsx       Form + reporte CUIT
├── api/
│   ├── macro/route.ts
│   ├── serie/[id]/route.ts
│   └── deudores/[cuit]/route.ts
└── globals.css
components/
├── VariableCard.tsx
├── VariablesGrid.tsx
└── SerieChart.tsx
lib/
└── bcra.ts                 Cliente + tipos + helpers
```
