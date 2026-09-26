---
id: WRK-TASK-021
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-005
activates: [DOM-JUEGO-003, RULE-001, FEAT-BOTS-001]
tags: [equilibrio, municion]
---

# WRK-TASK-021 — Equilibrio del imán, el tronco y la gallina

## Objective

Según `tests/balance/destrozo.txt`, con los castillos de 140 bloques el imán rompe 24,2 bloques por disparo y mata al rey en 4 de 6, mientras que el tronco (1,7) y la gallina (2,5) siguen flojos, frente a una media de 8,8. Hay que decidir con el usuario si se ajusta y cuánto.

## File Scope

- `client/src/game/sim/projectiles.ts` y `shared/ammo.ts` (parámetros de las tres municiones)
- `tests/balance/` (resultados nuevos)

Fuera: las demás municiones y los reyes (D-053, ADR-010).

## Implementation Notes

Decisión previa del usuario: ¿el imán debe ser la épica que más destroza, o igualarse a las demás? ¿Importa que el tronco y la gallina sean flojos, si son comunes o raras?

## Acceptance Criteria

- [x] Destrozo, equilibrio (normal y difícil) medidos antes y después, con las cifras en Evidence (RULE-001).
- [x] Ninguna munición rompe más del doble de la media salvo decisión explícita del usuario.
- [x] `DOM-JUEGO-003` actualizada con la tabla nueva.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` y `balance` con `GAMES=8` |

## Evidence

- **Decisión del usuario (26-09-2026):** bajar el imán y subir los débiles (tronco y gallina).
- **Cambios:**
  - imán: campo de 2,6 → 2,3 s y fuerza de 34 → 26;
  - tronco: densidad de 2 → 3 y giro de 7 → 12 rad/s;
  - gallina: 3 → 4 botes y picotazo de 2,4 m/24 → 3,2 m/50.

  Van como constantes con nombre en `projectiles.ts`.
- **Destrozo con 12 disparos por munición, antes → después:**
  - imán: de 24,2 a 13,1 bloques, y de 7 reyes de 12 a 0;
  - tronco: de 3,0 a 6,5;
  - gallina: de 2,3 a 5,1;
  - media: de 8,8 a 8,3.

  Con 6 disparos la prueba bailaba ±1,5, así que se midió con 12. `destrozo.test.ts` acepta ahora `AMMO=a,b` para medir solo algunas (lo deja en `destrozo-parcial.txt`, que se ignora).
- **Equilibrio con 8 partidas, sobre el mismo código salvo la munición:**
  - normal: de 8,3 rondas y 150 s a 9,1 rondas y 165 s;
  - difícil: de 7,1 rondas y 140 s a 7,3 rondas y 139 s.
- **Hallazgo de la medición:** las cifras de equilibrio anteriores a WRK-TASK-022 (274 s) estaban infladas por un fallo del adelanto con todos listos. Queda anotado en WRK-TASK-022 y en `DOM-JUEGO-001`.
- **Consolidación:** `DOM-JUEGO-003` 2.0.0, que cambia una regla (los parámetros de 3 municiones); `DOM-JUEGO-001` y `RULE-001` con las referencias nuevas.
