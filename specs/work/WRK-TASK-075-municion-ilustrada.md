---
id: WRK-TASK-075
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-02
updated: 2026-10-02
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-074
    relation: depends-on
tags: [interfaz, diseno, municion]
---

# WRK-TASK-075 — Munición ilustrada (R-10 fase 1, E4)

## Objective

Sustituir los emoji de la munición, que cambian según el sistema, por ilustraciones SVG propias con contorno noche, iguales en todos los dispositivos.

## File Scope

- `client/src/ui/ammoArt.ts` (nuevo), `client/src/ui/hud.ts`, `client/src/ui/style.css`
- `shared/ammo.ts` (fuera el campo `icon`)

Fuera: los demás emoji de la interfaz (sonido, ajustes, viento, marcador, «Cómo se juega»), que cambian en las fases 2 y 3 (decisión del usuario, 02-10-2026).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Cartas de munición y tarjeta de la elegida (`#hud-ammo`, `#hud-ammo-desc`) |

- Retícula de 48×48, contorno noche de 2,5 px con uniones redondas, relleno plano, un brillo hueso y los detalles en noche.
- Sandía, vaca, pedrusco y agujero negro copian las del componente CartaMunicion del design system. Las otras ocho (tronco, cocos, gallina, piano, imán, bola de nieve, andamio y burbuja) siguen ese estilo; las cuatro retiradas del reparto (gallina, piano, andamio y burbuja) siguen en el campo de pruebas.
- La ilustración mide 1,2 em del contenedor: hereda los tamaños de letra que ya tenían los emoji en PC, vertical y horizontal, así que la disposición no cambia.

## Acceptance Criteria

- [x] Ningún emoji en las cartas ni en la tarjeta de la munición; las 12 municiones tienen ilustración.
- [x] Mismo tamaño de carta en 1280×720, 390×844 y horizontal; las E2E del HUD siguen en verde.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `smoke`, `hud-compact`, `touch`, `controls` |
| Capturas | Campo de pruebas con las 12 cartas; `tests/tools/ui-shots.mjs` |

## Evidence

2026-10-02.
- Captura del campo de pruebas (1100×680) con las 12 cartas: todas legibles sobre el fondo de la carta y en la tarjeta de descripción.
- E2E locales `smoke`, `hud-compact` (6 tamaños), `touch` y `controls` en verde.
