---
id: WRK-SPEC-007
type: spec
layer: work-spec
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
activates:
  - DOM-JUEGO-003
  - DOM-JUEGO-004
  - FEAT-SENSACION-001
  - FEAT-BOTS-001
  - RULE-001
dependencies:
  - id: WRK-SPEC-005
    relation: extends
tags: [municion, equilibrio, sensacion]
---

# WRK-SPEC-007 — Cada munición, especial y destructiva a su manera

## Problem Statement

Tras probar el juego en el móvil (26-09-2026), el usuario pide que **cada munición sea muy especial** y que **todas se sientan bastante destructivas dentro de su tipología**. Ejemplo: la gallina rebota y no rompe nada.

Diagnóstico con `tests/balance/destrozo.txt` (12 disparos por munición, bloques rotos de media): pedrusco 9,8; tronco 6,5; cocos 6,5; vaca 2,3; sandía 2,6; gallina 5,1; piano 10,8; agujero negro 17,0; imán 13,1; bola de nieve 9,8. Hay tres causas:

1. **Las explosiones no rompen piedra.** `explode` fractura un bloque si `fuerza · caída · oclusión ≥ blastResist`. La vaca (28) y la sandía (34) no llegan a la piedra (36) ni en el centro, y el hierro (120) es inalcanzable: solo empujan. Por eso son las más flojas siendo raras.
2. **La gallina se va.** Cada bote la lanza hacia delante a 6 m/s o más: sale del castillo al segundo bote y los picotazos (fuerza 50) solo astillan.
3. **Las raras y épicas no se distinguen en el resultado**: casi todas dejan «unos cuantos bloques rotos alrededor del impacto». Falta una firma reconocible (cráter, columna, barrido, lluvia…).

## Proposed Change

Cada munición ofensiva tiene una **identidad** (qué destroza y cómo) y un **objetivo de destrozo** medido. La rareza marca cuánto destroza y la identidad, dónde.

| Munición | Rareza | Identidad | Firma esperada | Rotos (hoy → objetivo) |
|---|---|---|---|---|
| Pedrusco | común | El fiable: rompe justo donde apuntas | Agujero pequeño y limpio; la referencia | 9,8 → 9-11 |
| Tronco | común | Apisonadora: arrasa en línea recta lo que pilla | Surco estrecho y largo, muchos bloques movidos (WRK-TASK-029: rueda por donde toca, no siempre por la base) | 6,5 → 10-13 |
| Cocos | común | Metralla: muchos golpes repartidos | Desperfectos por toda la fachada | 6,5 → 10-13 |
| Vaca | rara | Bomba: cráter | Agujero redondo grande y bloques volando | 2,3 → 14-18 |
| Sandía | rara | Carga de demolición: se pega y revienta desde dentro | Hueco profundo en el punto exacto; tumba torres | 2,6 → 14-18 |
| Gallina | rara | Bombardera: rebota por el castillo poniendo huevos que explotan | 3-4 cráteres pequeños en fila | 5,1 → 12-16 |
| Piano | rara | Martillo: perfora de arriba abajo | Columna hundida hasta el suelo | 10,8 → 15-20 |
| Agujero negro | épica | Borra una sección | Hueco esférico limpio | 17,0 → 20-26 |
| Imán | épica | Desmonta el hierro y lo devuelve como metralla | Hierro arrancado y una segunda oleada | 13,1 → 18-24 |
| Bola de nieve | épica | Alud: crece y arrasa en línea | Surco de lado a lado | 9,8 → 18-24 |

**In scope:**

- Física de las 10 municiones ofensivas (`projectiles.ts`, `explode` y campos en `sim.ts`).
- Una **firma** por munición en la prueba de destrozo, además de rotos, movidos y reyes: dispersión, altura del daño y piedra rota.
- Sensación propia: temblor de cámara según el destrozo, efecto y sonido característicos, y descripción de la tarjeta.
- Bots que eligen munición y punto de mira según la identidad.
- Equilibrio final: duración de la partida, andamio y reyes.

**Out of scope:**

- Municiones nuevas. Andamio y burbuja, salvo ajustar el andamio al nuevo nivel de destrozo.
- Materiales y castillos (DOM-JUEGO-004), salvo decisión del usuario.

## Constraints

- RULE-001: cada tarea mide el destrozo (12 disparos) y el equilibrio (normal y difícil, `GAMES=8`) antes y después.
- Ninguna rara ni épica mata al rey de un golpe salvo con impacto directo: como mucho 3 de 12 en la prueba de destrozo (la mitad de los disparos apunta al rey).
- Todo sigue siendo determinista en el anfitrión y se ve igual en los clientes. Si hacen falta eventos nuevos, `PROTOCOL_VERSION` sube (RULE-002).
- Presupuesto de rendimiento (RULE-004): más destrozo son más cuerpos y partículas. Se mide con el banco (`#bench`) en las tareas que multiplican cuerpos (cocos, huevos, imán).
- El móvil se juega en vertical por defecto: efectos y textos se comprueban ahí primero.

## Decisiones del usuario (26-09-2026)

1. **Duración:** se aceptan partidas más cortas; solo se vigila que no bajen de unas 6 rondas en normal.
2. **Gallina:** huevos bomba **a lo bomba de racimo**, con **poco rebote** para que haga daño (no sale despedida).
3. **Orden:** las flojas primero (medición, vaca y sandía, gallina), luego comunes, piano, épicas, sensación y bots.

## Evidence

Hecho en WRK-PLAN-007 (tareas 026-033), el 26-09-2026:

- **Destrozo:** media de 8,4 a 16,1 bloques por disparo, con las 10 municiones ofensivas en su franja.
- **Firmas en la prueba:** cráter (vaca), hueco profundo (sandía), racimos repartidos (gallina), columna hasta el suelo (piano), surcos en línea (tronco y bola de nieve), segunda oleada de hierro (imán) y borrado con escupitajo (agujero negro).
- **Reyes:** ninguna rara ni épica pasa de 3 de 12 en la prueba de destrozo.
- **Partidas:** normal de 9,1 a 6,8 rondas y difícil de 7,3 a 6,5, aceptado por el usuario.
- **Rendimiento:** paso de física de 5,2 ms en el banco.
- **Móvil:** la descripción de la munición elegida se ve en el HUD, también en vertical.
