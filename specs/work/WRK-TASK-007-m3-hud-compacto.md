---
id: WRK-TASK-007
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-004
activates:
  - FEAT-INTERFAZ-001
  - PROD-JUGAR-001
  - RULE-003
dependencies:
  - id: WRK-TASK-006
    relation: depends-on
tags:
  - moviles
  - interfaz
---

# WRK-TASK-007 — M3: HUD compacto

## Objective

Que con menos de 500 px de alto (un móvil en horizontal, 360 px) el HUD deje ver la isla y nada se solape.

## File Scope

Propuesto:

- `client/src/ui/hud.ts` (lista de jugadores compacta, botón «?» para los controles)
- `client/src/ui/style.css` (media query `max-height: 500px`, botón de disparo en la esquina derecha)
- `tests/tools/review.mjs` o una herramienta nueva de capturas en tamaños de móvil
- `tests/e2e/` (comprobación de solapes)

Fuera: `aim.ts` y el control táctil (WRK-TASK-006), el lobby y la portada salvo que se solapen.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Mantener emblemas y colores accesibles (D-045) y el texto grande de Ajustes |
| PROD-JUGAR-001 | El jugador tiene que ver siempre su munición, su potencia y el tiempo |
| RULE-003 | Revisión con capturas antes de desplegar |

Lo que pide `docs/MOVILES.md`:

- La lista de jugadores pasa a estandarte, porcentaje y calavera, sin nombres.
- El panel de controles se oculta y queda un botón «?».
- Potencia y elevación en una línea más pequeña.
- El botón de disparo baja a la esquina derecha, al alcance del pulgar.

Va después de M2 porque las dos tocan `hud.ts` y `style.css`, y M2 fija qué botones táctiles hay (ver WRK-PLAN-004).

## Acceptance Criteria

- [ ] Con 863 × 360, 740 × 360 y 915 × 412 ningún elemento del HUD se solapa con otro.
- [ ] La lista de jugadores compacta muestra estandarte, porcentaje y calavera.
- [ ] El panel de controles solo aparece al pulsar «?».
- [ ] El botón de disparo queda en la esquina inferior derecha en alturas menores de 500 px.
- [ ] Por encima de 500 px de alto el HUD no cambia.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | E2E que comprueba con `getBoundingClientRect` que los elementos del HUD no se cruzan en 3 tamaños de móvil |
| Manual | Revisión a ojo de las capturas en los 3 tamaños y en un móvil real |

## Evidence

Pendiente.
