---
id: RULE-001
type: rule
layer: governance
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies: []
tags:
  - fisica
  - municion
  - equilibrio
  - medicion
---

# RULE-001 — Todo cambio de física o munición se mide antes y después

## Rule

Un cambio de física o de munición debe medirse **antes y después** con:

1. **Destrozo por munición:** `npx vitest run --config tests/balance/vitest.config.ts destrozo`. Deja en `tests/balance/destrozo.txt` los bloques rotos y desplazados por disparo y los reyes caídos.
2. **Equilibrio:** `GAMES=8 DIFF=<facil|normal|dificil> npx vitest run --config tests/balance/vitest.config.ts balance`, al menos en normal y difícil (rondas y segundos de media, causas de eliminación).
3. **Rendimiento**, si el cambio puede afectar al coste (más cuerpos o uniones, fuerzas continuas, más partículas): `node tests/tools/bench.mjs <base> medium gpu` y `tests/e2e/perf.spec.ts`.

Las cifras de antes y de después deben quedar en la `## Evidence` de la tarea. Un cambio sin esas cifras no se da por terminado.

## Scope

- Se aplica a `shared/materials.ts`, `shared/ammo.ts`, `shared/ballistics.ts`, `shared/fracture.ts`, `shared/castle.ts`, `shared/map.ts` (isla y lava) y `client/src/game/sim/`.
- También a cambios de reglas que alteran el ritmo: duración de las fases, reparto de munición, escalada de lava.
- No se aplica a cambios solo visuales (`render/`, `view.ts`) ni de interfaz. Si tocan los topes de fragmentos o partículas, solo el punto 3.

## Rationale

La física es la seña de identidad del juego y sus efectos no son intuitivos:

- Reforzar municiones subió la media de 6,2 a 8 bloques por disparo (D-052).
- Reyes más frágiles bajaron la partida difícil a 2,6 minutos y hubo que deshacerlo (D-053).
- Los castillos de 140 bloques subieron el paso de física de 3,3 a unos 5 ms (D-063).

Sin medir, estas consecuencias se descubren jugando, tarde.

Referencia actual (26-09-2026, WRK-TASK-021): 8,3 bloques rotos por disparo de media (12 disparos por munición); en normal, 9,1 rondas y 165 s; en difícil, 7,3 rondas y 139 s; paso de física de unos 5 ms en `/#bench`.

## Enforcement

| Mechanism | Where | Blocking |
|-----------|-------|----------|
| Escenas de física en Node (`tests/unit/physics.test.ts`) | `npm test`, local y CI | yes |
| Paso de física < 16 ms (`tests/e2e/perf.spec.ts`) | E2E, grupo `basicas` de CI | yes |
| Cifras de destrozo y equilibrio en la Evidence | Revisión de la tarea (DOC-OPS-002) | no |

Destrozo y equilibrio no tienen umbral fijo: una persona compara antes y después.

## Exceptions

| Exception | Granted by | Recorded in |
|-----------|------------|-------------|
| Corrección de un error evidente sin efecto en el equilibrio (p. ej. un NaN) | dimas | `## Evidence` de la tarea, con el motivo |
| Experimentos en `tests/unit/_*.test.ts`, que no se suben | no hace falta | no se registra |

## Traceability

- Decisiones: D-022, D-052, D-053, D-058, D-063.
- Pruebas y herramientas: `tests/balance/destrozo.test.ts`, `tests/balance/balance.test.ts`, `tests/tools/bench.mjs`, `tests/e2e/perf.spec.ts`.
