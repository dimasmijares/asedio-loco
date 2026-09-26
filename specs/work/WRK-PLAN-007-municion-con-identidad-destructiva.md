---
id: WRK-PLAN-007
type: spec
layer: work-plan
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-SPEC-007
activates: [DOM-JUEGO-003, FEAT-SENSACION-001, FEAT-BOTS-001, RULE-001, RULE-004]
dependencies: []
tags: [municion, equilibrio, sensacion]
---

# WRK-PLAN-007 — Munición con identidad destructiva

## Approach

Primero se mide la firma de cada munición, para comprobar que cada cambio da la identidad buscada y no solo más bloques rotos. Después se arreglan las explosiones, que son la base de la vaca, la sandía y los huevos de la gallina. Luego van las municiones una a una o por parejas, y al final la sensación, los bots y el equilibrio de toda la partida. Cada tarea se despliega por separado con CI en verde.

## Estado

| Orden | Tarea | Estado | Dependencias | Entrega |
|---:|---|---|---|---|
| 1 | WRK-TASK-026 · Firma de cada munición en la prueba de destrozo | completed | — | Dispersión, altura, piedra rota y objetivos por munición |
| 2 | WRK-TASK-027 · Explosiones que rompen piedra: vaca y sandía | completed | 026 | Vaca cráter y sandía carga de demolición |
| 3 | WRK-TASK-028 · Gallina bombardera | active | 027 | Botes que se quedan en el castillo y huevos que explotan |
| 4 | WRK-TASK-029 · Comunes: tronco apisonadora y cocos metralla | draft | 026 | Tronco que barre la base y 6 cocos que rompen |
| 5 | WRK-TASK-030 · Piano perforador | draft | 026 | Atraviesa pisos y remata con una onda en el suelo |
| 6 | WRK-TASK-031 · Épicas: agujero negro, imán con retroceso y alud | draft | 027 | Tres épicas en 18-26 bloques con firmas distintas |
| 7 | WRK-TASK-032 · Sensación propia de cada munición | draft | 027-031 | Temblor según destrozo, efectos, sonidos y textos |
| 8 | WRK-TASK-033 · Bots y equilibrio final | draft | 027-032 | Bots que usan cada munición a su manera; partida medida |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Partidas demasiado cortas | high | medium | Se mide en cada tarea; se decide con el usuario (castillos, lava o aceptarlo) |
| Una munición mata al rey de un golpe | medium | high | Límite de 3 de 12 en la prueba de destrozo |
| Más cuerpos y partículas bajan los FPS en móvil | medium | medium | Topes de fragmentos y banco en 028, 029 y 031 (RULE-004) |
| Cambios de física que rompen las E2E de física | medium | low | Grupo `fisica` de CI; se ajustan las escenas afectadas |
| Mediciones que bailan | high | low | 12 disparos por munición (con 6 bailaba ±1,5) |

## Evidence

Pendiente.
