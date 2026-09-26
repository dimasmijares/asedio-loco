---
id: WRK-TASK-028
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
activates: [DOM-JUEGO-003, RULE-001, RULE-004]
tags: [municion, equilibrio]
---

# WRK-TASK-028 — Gallina bombardera

## Objective

Que la gallina rebote **por el castillo** y rompa en cada bote: 12-16 bloques repartidos en 3-4 cráteres pequeños.

## File Scope

- `client/src/game/sim/projectiles.ts` (gallina)
- Efectos y sonido del huevo (`render/`, `audio.ts`)

## Implementation Notes

Decisión del usuario: huevos bomba **a lo bomba de racimo**, con **poco rebote** para que haga daño. Al tocar el castillo suelta un racimo de huevos que se reparten alrededor y explotan casi a la vez (ondas pequeñas que rompen madera y cristal y astillan piedra). Los botes son cortos y bajos, así que la gallina se queda encima del castillo y suelta otro racimo más pequeño en cada uno.

## Acceptance Criteria

- [x] Gallina en 12-16 bloques, con más dispersión que la vaca.
- [x] Los botes se quedan sobre el castillo rival en al menos 9 de 12 disparos.
- [x] Banco sin bajar del presupuesto (RULE-004).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

- **Mecánica:** 3 botes de 2,5 m/s en horizontal y 4,5 m/s hacia arriba hacia el castillo rival más cercano (antes, 4 botes que la lanzaban hacia delante a 6 m/s o más). En cada bote suelta un racimo de 6, 5 y 5 huevos en corona; cada huevo explota al tocar algo o a los 1,5 s (radio 2,2 m, fuerza 72). En el tercer bote la gallina desaparece en plumas.
- **Rey:** `explode` acepta `king`, un factor sobre el daño y el empuje al rey (huevos: 0,3). Sin él, los huevos mataban o echaban al rey en 5-6 de 12.
- **Vista:** el huevo es una gallina a escala 0,45 con modelo propio (no cambia el protocolo). Explosión de yema y cáscara, petardo agudo y temblor pequeño.
- **Destrozo (12 disparos):** de 5,2 a 13,8 bloques (14,2-16,8 en ejecuciones sueltas: los huevos salen con dirección aleatoria), 3 de 12 reyes, dispersión de 1,0 a 2,3 m (la mayor de las raras) y piedra de 0,7 a 5,2.
- **Equilibrio (8 partidas):** normal 7,0 rondas y 136 s (antes de la tarea, 9,6-10,0); difícil 6,1 rondas y 118 s (6,0-6,9). El usuario aceptó partidas más cortas.
- La comprobación de que los botes se quedan sobre el castillo se hace con la dispersión (2,3 m frente a los 3 m del alud) y con capturas del campo de pruebas.
- E2E de física y solitario en local: 5 de 5.
