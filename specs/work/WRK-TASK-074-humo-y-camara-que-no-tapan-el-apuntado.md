---
id: WRK-TASK-074
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-29
updated: 2026-09-29
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-CAMARA-001]
tags: [camara, efectos, apuntado, movil, fallo]
---

# WRK-TASK-074 — Humo y cámara que no tapan el apuntado

## Objective

Fallo importante que ha detectado el usuario (29-09-2026): tras los impactos queda humo (foco de `fx.ts`, `SMOKE_LIFE` de 10 s más la cola) que a menudo no deja ver nada al apuntar, sobre todo en móvil vertical. Hay que mejorar las dos cosas:

- **Humo:** que no tape la vista al apuntar. Opciones: durar menos, ser más translúcido, disiparse al empezar la fase de apuntado o desvanecerse cuando está entre la cámara y el objetivo.
- **Cámara de apuntado:** un poco más elevada y más alejada, para ver por encima del humo y de las murallas propias, y con la parábola y el anillo a la vista.

Es un cambio visible, así que se revisa primero en el lienzo como un punto R-NN (`DOC-OPS-003`), con capturas de antes y después en PC y en móvil vertical.

## File Scope

- `client/src/game/render/fx.ts` (humo), `client/src/game/view.ts`
- `client/src/game/camera.ts`, `client/src/game/director.ts` (plano de apuntado)
- `tests/e2e/` (humo que no tapa, encuadre del apuntado en los dos formatos)
- `specs/feature/FEAT-CAMARA-001-camara-y-director.md`

## Acceptance Criteria

- [ ] Punto R-NN con capturas de antes y después aprobado por el usuario.
- [ ] En la fase de apuntado, tras una ronda con derrumbes, el castillo objetivo y el anillo se ven sin humo delante, en PC y en móvil vertical.
- [ ] La cámara de apuntado queda más alta y más lejos, con tu catapulta, la parábola y el objetivo en el encuadre.
- [ ] El humo sigue viéndose durante el impacto (no se pierde el efecto).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Apuntado tras derrumbes: sin humo en el eje cámara-objetivo; encuadre en PC y móvil vertical |

## Evidence

Pendiente.
