---
id: WRK-TASK-056
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
activates: [DOM-JUEGO-003, FEAT-SENSACION-001, RULE-001]
dependencies:
  - id: WRK-TASK-055
    relation: depends-on
tags: [municion, equilibrio]
---

# WRK-TASK-056 — Racimo de cocos que se abre en vuelo y explota

## Objective

Que el racimo de cocos sea más espectacular: se abre hacia el 60-70 % del vuelo, los cocos siguen la parábola abriéndose en abanico (sin el empujón hacia abajo de ahora) y cada coco explota al tocar algo.

## File Scope

- `client/src/game/sim/projectiles.ts` (comportamiento de los cocos: momento de apertura, abanico, explosión al contacto)
- `shared/ammo.ts` (parámetros; rareza si hace falta)
- `client/src/game/render/`, `client/src/game/audio.ts` (efecto y sonido de apertura y de cada explosión)
- `tests/balance/`
- `specs/domain/DOM-JUEGO-003-municion.md`, `specs/feature/FEAT-SENSACION-001-sonido-efectos-y-estadisticas.md`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| DOM-JUEGO-003 | Nueva fila de los cocos: apertura, abanico, explosión por coco |
| FEAT-SENSACION-001 | Efecto y sonido propios de la apertura y de cada explosión |
| RULE-001 | Destrozo antes y después; los cocos deben quedar en una franja coherente con su rareza |

- Hoy se abren al empezar a caer (`COCO_SPLIT_VY`) y salen a 5 m/s hacia abajo. Nuevo: abrir cuando se ha recorrido el 60-70 % del tiempo de vuelo previsto (con `landingPoint`), conservar la velocidad del racimo y añadir solo una dispersión lateral con semilla.
- Explosión por coco: pequeña (orientativo: radio 1,8-2,2 m, fuerza 45-55, al rey un 25 %, como los huevos de la gallina). Seis explosiones juntas pueden sacar a los cocos de la franja común (10-13): si pasa, bajar la fuerza o pasar el racimo a rara, y anotarlo.
- La marca de impacto de WRK-TASK-054 sigue la trayectoria del racimo entero; no hace falta marcar cada coco.

## Acceptance Criteria

- [ ] El racimo se abre entre el 60 y el 70 % del vuelo (unitaria o E2E en el campo de pruebas).
- [ ] Cada coco explota al primer contacto, con efecto y sonido.
- [ ] Destrozo de los cocos medido antes y después y dentro de la franja de su rareza; equilibrio en normal anotado.
- [ ] Capturas de la apertura y las explosiones en PC y en móvil vertical.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | Destrozo (12 disparos) y equilibrio |
| Capturas | `sandbox-shot.mjs` con los cocos |

## Evidence

Pendiente.
