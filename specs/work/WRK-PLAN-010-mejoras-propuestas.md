---
id: WRK-PLAN-010
type: spec
layer: work-plan
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-SPEC-010
activates: [DOM-JUEGO-001, FEAT-INTERFAZ-001, FEAT-SENSACION-001, ARCH-005, RULE-001, RULE-004]
dependencies: []
tags: [jugabilidad, interfaz, graficos, rendimiento]
---

# WRK-PLAN-010 — Mejoras propuestas tras WRK-PLAN-009

## Approach

Orden sugerido: primero las mejoras pequeñas y seguras, que dan resultado visible pronto; después las que necesitan una decisión del usuario, y al final las de mayor alcance. El usuario puede reordenar. Una sola tarea activa a la vez (DOC-OPS-002); cada una se despliega por separado con CI en verde.

Para empezar en una sesión nueva: `npm run kdd:pendientes`, elegir la primera tarea lista, pasarla a `active` y `npm run kdd -- context WRK-TASK-0NN`.

## Estado

| Orden | Tarea | Estado | Dependencias | Entrega |
|---:|---|---|---|---|
| 1 | WRK-TASK-044 · Equilibrio del pedrusco contra el rey | completed | — | 2026-09-27 |
| 2 | WRK-TASK-046 · Nombres en el marcador compacto del móvil | completed | — | 2026-09-27 |
| 3 | WRK-TASK-045 · Indicador de quién ataca a quién | completed | — | 2026-09-27 |
| 4 | WRK-TASK-049 · Polvo y humo persistentes tras un derrumbe | completed | — | 2026-09-27 |
| 5 | WRK-TASK-048 · Tutorial adaptado al vertical | completed | — | 2026-09-27 |
| 6 | WRK-TASK-041 · Protección del rey en las primeras rondas | completed | 044 | 2026-09-28 |
| 7 | WRK-TASK-047 · Repetición del mejor disparo al final | completed | — | 2026-09-28 |
| 8 | WRK-TASK-051 · Animación del rey | completed | — | 2026-09-28 |
| 9 | WRK-TASK-052 · Física más barata para el anfitrión móvil | completed | — | 2026-09-28 |
| 10 | WRK-TASK-050 · Iluminación del atardecer y sombras de contacto | completed | 052 | 2026-09-28 |
| 11 | WRK-TASK-042 · Espectador activo tras la eliminación | completed | 041 | 2026-09-28 |
| 12 | WRK-TASK-043 · Objetivos secundarios por ronda | completed | 041 | 2026-09-28 |
| 13 | WRK-TASK-053 · Revisión de la iluminación por el usuario | draft | 050 | — |

Tareas de otros planes que forman parte de esta propuesta y pueden intercalarse en cualquier momento: WRK-TASK-010 (desconectado → bot) y WRK-TASK-012 (estadísticas con migración) antes de probar con amigos; WRK-TASK-011 (repetición por lava) junto a la 047; WRK-TASK-009 (PWA) cuando se quiera instalar en el móvil. Las pruebas opcionales en Android están en WRK-TASK-040.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| La protección del rey alarga demasiado las partidas | medium | medium | Medir el equilibrio; ajustar cuántas rondas dura |
| Los efectos nuevos (humo, iluminación) bajan los fps en móvil | medium | medium | Topes por calidad y banco con `cpu=4 movil` |
| Cambios de protocolo con clientes abiertos | high | low | `PROTOCOL_VERSION` (RULE-002) |
| Demasiadas tareas en paralelo | low | medium | Una tarea activa a la vez |

## Evidence

Pendiente.
