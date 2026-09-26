---
id: WRK-PLAN-005
type: spec
layer: work-plan
scope: ephemeral
status: active
confidence: medium
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-SPEC-005
activates:
  - ARCH-003
  - ARCH-005
  - FEAT-REPLAY-001
  - DOC-OPS-001
tags:
  - pendientes
  - limitaciones
---

# WRK-PLAN-005 — Pendientes conocidos

## Approach

Tareas independientes entre sí y pequeñas. Salen de «Limitaciones conocidas» de `CLAUDE.md` (010-016) y de la revisión del código al adoptar KDD (017-021). No tienen un orden obligatorio: se eligen cuando haya hueco entre etapas de otros planes. Cada una cierra quitando su punto de `CLAUDE.md`.

Orden recomendado, de más barato o más útil a menos:

1. **WRK-TASK-015** (README): es un cambio de texto y hoy el README promete algo que no pasa.
2. **WRK-TASK-013** (topes al cambiar calidad): pequeño y ayuda a WRK-TASK-008, porque la calidad adaptativa del móvil cambia la calidad en plena partida.
3. **WRK-TASK-010** (jugador desconectado → bot): el hueco más visible en partidas reales con amigos.
4. **WRK-TASK-014** (medir en gráfica integrada): no cambia código, pero depende de tener el equipo.
5. **WRK-TASK-012** (estadísticas con migración) y **WRK-TASK-011** (repetición por lava): mejoran casos poco frecuentes.
6. **WRK-TASK-016** (Rapier en la portada): útil sobre todo con datos móviles.
7. **WRK-TASK-019**, **WRK-TASK-018** y **WRK-TASK-020**: fallos pequeños de red y de marcador encontrados al revisar el código. La 019 conviene antes de las pruebas en móvil.
8. **WRK-TASK-017** (restos del control y la cámara antiguos): limpieza, se puede juntar con la 015.
9. **WRK-TASK-021** (equilibrio del imán): necesita una decisión del usuario.

## Task Breakdown

| Task | Objective | Depends on | Size |
|------|-----------|------------|------|
| WRK-TASK-010 | Un jugador desconectado en plena partida pasa a ser un bot | — | M |
| WRK-TASK-011 | Repetición también para los reyes que se lleva la lava | — | M |
| WRK-TASK-012 | Estadísticas completas si el anfitrión se va en el impacto | — | M |
| WRK-TASK-013 | Topes de partículas y fragmentos al cambiar la calidad en partida | — | S |
| WRK-TASK-014 | Medir el rendimiento en una gráfica integrada | — | S |
| WRK-TASK-015 | README sin la cámara lenta en directo | — | S |
| WRK-TASK-016 | La portada no descarga Rapier para el fondo | — | S |
| WRK-TASK-017 | Restos del control y la cámara antiguos | — | S |
| WRK-TASK-018 | Un estado completo viejo no aplica bloques ni poses | — | S |
| WRK-TASK-019 | Un espectador que pasa a jugador conserva si es móvil | — | S |
| WRK-TASK-020 | El marcador muestra quién está desconectado | — | S |
| WRK-TASK-021 | Equilibrio del imán, el tronco y la gallina | — | M |

## Estado

| Orden | Tarea | Estado | Dependencias | Entrega |
|---|---|---|---|---|
| 1 | WRK-TASK-015 · README sin cámara lenta en directo | completed | — | Hecho el 26-09-2026 |
| 2 | WRK-TASK-013 · Topes al cambiar calidad | draft | — | — |
| 3 | WRK-TASK-010 · Desconectado pasa a bot | draft | — | — |
| 4 | WRK-TASK-014 · Medir en gráfica integrada | draft | — | — |
| 5 | WRK-TASK-012 · Estadísticas con migración | draft | — | — |
| 6 | WRK-TASK-011 · Repetición por lava | draft | — | — |
| 7 | WRK-TASK-016 · Rapier fuera de la portada | draft | — | — |
| 8 | WRK-TASK-019 · Espectador promovido conserva `mobile` | completed | — | Hecho el 26-09-2026 |
| 9 | WRK-TASK-018 · `full` viejo sin efecto | completed | — | Hecho el 26-09-2026 |
| 10 | WRK-TASK-020 · Desconectados en el marcador | completed | — | Hecho el 26-09-2026 |
| 11 | WRK-TASK-017 · Restos del control y la cámara | completed | — | Hecho el 26-09-2026 |
| 12 | WRK-TASK-021 · Equilibrio del imán | completed | — | Hecho el 26-09-2026 |

## Architecture Impact

| Area | Impact | Spec affected |
|------|--------|---------------|
| Partida en red | El anfitrión trata a un jugador desconectado como bot | ARCH-003 |
| Migración | Las estadísticas de la ronda viajan en el estado para sobrevivir al relevo | ARCH-003 |
| Repetición | La fase `replay` puede abrirse también al empezar la ronda | none |
| Vista | `Debris` y `Fx` aceptan cambiar su tope en caliente | ARCH-005 |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Un bot toma el castillo de alguien que solo recargaba | medium | medium | Margen antes de pasar a bot y devolverle el control al reconectar |
| Cambios en `MatchState` rompen clientes con la versión anterior | low | medium | Subir `PROTOCOL_VERSION` (RULE-002) |
| No hay gráfica integrada a mano para medir | medium | low | Dejar la tarea en draft; la calidad adaptativa cubre el caso mientras tanto |

## Dependencies

- Un portátil con gráfica integrada — dimas — para WRK-TASK-014.
- Decisión sobre el margen de reconexión antes de pasar a bot — dimas — para WRK-TASK-010.
- Decisión sobre el equilibrio del imán — dimas — para WRK-TASK-021.
