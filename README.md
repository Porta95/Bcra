# Panel BCRA

Panel con datos públicos del BCRA: comparador de productos financieros,
central de deudores, cheques denunciados y variables macro. Sin backend
separado, sin DB, sin variables de entorno.

**Stack:** Next.js 14 (App Router) · Tailwind · Recharts · APIs públicas del BCRA

## Secciones

| Ruta | Qué hace | API que usa |
|---|---|---|
| `/` | Comparador: plazos fijos, préstamos personales/hipotecarios/prendarios, tarjetas, cajas y paquetes. Tabla ordenable por TEA, comisiones, monto, etc. | Régimen de Transparencia v1.0 |
| `/deudores` | Consulta por CUIT/CUIL/CDI: deudas en sistema financiero, histórico 24m, cheques rechazados. | Central de Deudores v1.0 |
| `/cheques` | Verificación de cheques denunciados (extraviados/sustraídos/adulterados) por entidad + número. | Cheques Denunciados v1.0 |
| `/macro` | ~1100 variables monetarias del BCRA. Click en una abre gráfico histórico (30D/90D/1A/5A/MAX). | Estadísticas Monetarias v4.0 |

## Endpoints upstream (sin auth)

- `GET /estadisticas/v4.0/monetarias`
- `GET /estadisticas/v4.0/monetarias/{id}`
- `GET /centraldedeudores/v1.0/Deudas/{cuit}`
- `GET /centraldedeudores/v1.0/Deudas/Historicas/{cuit}`
- `GET /centraldedeudores/v1.0/Deudas/ChequesRechazados/{cuit}`
- `GET /cheques/v1.0/entidades`
- `GET /cheques/v1.0/denunciados/{entidad}/{numero}`
- `GET /transparencia/v1.0/PlazosFijos`
- `GET /transparencia/v1.0/Prestamos/{Personales|Hipotecarios|Prendarios}`
- `GET /transparencia/v1.0/TarjetasCredito`
- `GET /transparencia/v1.0/CajasAhorros`
- `GET /transparencia/v1.0/PaquetesProductos`

Cache: `next: { revalidate }` cachea en el edge de Vercel — 30min para variables,
6h para deudores y transparencia, 1 día para entidades. Gratis, sin Redis.

## Local

```bash
npm install
npm run dev
```

## Deploy

Push a GitHub → vercel.com/new → Import → Deploy. Sin variables de entorno.

## Limitaciones honestas

No es Nosis. Acá usamos solo datos que el BCRA publica:
- ✅ Deudas declaradas por bancos / financieras / tarjetas / SGRs
- ✅ Cheques rechazados por sin fondos (por CUIT)
- ✅ Cheques denunciados por extravío/robo/adulteración (por número)
- ✅ Comparador de tasas y comisiones de productos financieros
- ❌ Score crediticio
- ❌ Juicios, embargos, quiebras
- ❌ Datos AFIP / ANSES
