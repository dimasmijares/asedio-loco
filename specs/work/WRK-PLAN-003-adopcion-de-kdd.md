---
id: WRK-PLAN-003
type: spec
layer: work-plan
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-SPEC-003
activates: [DOC-OPS-001, DOC-OPS-002, ARCH-001, RULE-003]
dependencies: []
tags: [kdd, proceso]
---

# WRK-PLAN-003 — Adopción de KDD

## Approach

El agente principal montó el andamiaje y el protocolo. Siete subagentes trabajaron en paralelo, cada uno en sus propios archivos:

- arquitectura y pruebas;
- reglas del juego y recorrido del jugador;
- funcionalidades;
- ADR y reglas de trabajo;
- trabajo histórico y pendientes;
- agentes y comandos de `.claude/`;
- el puerto a Node de la previsión de presupuesto.

Todos partían del mismo catálogo de IDs, así que se enlazaron sin esperar unos a otros. Al final, el agente principal integró el conjunto:

- las reglas pasaron a ser el destino de `constrained-by` y dejaron de apuntar a nada, para que el grafo no tenga ciclos;
- los hallazgos de la revisión se convirtieron en tareas (017-021);
- `CLAUDE.md` quedó reducido a entorno y comandos;
- los documentos anteriores se marcaron como histórico.

## Estado final

| Orden | Tarea | Estado | Dependencias | Entrega |
|---:|---|---|---|---|
| 1 | WRK-TASK-001 | completed | — | CLI, plantillas, `scripts/kdd.mjs`, `scripts/budget.mjs`, scripts npm, CI y `.claude/` |
| 2 | WRK-TASK-002 | completed | 001 | 5 ARCH, 4 DOM, 1 PROD, 8 FEAT y 2 DOC |
| 3 | WRK-TASK-003 | completed | 001 | ADR-001 a ADR-012 y RULE-001 a RULE-004 |
| 4 | WRK-TASK-004 | completed | 002, 003 | Trabajo histórico, móviles, pendientes, `AGENTS.md` y `CLAUDE.md` |

## Evidence

- `npm run kdd:check`: todo en orden (grafo, huérfanos y ciclo de vida).
- `npm run verify` en verde y CI de despliegue en verde, con el paso KDD antes de desplegar. Ver el commit «KDD: especificaciones como fuente de verdad» en `git log`.
