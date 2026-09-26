---
id: ADR-001
type: adr
layer: governance
status: accepted
confidence: high
version: 1.0.0
created: 2026-09-24
updated: 2026-09-26
owner: dimas
deciders:
  - dimas
dependencies:
  - id: ARCH-001
    relation: implements
  - id: FEAT-SALAS-001
    relation: implements
supersedes: null
tags:
  - plataforma
  - servidor
  - despliegue
---

# ADR-001 — Salas en Cloudflare Workers con una Durable Object por sala, y el cliente servido por el mismo Worker

## Context

El juego tiene que ser gratis, sin tarjeta y sin cuentas. Hace falta un servidor de salas ligero que retransmita mensajes y guarde el lobby. En septiembre de 2026 se compararon PartyKit, Deno Deploy, Render, Fly.io y P2P. Fly.io ya no tiene plan gratis, Render se duerme tras 15 minutos y tarda un minuto en arrancar, Deno Deploy no tiene objeto con estado por sala y PartyKit es una capa sobre Durable Objects.

## Decision

- Cada sala es una Durable Object respaldada por SQLite (la única opción del plan gratis), con la API de hibernación de WebSockets.
- El Worker sirve también el cliente como estáticos (`assets`). `run_worker_first` solo cubre `/api/*` y `/ws/*`.
- Se despliega con `wrangler deploy` directo desde CI, con la misma versión de Wrangler que en local y un token con solo `Workers Scripts:Edit`.

## Consequences

**Positive:**

- No se duerme ni cuesta dinero. Mismo origen para página y WebSockets: sin CORS.
- Estáticos gratis e ilimitados. Una URL estable: `asedio-loco.dimasmijares.workers.dev`.

**Negative:**

- Límites del plan gratuito: cada mensaje entrante cuenta 1/20 de petición. Por eso el anfitrión agrupa en un tic de 15 Hz (ADR-002) y el servidor limita la frecuencia.
- El servidor no puede simular física: la simulación vive en un navegador (ADR-002).
- Dependencia de un proveedor; migrar implicaría rehacer `server/index.ts`.

**Neutral:**

- `npm run e2e` levanta `wrangler dev` en el puerto 8787 para probar en local.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Fly.io | Sin plan gratuito |
| Render | Se apaga tras 15 min sin tráfico; ~1 min para arrancar |
| Deno Deploy | Sin objeto con estado por sala |
| PartyKit | Es una capa sobre Durable Objects; no aporta nada necesario |
| P2P (WebRTC) | Necesita señalización igualmente y es frágil tras NAT |
| `cloudflare/wrangler-action` | Otra versión de Wrangler distinta de la local |

## Knowledge Impact

- [ ] ARCH-001 — describe la plataforma y los límites del plan gratuito.
- [ ] FEAT-SALAS-001 — las salas viven en una Durable Object; una sala vacía se destruye.

## Traceability

- Decisiones: D-003, D-004, D-005, D-006.
- Código: `server/index.ts`, `wrangler.jsonc`, `.github/workflows/deploy.yml`.
