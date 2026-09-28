---
id: WRK-SPEC-011
type: spec
layer: work-spec
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
activates:
  - FEAT-CONTROL-001
  - FEAT-INTERFAZ-001
  - DOM-JUEGO-002
  - DOM-JUEGO-003
  - DOM-JUEGO-004
  - RULE-001
  - RULE-002
  - RULE-004
dependencies:
  - id: WRK-SPEC-010
    relation: extends
tags: [control, municion, castillos, lava, interfaz, diseno]
---

# WRK-SPEC-011 — Apuntado, castillos y munición tras la tercera prueba

## Problem Statement

El 28-09-2026 el usuario probó WRK-SPEC-010 en su Android: en solitario contra bots y en una partida con otra persona. Funciona sin errores graves, pero señala cosas de diseño:

1. **El apuntado no es preciso**, en móvil y probablemente en PC. Al cargar, la parábola crece, pero la bala siempre cae mucho más corta de lo que parece. Comprobado (28-09-2026): la física coincide con la vista previa (misma fórmula de arrastre, sin amortiguación). El problema es de lectura: la vista previa pinta solo el primer 60 % del vuelo, el arrastre hace que la caída sea más empinada que la subida y el muro rival para la bala antes del punto de caída. El ojo alarga el arco como si fuera simétrico y llano.
2. **Castillos más altos:** faltan dos filas de bloques en todos los castillos.
3. **Castillos con el color del jugador:** la mayoría de los bloques de cada castillo, en tonos de su color.
4. **Lava:** que suba un poco cada ronda y se quede quieta el resto del tiempo, en lugar de un salto cada 3 rondas.
5. **Munición en parábola pura:** por ahora, todo lo que se dispara sale de la catapulta y vuela en parábola. Fuera el piano (cae en vertical) y la burbuja. Valen las que ruedan tras caer (tronco, bola de nieve).
6. **Revisión de la interfaz:** el usuario quiere revisar el diseño de la interfaz con herramientas de diseño antes de que cambie, para evitar textos descriptivos donde no deben estar y elementos poco cuidados.

## Proposed Change

**In scope.** Decisiones del usuario (28-09-2026), elegidas entre opciones:

| N.º | Cambio | Decisión | Tarea |
|---:|---|---|---|
| 1 | Apuntado | Parábola entera hasta el primer choque (bloque o suelo), con marca en el punto de impacto | WRK-TASK-054 |
| 2 | Munición | Fuera del reparto, sin borrar su código: piano, burbuja, andamio y gallina. Quedan pedrusco, tronco, cocos, vaca, sandía, agujero negro, imán y bola de nieve | WRK-TASK-055 |
| 3 | Cocos | Se quedan y ganan protagonismo: el racimo se abre hacia el 60-70 % del vuelo, siguiendo la parábola, y cada coco explota al tocar algo | WRK-TASK-056 |
| 4 | Lava | Sube un poco al empezar cada ronda, al mismo ritmo medio que ahora (unos 0,44 m por ronda: toca la isla hacia la ronda 10) | WRK-TASK-057 |
| 5 | Castillos | Dos filas más de altura en torres, murallas y contrafuertes | WRK-TASK-058 |
| 6 | Colores | Piedra (tono oscuro) y madera (tono claro) teñidas del color del jugador; cristal y hierro, neutros. Primero en un diseño que el usuario aprueba | WRK-TASK-059 |
| 7 | Interfaz | Artefacto de diseño con la interfaz actual (PC y móvil vertical) y las propuestas de 1 y 6, para que el usuario lo revise y comente. Cada comentario, una tarea | WRK-TASK-060 |

**Out of scope:** borrar el código de la munición retirada (vuelve si se decide), munición nueva, rediseñar la interfaz sin la revisión del usuario (WRK-TASK-060 decide qué cambia) y WRK-TASK-014 (sin hardware).

## Constraints

- PC y móvil vertical a la par: cada tarea se diseña y se prueba en 1280×720 y en 390×844. El horizontal no puede empeorar.
- RULE-001 en munición, lava y castillos: destrozo (12 disparos) y equilibrio (8-12 partidas) antes y después.
- RULE-002: `PROTOCOL_VERSION` sube si cambian el estado o los identificadores de bloques (las dos filas nuevas pasan de 200 bloques por castillo, el `BLOCK_ID_STRIDE` actual).
- RULE-004: `perf.spec.ts` y el banco (también `cpu=4 movil`) dentro del presupuesto con los bloques de más.
- Nada visible cambia en la interfaz sin pasar por la revisión de diseño del usuario (WRK-TASK-060): la marca de impacto y los colores se enseñan antes en el artefacto.
- Textos del juego en registro claro y neutro, y solo donde hacen falta.

## Acceptance Criteria

- [ ] Las 7 tareas de WRK-PLAN-011 cerradas, cada una con CI en verde.
- [ ] Con la parábola completa, un disparo sin viento cae a menos de 1 m de la marca de impacto en PC y en móvil (prueba automática).
- [ ] Ninguna munición del reparto cae en vertical ni actúa sin volar desde la catapulta.
- [ ] Equilibrio medido tras los cambios de munición, lava y castillos: la partida en normal sigue en 7-11 rondas.
- [ ] El usuario ha revisado el artefacto de diseño y sus comentarios son tareas o están aplicados.

## Open Questions

- [x] Con dos filas más, ¿sube también el torreón para que el rey siga asomando por encima de las murallas? — dimas. Decidido el 28-09-2026: sí, dos filas de pedestal más.
- [ ] ¿Qué comentarios deja el usuario en el artefacto de diseño? — dimas, WRK-TASK-060.
