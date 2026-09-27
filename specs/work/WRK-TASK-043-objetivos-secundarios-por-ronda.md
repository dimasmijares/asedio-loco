---
id: WRK-TASK-043
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [DOM-JUEGO-001, DOM-JUEGO-003, FEAT-INTERFAZ-001, RULE-001, RULE-002]
dependencies:
  - id: WRK-TASK-041
    relation: depends-on
tags: [jugabilidad]
---

# WRK-TASK-043 — Objetivos secundarios por ronda

## Objective

Dar variedad a las decisiones de puntería con objetivos secundarios (romper el portón de hierro, la jaula de cristal, una torre entera…) que dan una recompensa.

## File Scope

- `shared/match.ts` (objetivos y recompensas)
- `client/src/game/match/host.ts` y `sim/sim.ts` (detección)
- `client/src/game/match/ui.ts` y `ui/hud.ts` (aviso y seguimiento)
- `shared/bot.ts` (los bots los tienen en cuenta)

## Implementation Notes

**Decisión del usuario al empezar:**

- a) **Munición mejor en la ronda siguiente** (recomendada): quien cumpla el objetivo recibe una carta rara o épica garantizada.
- b) **Reparación**: el castillo propio recupera unos bloques.
- c) **Solo reconocimiento**: aparece en las estadísticas del final.

El objetivo de la ronda se anuncia en el rótulo «RONDA N» y se marca en el castillo rival.

**Decisión del usuario (2026-09-27):** a) munición mejor en la ronda siguiente.

## Acceptance Criteria

- [x] Decisión del usuario anotada.
- [ ] Un objetivo por ronda, visible en PC y en móvil vertical.
- [ ] Los bots persiguen el objetivo con cierta probabilidad.
- [ ] Equilibrio medido antes y después.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unitaria | Detección de cada objetivo |
| Medición | Equilibrio |
| E2E | Aviso visible en los dos formatos |

## Evidence

Pendiente.
