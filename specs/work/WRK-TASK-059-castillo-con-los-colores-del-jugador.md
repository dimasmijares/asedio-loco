---
id: WRK-TASK-059
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [DOM-JUEGO-004, FEAT-INTERFAZ-001, ARCH-005]
dependencies:
  - id: WRK-TASK-058
    relation: depends-on
  - id: WRK-TASK-060
    relation: depends-on
tags: [graficos, castillos]
---

# WRK-TASK-059 — Castillo con los colores del jugador

## Objective

Que cada castillo se reconozca por el color de su jugador: la piedra en un tono oscuro y la madera en un tono claro de ese color; el cristal y el hierro quedan neutros, para que el material se siga leyendo.

## File Scope

- `client/src/game/render/` (color por instancia de los bloques y de los fragmentos al romperse)
- `shared/players.ts` (`PLAYER_STYLES`: tonos derivados para piedra y madera)
- `shared/materials.ts` solo si el color base se separa del tinte
- `tests/e2e/` (capturas)
- `specs/domain/DOM-JUEGO-004-castillos-isla-y-materiales.md`, `specs/feature/FEAT-INTERFAZ-001-hud-portada-tutorial-ajustes.md`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| DOM-JUEGO-004 | El color del material deja de ser fijo; la resistencia no cambia |
| FEAT-INTERFAZ-001 | El color del castillo coincide con el del marcador y la bandera |
| ARCH-005 | Sin coste en fps: color por instancia, sin materiales nuevos por jugador |

- Decisión del usuario (28-09-2026): piedra y madera teñidas; cristal y hierro neutros. Los tonos exactos se aprueban en el artefacto de diseño (WRK-TASK-060) antes de tocar el juego.
- Los fragmentos y el polvo de un bloque roto conservan su tono, para que se vea de quién es cada trozo.
- Comprobar contraste con la lava (el jugador rojo o naranja no debe confundirse con ella) y con la luz aprobada en WRK-TASK-053.

## Acceptance Criteria

- [ ] Cada castillo se ve con los tonos aprobados en el diseño, en calidad alta y baja.
- [ ] Los trozos rotos conservan el tono de su castillo.
- [ ] `perf.spec.ts` dentro del presupuesto.
- [ ] Capturas en PC y móvil vertical, aprobadas por el usuario.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Capturas | Plano general y castillo de cerca, 4 jugadores |
| E2E | `perf.spec.ts` |

## Evidence

Pendiente.
