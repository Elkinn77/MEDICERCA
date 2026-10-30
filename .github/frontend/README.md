# MediCerca — Frontend

SPA en React + Vite + Tailwind CSS que consume la API de `../backend`. Cubre
el flujo de **paciente** (registro, verificación, catálogo, disponibilidad,
órdenes médicas, domicilios, historia clínica) y el de **regente** (aprobar
órdenes, actualizar el estado logístico de los domicilios).

## Requisitos

- Node.js 18+
- El backend corriendo (ver `../backend/README.md` o `../README.md` para
  levantarlo con Docker) y con datos de demo (`python -m app.seed`).

## Desarrollo

```bash
cd frontend
npm install
npm run dev
```

Por defecto apunta a `http://localhost:8000` (el backend en Docker). Si tu
backend corre en otra URL, copia `.env.example` a `.env` y ajusta
`VITE_API_URL`.

El backend ya tiene `http://localhost:5173` en `CORS_ORIGINS` por defecto
(ver `backend/app/config.py`), así que no hace falta tocar nada ahí para
desarrollo local.

## Build de producción

```bash
npm run build
npm run preview
```

## Estructura

- `src/api/` — cliente HTTP (`client.js`) y funciones agrupadas por recurso
  (`auth`, `medicamentos`, `ips`, `disponibilidad`, `ordenes`, `domicilios`,
  `historia-clinica`), un mapeo 1:1 con las rutas de `backend/app/api/v1/routes`.
- `src/context/AuthContext.jsx` — sesión (token en `localStorage`, usuario
  actual vía `GET /api/v1/auth/me`).
- `src/components/` — layout, navegación, guards de ruta (`RutaProtegida`,
  `RutaRegente`) y kit de UI reutilizable (`ui.jsx`).
- `src/pages/` — una página por pantalla; los flujos de paciente y regente
  quedan separados en rutas propias.

## Notas sobre la API

Durante esta iteración se agregaron al backend un puñado de endpoints de
**lectura** que no existían y que el frontend necesitaba para funcionar
(antes de esto no había forma de listar las órdenes o domicilios propios, ni
de saber el rol del usuario autenticado tras iniciar sesión):

- `GET /api/v1/auth/me`
- `GET /api/v1/ordenes/mias`, `GET /api/v1/ordenes/pendientes` (regente),
  `GET /api/v1/ordenes/{ips_id}/{orden_id}`
- `GET /api/v1/domicilios/mias`, `GET /api/v1/domicilios/activos` (regente)

Todos siguen el mismo control de acceso que sus endpoints hermanos ya
existentes y tienen pruebas en `backend/tests/`.

Dos cosas quedan **fuera de alcance** de este frontend por no existir aún en
la API (no se resolvieron para no ensanchar el cambio): no hay endpoint
público para listar puntos de venta (`PuntoVenta`) fuera del buscador de
disponibilidad, ni para listar EPS.
