---
id: WRK-SPEC-001
type: spec
layer: work-spec
scope: ephemeral
status: archived
confidence: high
version: 1.0.0
created: 2026-09-24
updated: 2026-09-26
owner: dimas
activates:
  - ARCH-001
  - ARCH-002
  - ARCH-003
  - ARCH-004
  - ARCH-005
  - DOM-JUEGO-001
  - DOM-JUEGO-003
  - PROD-JUGAR-001
  - DOC-OPS-001
tags:
  - historico
  - fases-0-6
---

# WRK-SPEC-001 — Desarrollo inicial (fases 0-6)

## Problem Statement

No existía el juego. El usuario quería un «Angry Birds» 3D de castillos y catapultas para 4 jugadores en el navegador, gratis, sin cuentas ni instalaciones, que pudiera pasar a 3 amigos con un enlace. La especificación de partida es `PROMPT_asedio_loco.md`.

## Proposed Change

Construir y publicar el juego completo en 7 fases: preparación interactiva (fase 0) y desarrollo autónomo (fases 1-6).

**In scope:**

- Servidor de salas y cliente estático en Cloudflare (plan gratuito), con despliegue continuo.
- Física con Rapier: materiales, rotura por fuerza de contacto, fractura en trozos, uniones rompibles, CCD, explosiones.
- Partida contra bots: 4 castillos, reyes, rondas simultáneas, lava, viento, munición loca.
- Multijugador con anfitrión autoritativo, interpolación, espectadores, reconexión, migración y revancha.
- Contenido y sensación: 12 municiones, sonido procedural, estadísticas divertidas.
- Rendimiento, robustez y pulido (portada, tutorial, ajustes, accesibilidad).
- Batería de pruebas de la sección 5 contra producción.

**Out of scope:**

- Móviles y pantallas táctiles: el objetivo era portátil con ratón y teclado.
- Cuentas, clasificaciones o cualquier servicio de pago.

## Knowledge Context

| Spec | Why it applies |
|------|----------------|
| ARCH-001 | Worker + Durable Object por sala y despliegue continuo (fase 0) |
| ARCH-002 | Capas `shared/` y `client/`, y la vista alimentada por `SimEvent` |
| ARCH-003 | Anfitrión autoritativo, tic de 15 Hz, `full` y migración (fase 3) |
| ARCH-004 | Materiales, rotura, fractura, uniones y CCD (fase 1) |
| ARCH-005 | Objetivo de 60 fps, instancing, calidad adaptativa (fase 5) |
| DOM-JUEGO-001 | Rondas simultáneas, eliminación y victoria (fase 2) |
| DOM-JUEGO-003 | Las 12 municiones y su reparto (fases 2 y 4) |
| PROD-JUGAR-001 | Portada, sala por enlace, partida y resultados |
| DOC-OPS-001 | Pruebas de la sección 5 en local y en producción |

## Constraints

- Todo gratuito, sin tarjeta — `PROMPT_asedio_loco.md` §2.
- 60 fps en un portátil con gráfica integrada con los 4 castillos enteros — ARCH-005.
- Solo la fase 0 es interactiva; después, decidir y apuntar en `DECISIONES.md` — `PROMPT_asedio_loco.md` §3-4.
- Prioridad: divertido > red fiable > espectacular > mucho contenido — `PROMPT_asedio_loco.md` §7.

## Acceptance Criteria

- [x] URL pública estable: https://asedio-loco.dimasmijares.workers.dev
- [x] Las 8 pruebas de la sección 5 en verde en local y contra producción.
- [x] `README.md`, `CLAUDE.md` y `DECISIONES.md` al día (sección 6).
- [x] Al menos 10 municiones con icono, color, efecto y sonido propios (hay 12).
- [x] Tests unitarios de rondas, reparto con semilla, validación de mensajes y eliminación.

## Evidence

- Commits de cierre de cada fase: `6b5c361` (fase 0, 24-09-2026), `f431d44` (fase 1, 24-09), `72c84f4` (fase 2, 25-09), `363f3fe` (fase 3, 25-09), `27da128` (fase 4, 25-09), `91ad594` (fase 5, 25-09), `62b134f` (fase 6, 25-09), `78e3a3a` (README final, 25-09).
- CI de despliegue (`.github/workflows/deploy.yml`) con E2E contra producción en cada push; tras `c01ecf1` y D-050, repartida en 7 trabajos paralelos.
- Rendimiento medido y registrado en `CLAUDE.md` (sección 5.8) con `/#bench`.
- Detalle por fase en WRK-PLAN-001.
