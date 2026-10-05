---
id: WRK-TASK-091
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: high
version: 0.1.0
created: 2026-10-05
updated: 2026-10-05
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-SALAS-001, ARCH-003]
dependencies:
  - id: WRK-TASK-070
    relation: depends-on
tags: [sala, interfaz, nombres]
---

# WRK-TASK-091 — Nombres de hasta 20 letras

## Objective

Corrección del usuario (05-10-2026): el nombre guardado se cortaba en 16 letras («Marquesa Tortill») y el nombre corto de los chips salía a medias («Tortill»). Se permiten 20 letras y se recorta solo a la vista, con «…», donde no quepa.

## File Scope

- `shared/protocol.ts` (`MAX_NAME_LEN`), `shared/players.ts`, `client/src/ui/lobby.ts` (título de la sala), `client/src/ui/flujo.css`, `client/src/ui/style.css` (chips del marcador)
- `tests/unit/protocol.test.ts`, `tests/unit/players.test.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-SALAS-001 | Nombre saneado a 20 caracteres |
| ARCH-003 | `sanitizeName` en el servidor y en el cliente |

- `MAX_NAME_LEN` pasa de 16 a 20: lo usan el servidor, el campo de la portada y el de la sala. Sin subir `PROTOCOL_VERSION`: el servidor sanea y todos ven el mismo nombre.
- El nombre corto (`shortName`) ya era la palabra completa; con 20 letras «Marquesa Tortilla» queda entera y su nombre corto es «Tortilla».
- Chips del marcador en móvil vertical: hasta 112 px con tres jugadores o menos (como en las maquetas de R-15), para que el nombre corto quepa entero también con la cruz de eliminado; con cuatro siguen en 86 px.
- Donde no cabe, «…» por CSS: plazas de la sala, hoja de resultados, chips, tarjetas del espectador y, nuevo, el título «Sala de <nombre>» de PC (en una línea). En la pantalla final el nombre va completo (R-15 F5).

## Acceptance Criteria

- [x] «Marquesa Tortilla» se guarda entera y su nombre corto es «Tortilla» (`players.test.ts`, `protocol.test.ts`).
- [x] Un nombre de 20 letras cabe o se recorta con «…» en la sala, en móvil y en PC (revisión de capturas).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | `protocol.test.ts` (20 caracteres), `players.test.ts` (nombre corto) |
| Revisión | Sala con «Marquesa Tortilla» en el tablero «Correcciones de flujo · en el juego» |

## Evidence

2026-10-05. Unitarios en verde; sala con «Baronesa Tortillitas» (20 letras) y «Marquesa Tortilla» en local, en móvil y en PC.
