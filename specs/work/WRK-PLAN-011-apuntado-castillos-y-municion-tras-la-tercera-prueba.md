---
id: WRK-PLAN-011
type: spec
layer: work-plan
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-SPEC-011
activates: [FEAT-CONTROL-001, DOM-JUEGO-003, DOM-JUEGO-004, RULE-001, RULE-004]
dependencies: []
tags: [control, municion, castillos, lava, interfaz, diseno]
---

# WRK-PLAN-011 — Apuntado, castillos y munición tras la tercera prueba

## Approach

Primero lo que más molesta al jugar (el apuntado) y lo que simplifica la munición; después los cambios de reglas que se miden juntos en el equilibrio (lava, castillos), y al final lo que depende de que el usuario apruebe el diseño (colores). La revisión de la interfaz (WRK-TASK-060) corre en paralelo: la hace el usuario sobre el artefacto de diseño, y sus comentarios se convierten en tareas nuevas de este plan.

Una sola tarea activa a la vez (DOC-OPS-002); cada una se despliega por separado con CI en verde. Las de munición, lava y castillos miden destrozo y equilibrio antes y después (RULE-001); como se encadenan, la referencia «antes» de cada una es la tarea anterior.

## Estado

| Orden | Tarea | Estado | Dependencias | Entrega |
|---:|---|---|---|---|
| 0 | WRK-TASK-060 · Revisión de la interfaz con el artefacto de diseño | draft | — | Lienzo publicado; 1.er comentario → WRK-TASK-061 |
| 1 | WRK-TASK-054 · Parábola hasta el choque con marca de impacto | draft | 060 (aprobar la marca) | — |
| 2 | WRK-TASK-055 · Solo munición que vuela en parábola | completed | — | 2026-09-28 |
| 3 | WRK-TASK-056 · Racimo de cocos que se abre en vuelo y explota | completed | 055 | 2026-09-28 |
| 4 | WRK-TASK-057 · La lava sube un poco cada ronda | completed | — | 2026-09-28 |
| 5 | WRK-TASK-058 · Castillos con dos filas más | draft | 057 | — |
| 6 | WRK-TASK-059 · Castillo con los colores del jugador | draft | 058, 060 (aprobar colores) | — |
| 7 | WRK-TASK-061 · Barra de munición sin textos y con la rareza a la vista | draft | 060 (aprobar la propuesta) | — |
| 8 | WRK-TASK-062 · Portada: tipografía y maquetación | draft | 060 (aprobar la propuesta) | — |
| 9 | WRK-TASK-063 · Cámara de impacto centrada en tu disparo | draft | — | — |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Con la parábola completa, apuntar es trivial y los bots dejan de ser rivales | medium | medium | El viento y el tiempo siguen contando; medir el equilibrio contra bots en difícil y, si hace falta, subir la precisión del bot |
| La marca de impacto no coincide con el choque real (bloques que se mueven, rotura que atraviesa) | medium | medium | Calcular contra los bloques tal como se ven y probar la distancia marca-impacto en una E2E |
| Con 7 municiones y sin defensivas, la mano se repite y pierde variedad | medium | low | Revisar pesos en 055; la carta de premio (ADR-015) sigue saliendo de raras y épicas |
| Los cocos explosivos se salen de su franja de destrozo | high | medium | Medir en 056; la palanca es la fuerza de cada coco o pasar el racimo a rara |
| Dos filas más bajan los fps en móvil | medium | medium | Banco `cpu=4 movil` antes y después (RULE-004) |
| El cambio de identificadores de bloque rompe partidas abiertas | high | low | `PROTOCOL_VERSION` (RULE-002) |

## Evidence

Pendiente.
