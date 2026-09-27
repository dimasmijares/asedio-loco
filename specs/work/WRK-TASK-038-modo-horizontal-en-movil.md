---
id: WRK-TASK-038
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-009
activates: [FEAT-INTERFAZ-001, FEAT-CAMARA-001]
tags: [movil, interfaz]
---

# WRK-TASK-038 — Modo horizontal en móvil

## Objective

Que jugar con el móvil en horizontal sea cómodo y claro, sin empeorar el vertical ni el PC.

## File Scope

- `client/src/ui/style.css` (HUD compacto de poca altura)
- `client/src/game/camera.ts` si hace falta

## Implementation Notes

Se revisa con capturas en 740×360, 863×360 y 915×412 qué estorba en cada fase: apuntado, cuenta atrás, impacto, resultados y final.

## Acceptance Criteria

- [x] Capturas antes y después en los 3 tamaños.
- [x] `hud-compact.spec.ts` sin solapes.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `hud-compact`, `touch` |

## Evidence

Revisión con capturas de todas las fases en 740×360, 863×360 y 915×412:

- **Error de orden en el CSS, anterior a esta tarea:** los bloques `@media` de poca altura y de vertical estaban antes de las reglas base de resultados, pantalla final y cuenta atrás, que los anulaban. En horizontal, la lista de resultados empezaba a 110 px y ocupaba casi toda la pantalla. Los dos bloques pasan al final de `style.css`.
- **Resultados compactos con poca altura:** frase de 18 px y filas de 12 px, desde 54 px. Las etiquetas de daño bajan bajo la lista o, si ahí no caben, se colocan a su lado.
- **Cuenta atrás:** al empezar retira el rótulo que hubiera en pantalla («RONDA N», «LA LAVA SUBE»), que se superponía con los números. Sirve para todos los formatos.
- **Descripción de la munición en horizontal:** a 11 px y con un ancho máximo; antes estaba oculta.
- **Pruebas:** `hud-compact` (los 5 tamaños, con la descripción más larga), `touch`, `controls` y `encuadre` en local: 11 de 11.
