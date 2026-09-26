---
id: ADR-012
type: adr
layer: governance
status: accepted
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
deciders:
  - dimas
dependencies:
  - id: DOC-OPS-002
    relation: implements
  - id: DOC-OPS-001
    relation: implements
supersedes: null
tags:
  - proceso
  - kdd
---

# ADR-012 — Especificaciones KDD como fuente de verdad, con el proceso de `rag-docs` y sin PR por tarea

## Context

El proyecto nació de un único prompt y creció con planes sucesivos, 65 decisiones en `DECISIONES.md` y un `CLAUDE.md` que lo mezclaba todo. Tras varias rondas de mejoras, el usuario no podía seguir qué estaba especificado y hecho y qué quedaba pendiente. Había dos versiones de KDD a mano: el pack genérico (`kdd-pack-2026-05-19`) y la adaptación ya probada en `rag-docs`.

## Decision

- `specs/` es la fuente de verdad: conocimiento (ARCH, DOM, PROD, FEAT, DOC), gobierno (ADR, RULE) y trabajo (WRK-SPEC → WRK-PLAN → WRK-TASK).
- Del pack se toman la CLI `spec-graph` (Node), las plantillas y los agentes y comandos `/spec-*`, traducidos. La teoría del método y sus ejemplos de otros sectores se quedan fuera.
- De `rag-docs` se toman:
  - el protocolo de iteración (`DOC-OPS-002`);
  - la comprobación del ciclo de vida y la puerta única (`npm run verify`);
  - `/release-loop` y la previsión de presupuesto (`npm run budget`, portada a Node);
  - la orquestación con subagentes.
- No se usa una PR por tarea: una tarea son commits en `main` y se cierra con CI en verde. Las ramas y los worktrees solo se usan para dos tareas en paralelo.
- Los cambios rápidos (menos de una hora, sin comportamiento nuevo ni decisiones) no llevan tarea.
- `PROMPT_asedio_loco.md`, `PLAN.md`, `DECISIONES.md` y `docs/MOVILES.md` se congelan como histórico. Solo pasan a ADR las decisiones que siguen vigentes (ADR-001 a ADR-011).

## Consequences

- Lo pendiente se consulta con `npm run kdd:pendientes`, y CI no despliega si el grafo o el ciclo de vida están rotos.
- Cada tarea cuesta un poco más de escritura (File Scope, criterios, Evidence) a cambio de saber siempre qué se hizo y por qué.
- `CLAUDE.md` queda como guía de entorno y comandos; la arquitectura, el protocolo y las limitaciones viven en las especificaciones.
- Riesgo: que las especificaciones se queden atrás respecto al código. La consolidación al cerrar cada tarea y cada entrega es lo que lo evita.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Seguir con `PLAN.md` y `DECISIONES.md` | Es justo lo que se había vuelto difícil de seguir |
| El pack genérico tal cual | Trae teoría y ejemplos ajenos, y no tiene el protocolo probado en un proyecto real |
| `rag-docs` tal cual, con PR por tarea | Resta agilidad en un proyecto de una persona que ya despliega desde `main` con E2E contra producción |
| Migrar las 65 decisiones a ADR | Muchas están superadas; convertirlas añadiría ruido sin ayudar a decidir |

## Knowledge Impact

- Nuevas: `DOC-OPS-002`, `AGENTS.md`, `specs/README.md`, `scripts/kdd.mjs` y `scripts/budget.mjs`.
- `DOC-OPS-001` gana `npm run verify` y `npm run kdd:check`.
- `CLAUDE.md` se reduce y remite a `specs/`.

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Decided in | Conversación con el usuario, 2026-09-26 | «No quiero perder agilidad pero sí mejorar el orden» |
| Implemented in | `WRK-SPEC-003` | La adopción |
