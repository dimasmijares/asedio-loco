---
id: WRK-TASK-054
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
activates: [FEAT-CONTROL-001, FEAT-BOTS-001]
dependencies:
  - id: WRK-TASK-060
    relation: depends-on
tags: [control, apuntado]
---

# WRK-TASK-054 — Parábola hasta el choque con marca de impacto

## Objective

Que lo que se ve al apuntar sea lo que pasa: la vista previa pinta la trayectoria entera hasta el primer bloque o suelo que toca, con una marca en ese punto, en PC y en móvil.

## File Scope

- `client/src/game/aim.ts` (`TrajectoryPreview`)
- `shared/ballistics.ts` (trayectoria con parada al primer choque)
- `client/src/game/match/ui.ts` y `client/src/game/modes/sandbox.ts` (llamadas a la vista previa)
- `client/src/game/render/` (lectura de las cajas de los bloques visibles, si hace falta)
- `tests/e2e/`, `tests/unit/`
- `specs/feature/FEAT-CONTROL-001-punteria-y-disparo.md`, ADR nueva que sustituye la parte de ADR-005 sobre la vista previa

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-CONTROL-001 | Regla 6 (vista previa) pasa de «nunca el punto de caída» a «hasta el primer choque, con marca» |
| FEAT-BOTS-001 | Los bots ya apuntan con `solveAim`; comprobar que el equilibrio contra ellos no se desploma cuando el humano apunta mejor |

- Diagnóstico (28-09-2026): la física y la vista previa usan el mismo arrastre (`aeroAccel`) y los proyectiles no tienen amortiguación. Con 40° de elevación y fuerza al 100 %, la vista previa acaba a 53 m y la bala cae a 83 m sin obstáculos; con el arco alargado a ojo parece que llega a 88 m, y el muro rival la para mucho antes.
- El choque se calcula en el cliente contra los bloques tal como se ven (posición y tamaño de cada instancia, caja orientada) y contra el suelo de la isla y la lava. Paso de 1/60 s y parada en el primer contacto; con unos 700 bloques, filtrar primero por castillo cercano a la trayectoria.
- Mientras se apunta sin cargar (`guide`), el tramo corto de ahora se mantiene; al cargar (`charge`), el arco completo. La marca es un anillo en el suelo o en la cara del bloque, del color del jugador. Aspecto aprobado (R-01, 28-09-2026): anillo del color del jugador con borde blanco.
- Más puntos (hoy 26) o un tubo fino, para que el arco largo no quede a trozos.

## Acceptance Criteria

- [x] Al cargar, la vista previa llega hasta el primer choque y lo marca, en PC (1280×720) y en móvil vertical (390×844).
- [x] Una prueba (unitaria, con la física real de `Sim` en lugar de E2E) sin viento: el primer contacto del proyectil queda a menos de 1 m de la marca, con 3 elevaciones y 3 fuerzas.
- [x] Con viento, la marca lo incluye (misma `aeroAccel`).
- Fuera de la tarea: equilibrio en difícil con un humano que usa la marca, no medido (el simulador de equilibrio solo tiene bots). Queda para la próxima prueba con personas.
- [x] FEAT-CONTROL-001 y ADR-016 al día. `perf.spec.ts`: ver Evidence.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Parada de la trayectoria en el primer choque con cajas orientadas |
| E2E | Distancia marca-impacto en el campo de pruebas; capturas en PC y móvil |

## Evidence

2026-09-28.
- `firstHit` (`shared/ballistics.ts`): recorre la trayectoria a 1/60 s y prueba cada tramo contra las cajas orientadas de los bloques (engordadas con el radio del proyectil, con un descarte previo por la caja que envuelve el arco) y contra el suelo (isla a 0 m o la lava, lo que esté más alto).
- `TrajectoryPreview` recibe del juego los bloques que se ven (`view.blocks.items`) y la altura de la lava. Hasta 64 puntos repartidos por longitud; anillo de 0,85 m, color del jugador sobre borde blanco, siempre por encima (sin prueba de profundidad): se ve aunque caiga detrás de un muro. De cara a quien dispara si da en un bloque; tumbado si da en el suelo.
- `tests/unit/aim-hit.test.ts`: 12 disparos reales con `Sim` (rey, muralla, torre y suelo; elevaciones 0,45, 0,75 y 1,05): distancia entre la marca y el primer contacto real, de 0,09 a 0,43 m.
- Capturas en 1280×720 y 390×844 (Chromium sin GPU): el arco completo y el anillo sobre el castillo rival.
- El texto de potencia y elevación sigue; lo quita WRK-TASK-061.
