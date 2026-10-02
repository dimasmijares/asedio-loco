---
id: WRK-TASK-060
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-10-02
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001, FEAT-CONTROL-001, PROD-JUGAR-001, DOC-OPS-003]
tags: [interfaz, diseno, revision]
---

# WRK-TASK-060 — Revisión de la interfaz con el artefacto de diseño

## Objective

Que el usuario revise la interfaz entera, pantalla a pantalla y en PC y móvil vertical, sobre un artefacto de diseño donde pueda comentar, y aprobar antes de implementarlas la marca de impacto (WRK-TASK-054) y los colores de los castillos (WRK-TASK-059).

## File Scope

- Artefacto de diseño (fuera del repositorio) con las capturas de la interfaz actual y las propuestas
- `tests/tools/` (herramienta de capturas de la interfaz, si se conserva)
- `specs/work/` (una tarea nueva por cada comentario que cambie la interfaz)

Fuera: código del juego. Esta tarea no cambia la interfaz; lo que salga de ella son tareas nuevas.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Las pantallas que existen: portada, cómo se juega, ajustes, solitario, sala, HUD, resultados, final |
| FEAT-CONTROL-001 | La vista previa actual y la propuesta |
| PROD-JUGAR-001 | El recorrido del jugador, para ordenar las pantallas |

- Criterio de revisión que pide el usuario: sin textos descriptivos donde no hacen falta, sin elementos poco cuidados, igual de cuidado en PC que en móvil vertical.
- Lienzo de diseño: https://claude.ai/artifact/RWP97U9aWmerrw9ibSeLxA (publicado el 28-09-2026). Filas: interfaz actual en PC (9 pantallas), en móvil vertical (9) y propuestas (parábola hasta el choque en PC y móvil, con marca «anillo» o «diana»; castillos del color del jugador con dos filas más, con palancas de saturación y claridad). Falta la pantalla de final de partida: la captura no terminó a tiempo sin GPU.
- Capturas hechas en local con Chromium sin GPU (28-09-2026): la luz y los colores del 3D se ven más apagados que en un móvil real; la interfaz (HTML) sí es fiel.

### Puntos de revisión (DOC-OPS-003)

| Punto | Pregunta | Tarea | Estado |
|---|---|---|---|
| R-01 | Marca de impacto: ¿anillo o diana? (la parábola ya está aprobada) | WRK-TASK-054 | Aprobado (28-09): anillo |
| R-02 | Colores de castillo por jugador: ¿apruebas los tonos? | WRK-TASK-059 | Aprobado (28-09): tonos por defecto del tablero |
| R-03 | Barra de munición en móvil: ¿apruebas las cartas por rareza y la tarjeta? | WRK-TASK-061 | Aprobado (28-09), con un arreglo: el botón de disparo y su anillo de % quedan por encima de la barra |
| R-04 | Barra de munición y panel de controles en PC | WRK-TASK-061 | En preparación |
| R-05 | Selector de castillos del espectador | WRK-TASK-073 | Aprobado (28-09) |
| R-06 | Portada: tipografía y título | WRK-TASK-062 | En preparación |
| R-07 | Flujo de partidas: ¿apruebas F1-F9? | WRK-TASK-064 | Aprobado (28-09): todas, a WRK-TASK-067-072 |
| R-08 | Ya en el juego: parábola con anillo y cámara del impacto | WRK-TASK-054, 063 | Aprobado (28-09) |
| R-09 | Castillos nuevos: dos filas más y colores de cada jugador | WRK-TASK-058, 059 | Aprobado (28-09) |
| R-10 | Nueva versión «Atardecer»: estilo (E1-E4), colores de jugador (D1), escena (D2) y UX (U1-U11) | Fase 1: WRK-TASK-074 a 076 | Aprobado (01-10); fase 1 en el juego (02-10) |

Decidido fuera del lienzo (28-09-2026): parábola hasta el choque, torreón dos filas más alto, objetivo deducido del rumbo.

## Acceptance Criteria

- [ ] Artefacto publicado con todas las pantallas en PC y móvil vertical, y las dos propuestas.
- [ ] El usuario ha dejado sus comentarios; cada uno es una tarea nueva de WRK-PLAN-011 o está descartado con motivo.
- [ ] Marca de impacto y colores de castillo aprobados (o ajustados) antes de WRK-TASK-054 y 059.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Revisión | El usuario, sobre el artefacto |

## Evidence

Pendiente.
