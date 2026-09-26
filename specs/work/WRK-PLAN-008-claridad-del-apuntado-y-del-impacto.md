---
id: WRK-PLAN-008
type: spec
layer: work-plan
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-SPEC-008
activates: [FEAT-CAMARA-001, FEAT-INTERFAZ-001, RULE-004]
dependencies: []
tags: [claridad, camara, graficos, movil]
---

# WRK-PLAN-008 — Claridad del apuntado y del impacto

## Approach

Tres tareas independientes y en serie, de menor a mayor alcance visual. Cada una se prueba en escritorio y en móvil vertical, y se despliega por separado con CI en verde.

## Estado

| Orden | Tarea | Estado | Dependencias | Entrega |
|---:|---|---|---|---|
| 1 | WRK-TASK-034 · El castillo propio no tapa la vista al apuntar | completed | — | Desvanecido por tramado de los bloques cercanos a la cámara |
| 2 | WRK-TASK-035 · Plano general que encuadra todos los castillos en cualquier pantalla | completed | — | `Director.frame` con los dos ejes del campo de visión |
| 3 | WRK-TASK-036 · Daño de la ronda sobre cada castillo | completed | — | Número flotante con los bloques perdidos |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| El tramado se ve ruidoso | medium | low | Patrón ordenado de 4×4 y transición de 3 m |
| El plano en vertical queda demasiado lejos | medium | medium | Cámara más alta en vertical; capturas en los dos formatos |
| Los números tapan la acción | low | medium | Aparecen al terminar el impacto y se desvanecen en 2,5 s |

## Evidence

Las 3 tareas están completadas y subidas a `main`, cada una comprobada en escritorio (1280×720) y en móvil vertical (390×844) con capturas y pruebas E2E. `encuadre.spec.ts` entra en el grupo `basicas` de CI. Queda que el usuario lo pruebe.
