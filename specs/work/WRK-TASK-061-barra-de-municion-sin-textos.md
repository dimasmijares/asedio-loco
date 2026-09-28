---
id: WRK-TASK-061
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001, FEAT-CONTROL-001]
dependencies:
  - id: WRK-TASK-060
    relation: depends-on
tags: [interfaz, diseno]
---

# WRK-TASK-061 — Barra de munición sin textos y con la rareza a la vista

## Objective

Sale del primer comentario del usuario en el lienzo (WRK-TASK-060, 28-09-2026): menos texto y más calidad visual en la zona de apuntado.

## File Scope

- `client/src/ui/hud.ts`, `client/src/ui/style.css`, `client/src/game/match/ui.ts`
- `tests/e2e/` (selectores y capturas en PC y móvil vertical)
- `specs/feature/FEAT-INTERFAZ-001-hud-portada-tutorial-ajustes.md`

## Implementation Notes

Comentario del usuario, punto por punto:

1. Fuera el texto «Potencia … (m/s) · Elevación … · munición»: no aporta; la parábola ya lo dice.
2. La tarjeta con la descripción de la munición, más cuidada y bonita.
3. Fuera las flechas ◀ ▶ junto a la munición: la munición se elige tocándola. (Si las flechas sirven también para cambiar de castillo objetivo o de castillo en el espectador, ese uso necesita otro sitio: decidir con el usuario.)
4. La munición elegida, mucho más destacada.
5. Botones de munición más grandes y con el color de su rareza muy visible, para notar cuál es mejor.

Propuesta en el lienzo: «Propuesta · Barra de munición sin textos (móvil)», interactiva. Falta la versión de PC y la aprobación del usuario.

## Acceptance Criteria

- [ ] El usuario aprueba la propuesta en el lienzo (móvil y PC).
- [ ] HUD sin la línea de potencia y elevación, sin flechas junto a la munición, con cartas por rareza y la elegida destacada, en 1280×720 y 390×844; horizontal sin solapes.
- [ ] E2E de HUD en verde (`hud-compact.spec.ts` y las que usan los selectores).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | HUD compacto, selección de munición, capturas |

## Evidence

Pendiente.
