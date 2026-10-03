---
id: WRK-TASK-085
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-03
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-CONTROL-001, FEAT-INTERFAZ-001, DOM-JUEGO-002]
dependencies:
  - id: WRK-TASK-084
    relation: depends-on
tags: [punteria, interfaz, viento, fallo]
---

# WRK-TASK-085 — La parábola no coincidía con la marca de apuntado

## Objective

Fallo que vio el usuario el 03-10-2026: al apuntar, una marca señalaba un sitio y, al mantener el botón de disparo, la parábola se iba a otro (hacia la izquierda en su partida); el disparo sí seguía la parábola. Se espera que la marca, la parábola y el impacto real señalen el mismo punto, con y sin viento.

## Diagnosis

Se comprobaron las dos hipótesis del usuario, y no eran la causa:

- **El viento:** la parábola y la física usan la misma fórmula (`aeroAccel`), con el mismo viento. En vuelo libre se separan 3 cm a los 0,5 s y 13 cm a los 2 s, con y sin viento. Con el viento más fuerte del juego (7,5 m/s), la desviación es de menos de 1 m a 60 m y la marca de impacto ya la incluía.
- **La cámara de la bandeja** (fase 2): al cargar no cambian ni la puntería ni la cámara, y el desplazamiento de la imagen (`setViewOffset`) mueve todo el dibujo a la vez.

**Causa:** mientras se apunta, sin cargar, no había ninguna marca de puntería; la única marca a la vista era la **diana blanca y roja del objetivo secundario** (WRK-TASK-043), clavada en un bloque al azar de una torre rival. Parecía una mira y no tenía nada que ver con dónde iba el disparo. El anillo de impacto del color del jugador solo salía al cargar, porque antes no se sabe la fuerza.

## Decision

Del usuario (03-10-2026): «Diana distinta + anillo» y quitar el viento (ADR-018).

## File Scope

- `client/src/game/aim.ts` (`TrajectoryPreview`: anillo también al apuntar, `GUIDE_POWER`, `hit`), `client/src/game/view.ts` (chincheta del objetivo)
- `shared/match.ts`, `shared/map.ts` (sin viento), `client/src/ui/hud.ts`, `client/src/ui/icons.ts`, `client/src/ui/lobby.ts`, `client/src/ui/style.css`, `client/src/game/match/ui.ts`, `client/src/game/modes/sandbox.ts` (sin chip ni avisos del viento)
- `tests/e2e/marca.spec.ts`, `tests/e2e/hud-compact.spec.ts`, `tests/unit/match.test.ts`, `tests/tools/ui-shots.mjs`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-CONTROL-001 | Vista previa: lo que se ve es lo que pasa (ADR-016) |
| FEAT-INTERFAZ-001 | Objetivo secundario visible en la escena y en su chip |
| DOM-JUEGO-002 | Regla del viento |

- **Anillo al apuntar:** sin cargar, el tramo corto de siempre y, además, el anillo de impacto donde caería un disparo con la fuerza de la guía (55 %). Al cargar, el anillo avanza por la misma línea con la fuerza real hasta donde cae el disparo.
- **Chincheta del objetivo:** la diana plana pasa a ser un sprite con la diana del chip del objetivo (círculo noche, borde naranja, diana crema) y una punta larga hasta el bloque, así la cabeza flota sobre la torre y no se confunde con el anillo hueco del jugador.
- **Sin viento:** `wind` a cero en todas las rondas; fuera el chip, el aviso de la ronda 6 y la mención en «Cómo se juega». La física y la parábola lo siguen admitiendo (el campo de pruebas y la prueba lo ponen a mano).

## Acceptance Criteria

- [x] Al apuntar se ve el anillo de impacto, y coincide con el de la parábola al cargar con la misma fuerza.
- [x] El impacto real cae donde marcan, sin viento y con viento (menos de 0,15 m en la prueba).
- [x] La marca del objetivo no se parece al anillo de puntería.
- [x] No sopla el viento en ninguna ronda.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/marca.spec.ts`: en el campo de pruebas, en móvil vertical y en PC, contra la muralla y la torre, sin viento y con 4,6 m/s puestos a mano: anillo al apuntar = anillo de la parábola, y primer choque del pedrusco a menos de 1,2 m (medido: menos de 0,15 m) |
| Unit | `tests/unit/match.test.ts` («no sopla el viento en ninguna ronda») |

## Evidence

2026-10-03. `marca.spec.ts` en verde en los dos formatos. Un tiro bombeado que roza el borde de una almena puede tocarla en la parábola y no en la física (o al revés): unos centímetros de vuelo deciden el roce. La prueba usa tiros tensos para no medir eso.
