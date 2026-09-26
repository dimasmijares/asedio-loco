---
id: WRK-TASK-030
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001]
tags: [municion, equilibrio]
---

# WRK-TASK-030 — Piano perforador

## Objective

Que el piano hunda una columna de arriba abajo: 15-20 bloques, el mejor contra torres y contra el rey si se acierta encima.

## File Scope

- `client/src/game/sim/projectiles.ts` (piano)
- `shared/ammo.ts` (densidad)

## Implementation Notes

- Más pesado (densidad de 3 a ~6), y solo él conserva más velocidad al romper un bloque (hoy el 60 %, D-013) para atravesar pisos.
- Al tocar el suelo o quedarse parado, «acorde final»: onda corta de ~2,5 m que remata la base de la columna.

## Acceptance Criteria

- [x] Piano en 15-20 bloques, con la altura mínima de daño más baja de todas (llega al suelo).
- [x] Como mucho 3 de 12 reyes.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

- **Cambios:**
  - densidad de 3 a 6;
  - `plowKeep` nuevo en `ProjectileBehavior`: el piano conserva el 90 % de la velocidad al romper, y el resto sigue en el 60 %;
  - acorde final (radio 2,8 m, fuerza 85) al tocar el suelo o el pedestal, o al bajar de 1,5 m/s, con su efecto de polvo y teclas y su sonido propio.
- **Destrozo (12 disparos):**
  - bloques rotos: de 10,8 a 16,9;
  - altura media del daño: 2,3 m, la más baja de todas;
  - fila baja: de 2,8 a 4,9, la que más;
  - piedra: de 5,7 a 10,8;
  - reyes: 1 de 12.
- **Ajuste en la gallina:** los huevos salen con semilla (antes, `Math.random`: la gallina bailaba entre 12 y 18 bloques y entre 1 y 6 reyes) y hacen al rey el 25 % del daño. Queda estable en 13,3 bloques y 0-1 reyes.
- **Equilibrio (8 partidas):**
  - normal: 8,4 rondas y 150 s;
  - difícil: 5,1 rondas y 104 s, dentro del ruido que se ha visto entre 5,1 y 7,1.
- E2E de física en local: 4 de 4.
