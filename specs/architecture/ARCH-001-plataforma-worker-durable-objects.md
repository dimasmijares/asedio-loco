---
id: ARCH-001
type: spec
layer: architecture
status: active
confidence: medium
version: 1.0.1
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: RULE-003
    relation: constrained-by
  - id: PROD-JUGAR-001
    relation: implements
supersedes: null
tags:
  - plataforma
  - cloudflare
  - despliegue
---

# ARCH-001 — Plataforma: un Worker con Durable Objects

## Intent

El juego necesita un sitio público y gratuito donde servir la página y coordinar las salas multijugador. Esta especificación fija dónde vive todo, qué rutas atiende y cómo llega cada cambio a producción.

## Definition

### Context

- Plan gratuito, sin servidores que se apaguen por inactividad y con WebSocket nativo.
- Varios jugadores de una sala deben hablar con el mismo proceso, que guarda el lobby.
- La física es cara y la ejecuta un navegador (el anfitrión, ver ARCH-003). El servidor solo retransmite.
- Cada etapa del trabajo se prueba contra producción, no solo en local.

### Decision

- **Un único Worker de Cloudflare** (`server/index.ts`, nombre `asedio-loco` en `wrangler.jsonc`) sirve a la vez:
  - Los estáticos del cliente (`dist/client`, binding `ASSETS`, modo SPA). Mismo origen que los WebSockets: sin CORS.
  - `GET /api/health` → `{ ok: true, v: PROTOCOL_VERSION }`.
  - `POST /api/rooms` → reserva un código libre de 4 letras (hasta 8 intentos; si no, 503).
  - `GET /api/rooms/:code` → `{ exists, players, inGame }`.
  - `GET /ws/:code` (código `^[A-Z]{4}$`) → WebSocket con la sala. Rechaza orígenes ajenos (403), salvo `localhost`, `127.0.0.1` o sin cabecera `Origin`.
  - Cualquier otra `/api/*` → 404. `run_worker_first` solo para `/api/*` y `/ws/*`.
- **Una Durable Object `Room` por sala** (`idFromName(code)`, clase SQLite, migración `v1`). Usa WebSocket con hibernación (`acceptWebSocket`) y guarda el estado del lobby en `storage` (clave `s`).
- **Ciclo de vida de la sala:** una sala vacía se borra con una alarma a los 60 s. En el lobby, el anfitrión que se cae tiene 8 s de gracia para recargar antes de perder el papel.
- **Despliegue continuo** (`.github/workflows/deploy.yml`): cada push a `main` ejecuta `npm ci`, `npm run kdd:check`, `typecheck`, `npm test`, `build` y `npx wrangler deploy`. Después, las E2E contra producción en 7 trabajos paralelos: `basicas`, `fisica`, `solitario`, `cuatro-jugadores`, `migracion`, `revancha` y `red-mala`. Cada uno sube sus capturas como `capturas-e2e-<grupo>`.
- Secretos: `CLOUDFLARE_API_TOKEN` (solo Workers Scripts:Edit) como secret y `CLOUDFLARE_ACCOUNT_ID` como variable.

### Rationale

- Se compararon PartyKit, Deno Deploy, Render, Fly.io y P2P (D-003). Fly.io ya no es gratis y Render apaga el servicio. Las Durable Objects dan un proceso único por sala sin gestionar servidores.
- Servir el cliente desde el mismo Worker (D-004) evita CORS y los estáticos son gratis.
- `wrangler deploy` directo en vez de `wrangler-action` (D-006): la misma versión en local y en CI.
- E2E en paralelo (D-050): la batería tarda lo que la prueba más lenta.

### Consequences

- El servidor no valida la partida: confía en el anfitrión (ARCH-003). Hacer trampas desde el anfitrión es posible.
- Todo depende de Cloudflare. Cambiar de plataforma exige reescribir `server/index.ts`.
- Un cambio roto llega a producción antes de las E2E: las E2E se ejecutan **después** del despliegue.
- Cambiar la clase `Room` de forma incompatible exige una nueva migración en `wrangler.jsonc`.

## Acceptance Criteria

- [ ] `GET /api/health` responde `{ ok: true, v }` con la versión del protocolo.
- [x] `POST /api/rooms` devuelve un código de 4 letras y la sala se puede unir por enlace.
- [x] Un push a `main` con CI en verde despliega y ejecuta los 7 grupos de E2E contra producción.
- [ ] Una conexión WebSocket desde un origen ajeno recibe 403 (sin prueba automática).
- [ ] Una sala sin conexiones desaparece a los 60 s (sin prueba automática).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/lobby.spec.ts`, `tests/e2e/smoke.spec.ts` contra producción en CI | 2026-09-26 | low → medium |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `server/index.ts` | Worker, rutas y Durable Object `Room` |
| Implemented in | `wrangler.jsonc` | Estáticos, binding `ROOMS`, migración `v1` |
| Implemented in | `.github/workflows/deploy.yml` | Despliegue continuo y matriz de E2E |
| Tested by | `tests/e2e/lobby.spec.ts` | Crear sala, unirse por enlace, lista de conectados |
| Implemented in | `playwright.config.ts` | En local espera a `/api/health` de `wrangler dev`. No es una prueba: ninguna comprueba la respuesta `{ ok, v }` |
| Decided in | D-003, D-004, D-005, D-006, D-050 | Plataforma, estáticos, sin plugins, deploy directo, E2E en paralelo |

## Open Questions

- ¿Hace falta un límite de salas creadas por IP en `POST /api/rooms`? Hoy no lo hay. — dimas
