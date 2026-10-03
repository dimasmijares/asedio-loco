---
id: WRK-TASK-080
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-03
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001, FEAT-CAMARA-001]
dependencies:
  - id: WRK-TASK-079
    relation: depends-on
tags: [interfaz, hud, movil, resultados]
---

# WRK-TASK-080 — Después de disparar en móvil vertical (R-10 fase 2: U6, U7)

## Objective

En la partida en móvil vertical, tras disparar la bandeja se recoge en una barra fina y la escena ocupa toda la pantalla. Los resultados de la ronda van en una hoja crema abajo, sin dejar de ver las cifras de daño sobre los castillos. Fuente de verdad: el componente BandejaMovil y las maquetas «Móvil · Disparo listo» y «Móvil · Resultados de la ronda».

## File Scope

- `client/src/ui/hud.ts` (`setWait`), `client/src/game/match/ui.ts` (hoja, cuenta atrás, cifras de daño, plano de cámara), `client/src/ui/style.css`
- `tests/e2e/touch.spec.ts`, `tests/e2e/encuadre.spec.ts`, `tests/tools/ui-shots.mjs` (modo `fase2`)

Fuera: los resultados en PC (U11), que siguen en la lista flotante.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Cifras de daño sobre cada castillo (WRK-TASK-036), `#results-box` en PC |
| FEAT-CAMARA-001 | El director sigue mandando en el impacto; en los resultados del móvil vertical, plano general |

- **Barra «Disparo listo»** (`#hud-wait`, U6): ciruela, 14 px a los lados y por encima de la zona segura; la carta disparada en una casilla crema, «Disparo listo» en Lilita 19 y «Esperando a Bot y Pixel · 2 de 4 listos» (nombres cortos), con los emblemas de los listos y un hueco punteado por cada uno que falta. La bandeja se oculta y el desplazamiento de la escena vuelve a 0.
- **Hoja de resultados** (`#results-sheet`, U7): crema, `radius-lg` arriba, sube con una animación corta. «Fin de la ronda N» (sin «de 5»: no hay un número fijo de rondas; decisión del usuario del 02-10-2026). Si alguien cumple el objetivo, una franja noche con la diana en `listo` y el premio de la ronda siguiente. Tabla jugador / pierde / derriba con todos los que jugaban la ronda, de más a menos pérdidas: emblema, nombre (con «(tú)») y barra de castillo en pie; las pérdidas en grana y «0» en vino; tu fila sobre hueso con borde noche. Debajo, una barra naranja que se vacía y «La ronda N+1 empieza en N s» (o «La partida termina en N s»). Sin la frase de la ronda (decisión del usuario del 02-10-2026). En PC sigue `#results-box`.
- **Cifras de daño:** se quedan entre la parte superior y la hoja.
- **Cámara:** con la hoja, en vez del plano cerrado del director, una órbita general de la isla (radio 70 m, altura 88 m, suavizado 6) con su centro en el de la franja libre entre la parte superior y la hoja (`setViewShift`): los cuatro castillos se ven con su cifra encima.
- **Viento:** en vertical, su chip solo está durante el apuntado, como en las maquetas.
- **Capturas:** `node tests/tools/ui-shots.mjs <base> <carpeta> fase2` congela el apuntado de la ronda 1, con un viento puesto a mano para que se vea su chip, y saca apuntando, manteniendo una carta, cargando, disparo listo y resultados, y apuntando en modo zurdo.

## Acceptance Criteria

- [x] Tras disparar, la bandeja se recoge en una barra de menos de 90 px con quién falta y cuántos están listos, y la escena ocupa toda la pantalla.
- [x] Resultados en una hoja crema con la tabla (tú resaltado), el objetivo cumplido si lo hay y la cuenta atrás.
- [x] Las cifras de daño quedan por encima de la hoja y dentro de la pantalla.
- [x] En PC, los resultados no cambian.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `touch.spec.ts` («tras disparar»: barra y hoja), `encuadre.spec.ts` (cifras sin tapar la hoja ni la lista) |
| Capturas | `tests/tools/ui-shots.mjs <base> <carpeta> fase2` |

## Evidence

2026-10-03. En 390×844: barra «Disparo listo» de 70 px a 40 px del borde; hoja de 394 px (458 con el objetivo cumplido), con las cuatro cifras de daño entre y = 126 y y = 348, sobre sus castillos. Suite E2E local en verde.
