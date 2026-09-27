---
id: WRK-TASK-048
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [FEAT-INTERFAZ-001, PROD-JUGAR-001]
tags: [interfaz, movil]
---

# WRK-TASK-048 — Tutorial adaptado al vertical

## Objective

Revisar el tutorial de la primera partida para que en móvil vertical señale los controles reales (arrastrar, botón 🔥, flechas, tarjetas) sin tapar la escena.

## File Scope

- `client/src/ui/tutorial.ts` y `style.css`
- `tests/e2e/` (tutorial en vertical): `tests/e2e/tutorial.spec.ts`
- `.github/workflows/` (la prueba nueva entra en el grupo `basicas`)

## Implementation Notes

Revisar con capturas en 390×844 y 1280×720 cada paso («Apunta», «Elige munición», «¡Fuego!»). En móvil, cada paso puede señalar el elemento que toca: la escena, las tarjetas o el botón 🔥.

## Acceptance Criteria

- [x] Los 3 pasos se leen y señalan el control correcto en móvil vertical y en PC.
- [x] El tutorial no tapa el botón de disparo ni las tarjetas.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Tutorial con `?tutorial=1` en los dos formatos |

## Evidence

2026-09-27.

- Capturas antes del cambio (390×844, 360×780, 740×360 y 1280×720). En vertical, el recuadro, anclado a 190 px del borde inferior, tapaba el botón 🔥 y el castillo. En PC pisaba la línea de potencia y elevación. En horizontal, el paso 3 se metía bajo el panel de la ronda.
- Después: arriba, sobre el cielo, en los 4 tamaños y sin cruzarse con ningún control. Cada paso resalta lo suyo: una mano o un ratón que arrastra en el 1; las tarjetas y las flechas en el 2; el botón de disparo en el 3. El resaltado es idempotente: se repone en cada fotograma sin tocar clases que no cambian.
- `tests/e2e/tutorial.spec.ts` (1280×720, 390×844 y 360×780) recorre los 3 pasos (el 2 tocando una tarjeta) y comprueba el paso en curso, el resaltado y que no hay solapes. 3 de 3. Entra en el grupo `basicas` de CI.
- `npm run verify` en verde.

