---
id: WRK-TASK-063
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-CAMARA-001, ADR-006]
tags: [camara, impacto]
---

# WRK-TASK-063 — Cámara de impacto centrada en tu disparo

## Objective

Comentario del usuario en el lienzo (28-09-2026, «Móvil · Impacto»): durante el impacto, la cámara prioriza tu propio disparo con una panorámica centrada entre tu castillo y el que apuntas. Hoy, con los cambios de cámara, a veces no se ve dónde ha caído tu disparo.

## File Scope

- `client/src/game/director.ts`, `client/src/game/camera.ts`
- `tests/e2e/` (capturas del impacto en PC y móvil vertical)
- `specs/feature/FEAT-CAMARA-001-camara-y-director.md`

## Implementation Notes

- Encuadre por defecto del impacto: el segmento entre tu catapulta y tu castillo objetivo, con margen para la parábola; se sigue tu proyectil hasta que toca algo y se mantiene el plano sobre el punto de impacto hasta que se asienta.
- Los cortes a otros disparos (rivales, reyes que caen) solo después de ver tu impacto, o nunca si coinciden en el tiempo; la repetición ya cubre lo que te pierdas.
- Espectador y bots: sin cambios (no tienen disparo propio).
- Respetar ADR-006 (sin cámara lenta en directo).

## Acceptance Criteria

- [x] En el impacto, tu proyectil y su punto de impacto están en pantalla desde que sale hasta que se asienta, en 1280×720 y 390×844 (E2E que lo comprueba proyectando la posición a pantalla).
- [x] Encuadre inicial centrado entre tu castillo y el objetivo.
- Aprobación de las capturas por el usuario: punto R-08 del lienzo (DOC-OPS-003).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Proyectil propio dentro del encuadre durante el impacto |

## Evidence

2026-09-28.
- `Director.startCountdown` recibe tu disparo (`mine`: tu hueco, tu castillo y el objetivo). Con él, el plano va de tu castillo al objetivo mirando a lo largo de esa línea; en vertical, radio ×0,7 y cámara más baja. En `update`, mientras tu proyectil vuela o su impacto está fresco, solo cuentan lo tuyo; 0,4 s después vuelve al encuadre de todos.
- Comprobación en el navegador (Chromium sin GPU, partida contra 3 bots, `seed=21`): la posición de tu proyectil proyectada a pantalla cada 150 ms durante el impacto. PC 1280×720: 65 muestras, 0 fuera de pantalla. Móvil 390×844: 72 muestras, 0 fuera.
- Capturas en PC y móvil en el lienzo (R-08).
- E2E locales `controls`, `smoke` y `solo`: 5/5 en verde con 054-057.
