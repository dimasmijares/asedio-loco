---
id: WRK-PLAN-009
type: spec
layer: work-plan
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-SPEC-009
activates: [DOM-JUEGO-004, FEAT-INTERFAZ-001, ARCH-005, RULE-004]
dependencies: []
tags: [castillos, movil, graficos, rendimiento]
---

# WRK-PLAN-009 — Castillos, horizontal, gráficos y rendimiento

## Approach

Primero los castillos, porque cambian el coste de la física y el equilibrio del que parten las demás tareas. Después el horizontal y la mejora gráfica, y por último las tareas de rendimiento de WRK-PLAN-004 y WRK-PLAN-005 (013, 008 y 016, en ese orden: 013 prepara a 008). Cada tarea se despliega por separado con CI en verde.

## Estado

| Orden | Tarea | Estado | Dependencias | Entrega |
|---:|---|---|---|---|
| 1 | WRK-TASK-037 · Castillos de 176 bloques con forro interior | completed | — | Forro, munición reajustada, protocolo v7 |
| 2 | WRK-TASK-038 · Modo horizontal en móvil | completed | — | HUD y cámara revisados en horizontal |
| 3 | WRK-TASK-039 · Mejora gráfica: grietas en los bloques dañados | completed | — | Una mejora visible en PC y móvil |

Después: WRK-TASK-013, WRK-TASK-008 y WRK-TASK-016.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Más bloques encarecen la física | high | medium | Banco antes y después; presupuesto de 16 ms |
| El reajuste de munición deja alguna fuera de su franja | medium | low | Prueba de destrozo con 12 disparos |

## Evidence

Pendiente.
