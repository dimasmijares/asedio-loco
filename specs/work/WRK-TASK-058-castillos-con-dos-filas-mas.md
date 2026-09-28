---
id: WRK-TASK-058
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
activates: [DOM-JUEGO-004, ARCH-005, RULE-001, RULE-002, RULE-004]
dependencies:
  - id: WRK-TASK-057
    relation: depends-on
tags: [castillos, rendimiento, equilibrio]
---

# WRK-TASK-058 — Castillos con dos filas más

## Objective

Dar a todos los castillos dos filas más de altura (torres, murallas y contrafuertes) sin salirse del presupuesto de rendimiento.

## File Scope

- `shared/castle.ts` (plano local, `BLOCK_ID_STRIDE`, `KING_ID_BASE`, `PEDESTAL_TOP` si sube el torreón)
- `shared/protocol.ts` (`PROTOCOL_VERSION`)
- `shared/bot.ts` (puntos de mira por altura)
- `client/src/game/camera.ts`, `client/src/game/director.ts` (encuadres, si el castillo más alto tapa la vista)
- `tests/unit/`, `tests/balance/`, `tests/e2e/perf.spec.ts`
- `specs/domain/DOM-JUEGO-004-castillos-isla-y-materiales.md`, ADR nueva que sustituye a ADR-013 en el número de bloques

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| DOM-JUEGO-004 | Plano del castillo, materiales por fila, uniones |
| ARCH-005 | Topes de bloques y fragmentos con más bloques |
| RULE-001 | Destrozo y equilibrio antes y después |
| RULE-002 | Cambian los identificadores de bloque: sube `PROTOCOL_VERSION` |
| RULE-004 | `perf.spec.ts` y banco `cpu=4 movil` dentro del presupuesto |

- Hoy: torres de 5 filas, murallas de 4, contrafuertes de 4, forro de 3; 176 bloques. Con dos filas más en torres (+8), murallas (+40) y contrafuertes (+4) salen 228; con el forro también, 252. Pasa de `BLOCK_ID_STRIDE = 200`, y con 4 castillos choca con `KING_ID_BASE = 1000`: subir los dos (p. ej. 300 y 2000).
- Materiales: las filas nuevas siguen el patrón (piedra abajo, madera arriba). La ventana y los refuerzos de hierro se reparten para que las murallas altas no sean solo piedra.
- Decidido por el usuario (28-09-2026): el torreón sube dos filas (pedestal de 4 filas, `PEDESTAL_TOP` más alto) para que el rey siga asomando por encima de las murallas. Medir si la caída desde más alto mata más reyes.
- La altura de lava de WRK-TASK-057 y su tope se revisan con la altura nueva.

## Acceptance Criteria

- [x] Todos los castillos tienen dos filas más; `BLOCKS_PER_CASTLE` anotado.
- [x] Destrozo y equilibrio antes y después: la partida en normal sigue en 7-11 rondas (si no, ajustar lava o munición en una tarea nueva).
- [x] `perf.spec.ts` en verde y banco `cpu=4 movil` anotado antes y después.
- [x] `PROTOCOL_VERSION` sube; DOM-JUEGO-004 y la ADR nueva al día.
- [x] Capturas en PC y móvil vertical del castillo nuevo y del plano general.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Número de bloques, identificadores sin solapes con 4 castillos |
| Medición | Destrozo, equilibrio, banco |
| E2E | `perf.spec.ts` |

## Evidence

2026-09-28.
- Plano: torres de 7, murallas de 6, contrafuertes de 6, pedestal de 4 filas. `BLOCKS_PER_CASTLE` = 236 (191 piedra, 33 madera, 8 cristal, 4 hierro). Rey a 5,73 m. `BLOCK_ID_STRIDE` 300, `KING_ID_BASE` 1500, `PROTOCOL_VERSION` 12, tope de lava 7,6 m. ADR-017.
- Puntos de mira de los bots y de la prueba de destrozo, a la altura nueva (muralla 2,5 → 3,5; torre 3,5 → 5; torreón 3,4 → 5,4).
- `firstHit` pasa a medir la distancia exacta de la bola a la caja: con torres más altas, una bola que rozaba una almena daba un falso choque.
- Destrozo (12 disparos, 236 bloques) → antes (176): pedrusco 6,4 (10,2), tronco 9,3 (9,8), cocos 13,8 (12,3), vaca 18,9 (17,1), sandía 19,9 (17,3), agujero negro 22,8 (19,3), imán 21,5 (22,7), nieve 29,7 (19,2). Media 17,8. Cinco fuera de su franja: WRK-TASK-065.
- Equilibrio en normal (8 partidas): 7,6 → 8,1 rondas; causas: fuera 11, aplastado 7, lava 7, caída 1.
- Rendimiento: `perf.spec.ts` 7,36 ms por paso (límite 16; unos 5 antes). Banco `low swiftshader cpu=4 movil`, 2 pasadas: paso de física 16,3-17,0 → 28,5-29,6 ms, despiertos 606-628 → 868, fps 8 → 5-6. Riesgo para un anfitrión móvil: WRK-TASK-066.
- Estado completo con 4 castillos: 36 → 49 KB (límite 64).
- Reposo: a los 18 s queda despierto menos del 10 % (antes todo dormido a los 6 s); `castle-rest.test.ts` ajustada. Se probó un sueño manual de bloques casi quietos, pero rompía otras pruebas y se descartó.
- E2E locales `controls`, `smoke`, `solo` y `perf` en verde.
