---
id: WRK-TASK-029
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

# WRK-TASK-029 — Comunes: tronco apisonadora y cocos metralla

## Objective

Subir las dos comunes flojas a 10-13 bloques con firmas propias: el tronco barre la fila baja y descalza el castillo, y los cocos reparten golpes por toda la fachada. El pedrusco se queda como referencia (9-11).

## File Scope

- `client/src/game/sim/projectiles.ts` (tronco y cocos)
- `shared/ammo.ts` (tamaños y densidades)

## Implementation Notes

- Tronco: al primer contacto se orienta atravesado a su avance y rueda recto hacia el castillo apuntado. Algo más largo (de 1,9 a ~2,4 m). Mantiene la velocidad al atravesar madera y cristal.
- Cocos: de 4 a 6, que se abren más tarde (más cerca del castillo) para que caigan todos encima, y más densos para que cada uno rompa de 1 a 3 bloques.

## Acceptance Criteria

- [x] Tronco y cocos en 10-13 bloques. ~~El tronco con más bloques de la fila baja~~: rueda por donde toca (arriba de la muralla si le da arriba); su firma pasa a ser el surco en línea (dispersión 3,1, la mayor con el alud). Los cocos, más repartidos que el pedrusco (2,2 frente a 0,8).
- [x] Ningún rey de un golpe con las comunes salvo impacto directo del pedrusco.
- [x] Banco con 6 cocos sin bajar del presupuesto (RULE-004).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

- **Tronco:** al primer contacto guarda la dirección horizontal en que venía y rueda recto: no baja de 8 m/s en esa dirección y gira a 12 rad/s alrededor de un eje atravesado. Sin cambiar tamaño ni densidad. Destrozo de 6,5 a 10,4 bloques, movidos de 3,0 a 5,3 y dispersión de 1,0 a 3,1 m. La fila baja apenas cambia (0,8): cuando le da arriba a la muralla, arrasa por arriba.
- **Cocos:** se abren cayendo a 5 m/s (antes, en lo más alto), 6 en vez de 4, abanico ×1,6 y densidad de 7 a 10. Destrozo de 6,5 a 12,8, dispersión de 1,2 a 2,2 m, piedra de 1,8 a 5,6.
- **Rendimiento:** 2 cocos más por disparo, sin efecto medible; no se pasa el banco.
- **Tarjetas:** textos nuevos del tronco, los cocos, la vaca, la sandía y la gallina.
- **Equilibrio (8 partidas):** normal 7,3 rondas y 136 s; difícil 5,9 rondas y 115 s.
- E2E de física y solitario en local: 5 de 5.
