---
id: WRK-TASK-026
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001]
tags: [municion, equilibrio]
---

# WRK-TASK-026 — Firma de cada munición en la prueba de destrozo

## Objective

Medir, además de rotos, movidos y reyes, **dónde** destroza cada munición, para comprobar su identidad: dispersión horizontal del daño (m), altura media y mínima de los bloques rotos, piedra y hierro rotos, y bloques de la fila baja afectados. Fijar los objetivos de WRK-SPEC-007 en la prueba.

## File Scope

- `tests/balance/destrozo.test.ts` y `destrozo.txt`
- `specs/domain/DOM-JUEGO-003-municion.md` (tabla de objetivos)

## Implementation Notes

Sin cambios de física. La prueba sigue sin navegador. Se imprime una línea por munición y un aviso si queda fuera de su franja.

## Acceptance Criteria

- [ ] La prueba saca rotos, movidos, reyes, dispersión, altura, piedra y hierro rotos y fila baja por munición.
- [ ] `destrozo.txt` actualizado como línea base.
- [ ] Objetivos de WRK-SPEC-007 escritos en DOM-JUEGO-003.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

Pendiente.
