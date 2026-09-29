# Front — Catálogo de eventos (TicketU)

Banco de pruebas en Next.js 14 para el módulo Catálogo.

## Ejecutar
1. Backend encendido en el puerto 4000 (ver README de la raíz).
2. Crear `.env.local` con: `NEXT_PUBLIC_GATEWAY_URL=http://localhost:4000`
3. `npm install` y luego `npm run dev` → http://localhost:3000/catalogo

## Qué se migra al repositorio común
Solo `src/app/catalogo/` y `src/modules/catalogo/`.
Todo lo demás (layout, header, footer, `lib/env.ts` y las simulaciones de
entradas, promociones y reseñas) es andamiaje local.

## Datos de prueba
En `src/modules/catalogo/api.ts`, `USAR_DATOS_PRUEBA = true` permite trabajar sin backend.