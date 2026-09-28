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

Segundo comentario (PC, 28-09-2026):

6. El panel de controles ocupa demasiado: más compacto.
7. Fuera A/W/S/D del panel (y como atajo de apuntado, si se confirma): en PC se apunta con el ratón.
8. Q/E, rotulado como cámara. Hoy cambian el castillo objetivo, que mueve la cámara hacia él; el rótulo debe decir eso y nada más.

Decisiones del usuario (28-09-2026) sobre las flechas:

9. **Jugando no se elige castillo objetivo.** Hoy ◀ ▶ (y Q/E) giran la catapulta de golpe hacia otro castillo rival, que queda como «objetivo». Ese objetivo se usa para los arcos de «quién ataca a quién» (WRK-TASK-045) y el encuadre. Desaparece el selector: el objetivo se deduce solo del rumbo, como el castillo rival más cercano a la dirección en que apuntas. En PC, Q/E se quedan como atajo de cámara (punto 8).
10. **Espectador:** a la derecha, en pequeño, una miniatura por castillo con el nombre del jugador encima y el % de destrucción de su castillo; tocarla lleva la cámara a ese castillo. Sustituye a ◀ ▶ del espectador (WRK-TASK-042). Se enseña antes en el lienzo.

Propuesta en el lienzo: «Propuesta · Barra de munición sin textos (móvil)», interactiva. Falta la versión de PC y la aprobación del usuario.

## Acceptance Criteria

- [ ] El usuario aprueba la propuesta en el lienzo (móvil y PC).
- [ ] HUD sin la línea de potencia y elevación, sin flechas junto a la munición, con cartas por rareza y la elegida destacada, en 1280×720 y 390×844; horizontal sin solapes.
- [ ] El objetivo se deduce del rumbo (unitaria); sin selector de objetivo en la interfaz.
- [ ] Espectador: selector de castillos a la derecha con nombre y % de destrucción, en PC y móvil.
- [ ] Panel de controles de PC compacto, sin A/W/S/D y con Q/E como cámara.
- [ ] E2E de HUD en verde (`hud-compact.spec.ts` y las que usan los selectores).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | HUD compacto, selección de munición, capturas |

## Evidence

Pendiente.
