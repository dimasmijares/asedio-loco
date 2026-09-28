---
id: WRK-TASK-057
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [DOM-JUEGO-002, FEAT-INTERFAZ-001, RULE-001, RULE-002]
tags: [lava, equilibrio]
---

# WRK-TASK-057 — La lava sube un poco cada ronda

## Objective

Que la lava suba un poco al empezar cada ronda y se quede quieta el resto del tiempo, al mismo ritmo medio que ahora, en lugar de saltar 1,3 m cada 3 rondas.

## File Scope

- `shared/map.ts` (`LAVA_LEVELS`, `LAVA_RISE_EVERY`) y `shared/match.ts` (`lavaLevelForRound`)
- `client/src/game/sim/sim.ts` (comerse bloques con subidas pequeñas)
- `client/src/game/render/` y `client/src/ui/hud.ts` (aviso de subida, si depende del nivel)
- `tests/unit/match.test.ts`, `tests/balance/`
- `specs/domain/DOM-JUEGO-002-escalada-lava-y-viento.md`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| DOM-JUEGO-002 | Reglas 1-3: altura por ronda en lugar de niveles cada 3 rondas |
| FEAT-INTERFAZ-001 | El aviso de que sube la lava no debe salir cada ronda con el mismo peso: decidir con el usuario en WRK-TASK-060 |
| RULE-001 | Equilibrio antes y después (la lava causa casi la mitad de las eliminaciones en normal) |
| RULE-002 | Si `lavaLevel` cambia de significado en `MatchState`, sube `PROTOCOL_VERSION` |

- Ritmo decidido: el mismo medio que ahora. Altura orientativa: `−3,6 + 0,444 · (ronda − 1)`, que da 0,4 m en la ronda 10 como hoy, con el mismo tope (5,2 m) o el que pida WRK-TASK-058 con castillos más altos.
- La subida se anima al empezar la ronda y después la lava no se mueve (comprobar que ya es así).
- Regla 3 (comerse bloques a más de 3 cm por debajo): con subidas de 0,44 m, una hilera de 1,2 m se come en 3 rondas; comprobar que lo que queda a medias no tiembla ni se hunde antes de tiempo.
- Modo rápido (`fast=1`): mantener que la lava avance más deprisa.

## Acceptance Criteria

- [x] La lava sube en cada ronda y está a 0,4 m (±0,1) en la ronda 10 (unitaria).
- [x] Entre dos inicios de ronda la lava no se mueve.
- [x] Equilibrio en normal y difícil antes y después, con las causas de eliminación.
- [x] DOM-JUEGO-002 al día.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Altura por ronda, modo rápido |
| Medición | Equilibrio |

## Evidence

2026-09-28.
- `LAVA_LEVELS` pasa a una altura por ronda: −3,6 + 0,444 · (ronda − 1), tope 5,2 m (ronda 21). Ronda 10: 0,396 m, igual que antes. `fast=1` sube el triple por ronda. `lavaLevel` sigue siendo un índice y los clientes solo leen `lavaY`: no cambia el protocolo.
- La lava se mueve al empezar la ronda (animación del escenario) y se queda quieta; comerse bloques no cambia: una hilera cada 3 rondas, a partir de la 10.
- El cartel «LA LAVA SUBE» solo sale cuando la lava está a punto de tocar la isla (por encima de −0,3 m, desde la ronda 9); el sonido y el efecto, en cada subida.
- Unitaria nueva: sube en cada ronda, 0,4 ± 0,1 en la ronda 10, tope 5,2, modo rápido.
- Equilibrio en normal con 055, 056 y 057 juntas (8 partidas): 7,6 rondas; primera eliminación en la ronda 3-5; la lava remata en la ronda 9 a los que quedan. Dentro de 7-11, en el borde bajo.
