---
id: WRK-SPEC-006
type: spec
layer: work-spec
scope: ephemeral
status: active
confidence: medium
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
activates:
  - DOM-JUEGO-001
  - FEAT-CAMARA-001
  - FEAT-BOTS-001
  - FEAT-INTERFAZ-001
  - ARCH-003
  - RULE-001
  - RULE-002
dependencies:
  - id: WRK-SPEC-002
    relation: extends
tags: [jugabilidad, camara, bots]
---

# WRK-SPEC-006 — Cuenta atrás antes del disparo y bots más variados (segunda prueba)

## Problem Statement

Tras probar la versión actual (26-09-2026), el usuario pide:

1. Cuando todos han fijado su ataque, el disparo sale casi de golpe (0,6 s de margen) y la cámara salta de la vista de apuntado al plano del impacto. Quiere una **cuenta atrás de 3 s**, con un efecto, durante la cual la cámara se aleja hasta una **vista panorámica** desde la que se vean bien los ataques de los 4. Al llegar a 0 se disparan las catapultas. Los 20 s para apuntar están bien.
2. **La IA tarda mucho** en preparar su ataque: entre 2,5 y 6 s en normal y entre 4 y 8 s en fácil.
3. **La IA ataca siempre al mismo jugador.** En su partida, los 3 bots le atacaban a él. Causa: los bots eligen «el más débil» o «el más cercano», y en ambos empates gana el hueco 0, que es el del humano. Después, al ser el más dañado, sigue siendo «el más débil».

## Proposed Change

**In scope:**

- Fase nueva `countdown` de 3 s (1 s con `?fast=1`) entre el apuntado y el impacto.
- La cuenta atrás empieza en cuanto todos los vivos han fijado su ataque o se agotan los 20 s. Si se agotan, los que no han disparado quedan fijados con su puntería actual.
- Durante la cuenta atrás, la cámara se aleja de forma continua hasta un plano general que encuadra todos los castillos en juego y sigue así al empezar el impacto.
- Efecto en pantalla: 3, 2, 1, ¡FUEGO!, cuatro tiempos de 1 s con sonido. Los disparos salen con ¡FUEGO!.
- Munición: se elige bien tanto con clic en la tarjeta como con 1/2/3 del teclado normal o del numérico.
- Disparo: se carga y se suelta con Espacio o manteniendo el clic izquierdo sobre la escena.
- Bots:
  - fijan su ataque en 1-3 s: fácil 2-3 s, normal 1,5-2,5 s y difícil 1-2 s;
  - eligen objetivo con un sorteo ponderado: más peso al más débil y al más cercano según la dificultad, y empates al azar;
  - evitan que todos vayan a por el mismo;
  - tienen más probabilidad de devolver el golpe a quien les atacó en la ronda anterior.

**Out of scope:**

- Cambiar los 20 s de apuntado (el usuario los da por buenos).
- La puntería de los bots (sus errores por dificultad no cambian).

## Decisiones del usuario (26-09-2026)

- **Objetivo de los bots:** reparto y venganza.
- **Rapidez de los bots:** de 1 a 3 s según la dificultad.
- **Al agotarse los 20 s:** también hay cuenta atrás de 3 s, con los que no han disparado fijados con su puntería actual.
- **Segundo mensaje (26-09-2026):** la cuenta atrás es «3 2 1 Fuego» aunque sean 4 s. La munición debe poder elegirse bien con el ratón y con el teclado numérico. El disparo, con Espacio o manteniendo el clic izquierdo.

## Knowledge Context

| Spec | Why it applies |
|------|----------------|
| DOM-JUEGO-001 | Las fases de la ronda cambian: nueva fase `countdown` |
| FEAT-CAMARA-001 | La panorámica empieza en la cuenta atrás, no en el impacto |
| FEAT-BOTS-001 | Elección de objetivo y retraso |
| FEAT-INTERFAZ-001 | Efecto de cuenta atrás en el HUD |
| ARCH-003 | `MatchState.phase` viaja por la red |
| RULE-002 | Fase nueva: sube `PROTOCOL_VERSION` |
| RULE-001 | Los bots cambian el equilibrio: se mide antes y después |

## Acceptance Criteria

- [ ] Con todos listos antes de tiempo, pasan 3 s de cuenta atrás y luego se dispara; lo mismo al agotarse los 20 s.
- [ ] Al disparar, la cámara ya está en el plano general, sin saltos.
- [ ] Con 1 humano y 3 bots, los 3 bots coinciden en el mismo objetivo en menos del 25 % de las rondas (medido con semillas).
- [ ] Los bots fijan su ataque en 1-3 s.
- [ ] Un clic en una tarjeta de munición la selecciona siempre, y también las teclas 1/2/3 y Numpad 1/2/3.
- [ ] Mantener el clic izquierdo sobre la escena carga la fuerza y al soltar dispara, igual que Espacio.
- [ ] Equilibrio medido antes y después (RULE-001) y `PROTOCOL_VERSION` subida (RULE-002).
