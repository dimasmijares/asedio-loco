---
id: WRK-TASK-026
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
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

- [x] La prueba saca rotos, movidos, reyes, dispersión, altura, piedra y hierro rotos y fila baja por munición.
- [x] `destrozo.txt` actualizado como línea base.
- [x] Objetivos de WRK-SPEC-007 escritos en DOM-JUEGO-003.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

- `tests/balance/destrozo.test.ts` saca por munición: rotos, movidos, reyes, dispersión (m), altura (m), fila baja y piedra o hierro rotos, y marca con «!» lo que queda fuera de la franja. Tarda unos 45 s con `SHOTS=12`.
- Línea base (12 disparos) en `destrozo.txt` y en `DOM-JUEGO-003`: solo el pedrusco está en su franja. La sandía no rompe ni una piedra (0,0) y la vaca 0,8: confirma que las explosiones no fracturan piedra.
- Sin cambios de física: el equilibrio no cambia.
