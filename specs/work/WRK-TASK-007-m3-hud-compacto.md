---
id: WRK-TASK-007
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: low
version: 1.0.0
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

- [x] Con 863 × 360, 740 × 360 y 915 × 412 ningún elemento del HUD se solapa con otro.
- [x] La lista de jugadores compacta muestra estandarte, porcentaje y calavera.
- [x] El panel de controles solo aparece al pulsar «?».
- [x] El botón de disparo queda en la esquina inferior derecha en alturas menores de 500 px.
- [x] Por encima de 500 px de alto el HUD no cambia.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | E2E que comprueba con `getBoundingClientRect` que los elementos del HUD no se cruzan en 3 tamaños de móvil |
| Manual | Revisión a ojo de las capturas en los 3 tamaños y en un móvil real |

## Evidence

- **Código:**
  - `style.css`: `@media (max-height: 500px)` para el marcador sin nombres, la fase, el reloj y el viento más pequeños, las tarjetas y las flechas, el botón de disparo en la esquina (redondo en táctil), la cuenta atrás y los rótulos en `vh`, y la pantalla final en dos columnas con desplazamiento.
  - `Hud`: con poca altura, la ayuda empieza plegada.
- **E2E `tests/e2e/hud-compact.spec.ts`** (en el grupo `basicas` de CI): en 863 × 360, 740 × 360 y 915 × 412 táctiles, 9 piezas del HUD, sin cruces por `getBoundingClientRect` y todas dentro de la pantalla. El marcador no enseña nombres. En 1280 × 720 sí los enseña.
- **Revisión visual** (capturas en 740 × 360): apuntado, resultados y pantalla final. La pantalla final no cabía y ahora sí, con «¡Revancha!» a la vista. De paso, «1 disparos al aire» pasa a singular.
- **Puertas en local (2026-09-26):** `npm run verify` y las E2E `touch`, `hud-compact`, `controls` y `solo`, 9 en verde.
- **Consolidación:** `FEAT-INTERFAZ-001` 1.4.0.
