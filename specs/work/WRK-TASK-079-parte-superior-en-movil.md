---
id: WRK-TASK-079
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
activates: [FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-078
    relation: depends-on
tags: [interfaz, hud, movil, accesibilidad]
---

# WRK-TASK-079 — Parte superior de la partida en móvil vertical (R-10 fase 2: U4, U5)

## Objective

En la partida en móvil vertical, rehacer la parte superior según el componente Marcador y la maqueta «Móvil · Apuntando»: solo lectura salvo el engranaje, los cuatro jugadores en una fila de chips, la ronda y los segundos en una sola píldora, y el viento y el objetivo en chips. Sin emoji en lo que se toca: iconos SVG.

## File Scope

- `client/src/ui/hud.ts` (píldora, chips, viento, objetivo, engranaje; `setPlayers` y `setWind` sin rehacer el DOM en cada fotograma), `client/src/ui/icons.ts`, `client/src/ui/style.css`
- `client/src/game/match/ui.ts` (rótulo de la ronda y del escudo real con iconos)
- `tests/e2e/hud-compact.spec.ts`, `tests/e2e/tutorial.spec.ts`

Fuera: el HUD de PC (U11) salvo el cambio de emoji por iconos en las piezas compartidas, y la pantalla final.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Ids estables (`#hud-players` y sus `.hp`, `.hp-state` con «Desconectado»), emblema junto al color, nombre corto (WRK-TASK-046) |

- **Píldora** `#hud-round`: «Ronda N» en Lilita 18 y los segundos en un círculo naranja de 34 px (grana con pulso en los últimos 4 s; «–» fuera del apuntado). Sin «Fase de apuntado».
- **Engranaje** `#hud-settings`, 44 px crema, lo único que se toca arriba. El silencio sale de arriba en vertical: el sonido está en Ajustes (y la tecla M sigue).
- **Chips** (`#hud-players` cambiado de sitio): hasta 86 px, fondo noche al 86 %, emblema de 22 px con su color, nombre corto de 12 px y barra de 5 px; el tuyo con borde crema; eliminado al 50 %. La marca (listo en `listo`, cruz si ha caído, icono de desconexión) va en una insignia en la esquina del emblema: con la marca junto al nombre, como en la maqueta, no cabían «Tuerca» a 390 px ni varios nombres a 360 (decisión del usuario del 03-10-2026).
- **Viento** `#hud-wind-chip`: icono, flecha relativa a la cámara y fuerza redondeada («→ 2», al menos 1); sin viento, no está. **Objetivo** `#hud-goal-chip`: borde naranja e icono de diana. Si no hay ninguno de los dos, la fila no ocupa sitio.
- **Sin emoji** en las piezas compartidas con PC (mismo elemento, misma disposición): silencio, ajustes, viento, objetivo, bot, estados del marcador, línea del espectador y rótulos del escudo real, del objetivo y del premio. Iconos de Lucide (ISC) a trazo 2,5 px en `currentColor`.
- **Menos trabajo por fotograma:** el marcador y el viento solo tocan el DOM si cambia algo (antes se rehacían en cada fotograma).
- El tutorial se coloca justo debajo de la parte superior (`--top-h`).

## Acceptance Criteria

- [x] En vertical: píldora de ronda con segundos, engranaje de 44 px, cuatro chips en una fila y chips de viento y objetivo; sin «Fase de apuntado» ni silencio arriba.
- [x] Sin viento no hay chip de viento; con viento enseña flecha y fuerza.
- [x] Ningún nombre corto se corta en 360×780, 390×844 y 412×915, y nada se cruza.
- [x] Sin emoji en el marcador, el viento, el objetivo, los botones de arriba y los rótulos tocados.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `hud-compact.spec.ts` (fila de chips, píldora, engranaje, chip de viento, sin solapes ni recortes), `tutorial.spec.ts`, `touch.spec.ts` (engranaje y Ajustes), `solo.spec.ts` y `espectador.spec.ts` |

## Evidence

2026-10-03. En 390×844 la parte superior mide 134 px: píldora y engranaje de 44 px, chips de 86×36 y la fila de viento y objetivo de 30 px. En 360×780 los chips miden 78 px y los nombres cortos («Pixel», «Byte», «Bot», «Tú») caben enteros con la insignia. `hud-compact`, `tutorial`, `touch`, `controls`, `solo` y `espectador` en verde.
