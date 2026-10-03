---
id: WRK-PLAN-011
type: spec
layer: work-plan
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-10-03
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
| 1 | WRK-TASK-054 · Parábola hasta el choque con marca de impacto | completed | 060 (marca aprobada) | 2026-09-28 |
| 2 | WRK-TASK-055 · Solo munición que vuela en parábola | completed | — | 2026-09-28 |
| 3 | WRK-TASK-056 · Racimo de cocos que se abre en vuelo y explota | completed | 055 | 2026-09-28 |
| 4 | WRK-TASK-057 · La lava sube un poco cada ronda | completed | — | 2026-09-28 |
| 5 | WRK-TASK-058 · Castillos con dos filas más | completed | 057 | 2026-09-28 |
| 6 | WRK-TASK-059 · Castillo con los colores del jugador | completed | 058, 060 (colores aprobados) | 2026-09-28 |
| 7 | WRK-TASK-061 · Barra de munición sin textos y con la rareza a la vista | completed | 060 (R-03; PC en R-04) | 2026-09-28 |
| 8 | WRK-TASK-062 · Portada: tipografía y maquetación | draft | 060 (aprobar la propuesta) | — |
| 9 | WRK-TASK-063 · Cámara de impacto centrada en tu disparo | completed | — | 2026-09-28 |
| 10 | WRK-TASK-064 · Revisión del flujo de partidas | completed | — | R-07 aprobado entero (28-09) → 067-072 |
| 11 | WRK-TASK-065 · Munición a la medida de los castillos de 236 bloques | draft | 058 | — |
| 12 | WRK-TASK-066 · Física de los castillos altos en un anfitrión móvil | draft | 058 | — |
| 13 | WRK-TASK-067 · Salir de la partida y de la sala | draft | 064 | — |
| 14 | WRK-TASK-068 · Revancha en un paso | draft | 064 | — |
| 15 | WRK-TASK-069 · Invitar más fácil | draft | 064 | — |
| 16 | WRK-TASK-070 · Sala gestionada tocando las plazas y nombre editable | draft | 064 | — |
| 17 | WRK-TASK-071 · Llegar tarde con explicación | draft | 064 | — |
| 18 | WRK-TASK-072 · Final y pausa en solitario | draft | 064 | — |
| 19 | WRK-TASK-073 · Selector de castillos del espectador | draft | 061, R-05 | — |
| 20 | WRK-TASK-074 · Estilo «Atardecer» en la interfaz (R-10 fase 1: E1-E3) | completed | 060 (R-10) | 2026-10-02 |
| 21 | WRK-TASK-075 · Munición ilustrada (R-10 fase 1: E4) | completed | 074 | 2026-10-02 |
| 22 | WRK-TASK-076 · Escena al atardecer (R-10 fase 1: D2) | completed | 074 | 2026-10-02 |
| 23 | WRK-TASK-077 · Bandeja del pulgar en móvil vertical (R-10 fase 2: U1, U3, U8) | completed | 076 | 2026-10-02 |
| 24 | WRK-TASK-078 · Descripción de la munición al mantener la carta (R-10 fase 2: U2) | completed | 077 | 2026-10-02 |
| 25 | WRK-TASK-079 · Parte superior de la partida en móvil vertical (R-10 fase 2: U4, U5) | completed | 078 | 2026-10-03 |
| 26 | WRK-TASK-080 · Después de disparar en móvil vertical (R-10 fase 2: U6, U7) | completed | 079 | 2026-10-03 |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Con la parábola completa, apuntar es trivial y los bots dejan de ser rivales | medium | medium | El viento y el tiempo siguen contando; medir el equilibrio contra bots en difícil y, si hace falta, subir la precisión del bot |
| La marca de impacto no coincide con el choque real (bloques que se mueven, rotura que atraviesa) | medium | medium | Calcular contra los bloques tal como se ven y probar la distancia marca-impacto en una E2E |
| Con 7 municiones y sin defensivas, la mano se repite y pierde variedad | medium | low | Revisar pesos en 055; la carta de premio (ADR-015) sigue saliendo de raras y épicas |
| Los cocos explosivos se salen de su franja de destrozo | high | medium | Medir en 056; la palanca es la fuerza de cada coco o pasar el racimo a rara |
| Dos filas más bajan los fps en móvil | medium | medium | Banco `cpu=4 movil` antes y después (RULE-004) |
| El cielo crema del atardecer resta contraste a la parábola y a los castillos claros | medium | high | Contorno noche en la parábola y el anillo; capturas de los cuatro castillos (WRK-TASK-076) |
| La bandeja del pulgar tapa el castillo objetivo o el dedo pierde precisión en el pad | medium | high | El centro de la imagen sube media bandeja; el pad usa la ganancia del ratón y la escena sigue sirviendo para los giros grandes (WRK-TASK-077) |
| El cambio de identificadores de bloque rompe partidas abiertas | high | low | `PROTOCOL_VERSION` (RULE-002) |

## Evidence

Pendiente.
