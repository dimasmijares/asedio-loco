---
id: WRK-SPEC-003
type: spec
layer: work-spec
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
activates:
  - DOC-OPS-001
  - DOC-OPS-002
  - ARCH-001
  - RULE-003
tags: [kdd, proceso, documentacion]
---

# WRK-SPEC-003 — Adopción de KDD

## Problem Statement

El proyecto empezó como desarrollo guiado por un único prompt (`PROMPT_asedio_loco.md`) y ha crecido con planes sucesivos (`PLAN.md`, `docs/MOVILES.md`), 65 decisiones en `DECISIONES.md` y un `CLAUDE.md` que mezcla estado, arquitectura, protocolo, pruebas y limitaciones. El usuario dice que empieza a ser difícil seguir qué especificaciones están desarrolladas y cuáles quedan pendientes.

## Proposed Change

Adoptar Knowledge-Driven Development con lo que ha funcionado en `rag-docs`, adaptado a un proyecto de una persona que despliega desde `main`. El usuario pidió no perder agilidad y ganar orden.

**In scope:**

- Andamiaje:
  - `tools/spec-graph` (Node) y las plantillas;
  - `scripts/kdd.mjs` (la puerta y los pendientes) y `scripts/budget.mjs`;
  - los scripts npm y el paso de CI;
  - los agentes y comandos de `.claude/`.
- Conocimiento base: arquitectura, reglas del juego, recorrido del jugador, funcionalidades, pruebas y protocolo.
- Gobierno: los ADR de las decisiones que siguen vigentes y 4 reglas de trabajo.
- Trabajo: el histórico en `archived`, la entrega de móviles con M2-M5 pendientes y los pendientes conocidos.
- `AGENTS.md` y un `CLAUDE.md` más corto, que remiten a `specs/`.

**Out of scope:**

- Cambios en el juego.
- Migrar `DECISIONES.md` entero a ADR: se queda como histórico y solo pasan las decisiones vigentes.
- La teoría del método (`foundation/`, `docs/` del pack) y la PR por tarea de `rag-docs`: no aportan a un proyecto de una persona.

## Knowledge Context

| Spec | Why it applies |
|------|----------------|
| DOC-OPS-002 | Es el protocolo que esta adopción introduce |
| DOC-OPS-001 | Las pruebas y herramientas que la puerta `verify` encadena |
| ARCH-001 | El despliegue continuo en el que entra `kdd:check` |
| RULE-003 | Cómo se cierra una etapa: CI en verde en producción |

## Constraints

- No romper el flujo actual: commits a `main`, CI despliega y prueba contra producción.
- Todo en español, con el estilo del proyecto.

## Acceptance Criteria

- [x] `npm run kdd:check` pasa en local y en CI, y bloquea el despliegue si falla.
- [x] `npm run kdd:pendientes` responde qué queda pendiente sin leer ningún otro documento.
- [x] Cada módulo de `CLAUDE.md` (arquitectura, protocolo, pruebas, limitaciones) tiene su especificación.
- [x] `PLAN.md`, `DECISIONES.md` y `docs/MOVILES.md` remiten a `specs/` y se conservan como histórico.

## Evidence

Ver `WRK-PLAN-003`.
