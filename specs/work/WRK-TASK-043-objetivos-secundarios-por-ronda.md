---
id: WRK-TASK-043
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
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
- `shared/ammo.ts` (`drawAmmo` por rarezas), `shared/protocol.ts` (`PROTOCOL_VERSION` 9), `client/src/game/view.ts` (dianas), `client/src/ui/lobby.ts`, `client/src/ui/style.css`
- `tests/unit/goals.test.ts`, `tests/e2e/solo.spec.ts`, `tests/balance/` (rondas con el objetivo cumplido)

## Implementation Notes

**Decisión del usuario al empezar:**

- a) **Munición mejor en la ronda siguiente** (recomendada): quien cumpla el objetivo recibe una carta rara o épica garantizada.
- b) **Reparación**: el castillo propio recupera unos bloques.
- c) **Solo reconocimiento**: aparece en las estadísticas del final.

El objetivo de la ronda se anuncia en el rótulo «RONDA N» y se marca en el castillo rival.

**Decisión del usuario (2026-09-27):** a) munición mejor en la ronda siguiente.

## Acceptance Criteria

- [x] Decisión del usuario anotada.
- [x] Un objetivo por ronda, visible en PC y en móvil vertical.
- [x] Los bots persiguen el objetivo con cierta probabilidad.
- [x] Equilibrio medido antes y después.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unitaria | Detección de cada objetivo |
| Medición | Equilibrio |
| E2E | Aviso visible en los dos formatos |

## Evidence

2026-09-28. Decisión del usuario: a) munición mejor en la ronda siguiente. Regla en DOM-JUEGO-001 (10c) y DOM-JUEGO-003 (4b); decisión en ADR-015.

- Detección: `Sim.stats.broken` apunta cada bloque rival roto con quién lo rompió, su pieza, su material y su grupo (cada torre y cada jaula por separado). La pieza sale del id del bloque, así que vale tras una migración. El anfitrión cuenta al acabar el impacto y deja `goalDone`; `startRound` reparte la carta de premio y sortea el objetivo nuevo.
- Primera versión: «4 bloques de torre» sin agrupar lo cumplían los cuatro jugadores en la ronda 1 sin buscarlo. Ahora se cuenta por torre y por jaula.
- Equilibrio, 12 partidas por dificultad (antes, las medidas de WRK-TASK-052). Rondas: fácil 10,3 → 10,3; normal 8,9 → 9,5 / 9,8; difícil 7,9 → 8,7. Alguien cumple el objetivo en 32 de 123 rondas en fácil, 34-36 de 114-117 en normal y 36 de 104 en difícil. En normal, por tipo (rondas y jugadores): torre 10 y 13, hierro 14 y 16, jaula 10 y 14.
- Capturas con GPU en 1280×720 y 390×844: el rótulo de la ronda con el objetivo, la chapa, las dianas en los castillos rivales y la línea de los resultados. En vertical la chapa invadía el panel de la ronda (`hud-compact` lo detectó en 360, 390 y 412 px de ancho): ahora es más estrecha y parte en dos líneas.
- `tests/unit/goals.test.ts` comprueba el sorteo determinista de los tres tipos, que cada objetivo se pueda cumplir y tenga punto de mira, y la carta de premio rara o épica. `solo.spec.ts` comprueba la chapa y las dianas. `hud-compact` (7), `solo`, `espectador` y `tutorial` en verde; `npm run verify`, 47 unitarios.

