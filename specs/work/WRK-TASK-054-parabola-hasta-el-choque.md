---
id: WRK-TASK-054
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
- Mientras se apunta sin cargar (`guide`), el tramo corto de ahora se mantiene; al cargar (`charge`), el arco completo. La marca es un anillo en el suelo o en la cara del bloque, del color del jugador. Su aspecto se aprueba en WRK-TASK-060.
- Más puntos (hoy 26) o un tubo fino, para que el arco largo no quede a trozos.

## Acceptance Criteria

- [ ] Al cargar, la vista previa llega hasta el primer choque y lo marca, en PC (1280×720) y en móvil vertical (390×844).
- [ ] Una E2E en el campo de pruebas, sin viento: el primer contacto del proyectil queda a menos de 1 m de la marca, con 3 elevaciones y 3 fuerzas.
- [ ] Con viento, la marca lo incluye (misma `aeroAccel`).
- [ ] Equilibrio en difícil con un humano simulado que usa la marca: anotado; si los bots pierden siempre, tarea nueva.
- [ ] FEAT-CONTROL-001 y la ADR nueva al día; `perf.spec.ts` dentro del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Parada de la trayectoria en el primer choque con cajas orientadas |
| E2E | Distancia marca-impacto en el campo de pruebas; capturas en PC y móvil |

## Evidence

Pendiente.
