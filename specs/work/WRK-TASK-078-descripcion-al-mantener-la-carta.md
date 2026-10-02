---
id: WRK-TASK-078
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
  - id: WRK-TASK-077
    relation: depends-on
tags: [interfaz, hud, movil, municion]
---

# WRK-TASK-078 — Descripción de la munición al mantener la carta (R-10 fase 2: U2)

## Objective

Quitar la tarjeta fija con la descripción de la munición elegida, en móvil y en PC. La descripción sale solo cuando se pide: al mantener el dedo sobre una carta o, en PC, al pasar el ratón. Fuente de verdad: el componente CartaMunicion del design system y la maqueta «Móvil · Manteniendo una carta».

## File Scope

- `client/src/ui/hud.ts` (`setAmmo`, `showTip`, `hideTip`), `client/src/ui/style.css`, `client/src/ui/tutorial.ts` (paso 2)
- `tests/e2e/touch.spec.ts`, `tests/e2e/controls.spec.ts`, `tests/e2e/hud-compact.spec.ts`, `tests/e2e/tutorial.spec.ts`

Fuera: el resto del HUD de PC (U11).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Las cartas se eligen en `pointerdown` y solo se rehacen si cambia la mano (WRK-TASK-024) |

- **Sin etiqueta fija:** desaparece `#hud-ammo-desc`; las cartas pierden el `title` del navegador y llevan nombre, rareza y descripción en `aria-label`.
- **Un toque elige; mantener describe:** al pulsar se elige, como antes. Con el dedo, si se mantiene 350 ms, sale la tarjeta `#ammo-tip`. Al levantarlo en cualquier sitio (o si el sistema cancela el gesto), la tarjeta desaparece y la carta queda elegida. Sin el menú del sistema al mantener (`contextmenu` y `-webkit-touch-callout`).
- **En PC:** la misma tarjeta al pasar el ratón por una carta; desaparece al salir de la fila.
- **Tarjeta:** crema, borde 3 px noche, sombra dura, nombre en Lilita One 18 px con la chapa de rareza, descripción en Nunito 13 px vino (dos líneas como mucho) y una flecha hacia la carta. En la bandeja del móvil va a todo el ancho, 10 px por encima de la bandeja. En PC y en el móvil en horizontal va centrada sobre la carta y por encima de toda la fila.
- **Las cartas ya no se rehacen al elegir:** solo cambia la marca `.sel`. Antes, elegir rehacía la fila, y el dedo que mantenía la carta se quedaba sobre un elemento ya quitado.

## Acceptance Criteria

- [x] Ninguna tarjeta fija de descripción, ni en móvil ni en PC.
- [x] Un toque elige sin enseñar la tarjeta; mantener ≈ 350 ms la enseña encima de la bandeja; al soltar se va y la carta queda elegida.
- [x] Con la tarjeta abierta, el castillo objetivo sigue a la vista por encima de ella.
- [x] En PC sale al pasar el ratón y se va al salir.
- [x] Con la descripción más larga, cabe en dos líneas y dentro de la pantalla en los 6 tamaños de móvil.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `touch.spec.ts` (toque y mantener, castillo a la vista), `controls.spec.ts` (ratón), `hud-compact.spec.ts` (descripción más larga), `tutorial.spec.ts` |

## Evidence

2026-10-02. En 390×844, con la segunda carta mantenida: tarjeta en (14, 499) de 362×83, castillo objetivo a y = 285. A 150 ms no se ve; tras soltar, oculta y la carta elegida. En PC (1280×720), al pasar el ratón sale encima de la fila y se oculta al salir. `touch`, `controls`, `hud-compact` y `tutorial` en verde.
