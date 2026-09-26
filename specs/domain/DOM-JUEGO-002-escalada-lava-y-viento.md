---
id: DOM-JUEGO-002
type: spec
layer: domain
domain: juego
status: active
confidence: medium
version: 1.0.1
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: DOM-JUEGO-001
    relation: extends
  - id: DOM-JUEGO-003
    relation: uses-data-from
  - id: DOM-JUEGO-004
    relation: uses-data-from
tags:
  - lava
  - viento
  - escalada
---

# DOM-JUEGO-002 — Escalada: lava y viento

## Intent

Hace que la partida se cierre sola, como en un battle royale: la lava sube y se come los castillos, el viento complica la puntería y en el duelo sale munición más fuerte. Sin esto, dos jugadores prudentes podrían alargar la partida sin fin.

## Definition

### Concept

La **lava** es un mar que rodea la isla y sube por niveles al empezar ciertas rondas. El **viento** es un vector horizontal que cambia cada ronda y desvía los proyectiles. Las dos cosas dependen solo del número de ronda y de la semilla de la partida.

### Rules

1. **Nivel de lava:** `min(7, floor((ronda − 1) / 3))`. Sube cada 3 rondas (cada ronda con `?fast=1`).
2. **Alturas por nivel** (la superficie de la isla está en y = 0):

   | Nivel | Rondas | Altura (m) | Efecto |
   |---|---|---|---|
   | 0 | 1-3 | −3,6 | Por debajo de la isla |
   | 1 | 4-6 | −2,3 | Aviso: sube, no toca la isla |
   | 2 | 7-9 | −1,0 | Aviso |
   | 3 | 10-12 | 0,4 | Inunda el patio: se come la hilera de la base |
   | 4 | 13-15 | 1,6 | Otra hilera |
   | 5 | 16-18 | 2,8 | Otra hilera |
   | 6 | 19-21 | 4,0 | Otra hilera |
   | 7 | 22+ | 5,2 | Otra hilera (tope) |

3. **Comerse bloques:** al subir, cada bloque cuya base queda más de 3 cm por debajo de la nueva altura pierde sus uniones, deja de chocar con la superficie de lava y se hunde a 0,6 m/s. Se funde cuando su cara de arriba queda a ras. Lo de encima baja con él sin golpes.
4. **Sobre la isla**, la superficie de lava es un suelo físico: un bloque que cae encima se queda flotando y **no se funde**. Solo se come la hilera cuando sube el nivel. Esta excepción es solo para bloques.
5. **Fuera de la isla** (el mar), lo que toca la lava se frena y se funde tras el tiempo de su material (madera 1,2 s, piedra 2,6 s, cristal 0,8 s, hierro 4 s). Los proyectiles se frenan y se funden a los 0,6 s en cualquier lava, también sobre la isla.
6. Un rey que toca la lava queda eliminado (DOM-JUEGO-001, regla 10).
7. **Viento:** nulo hasta la ronda 5. Desde la ronda 6 (la 3 en modo rápido) tiene dirección al azar y velocidad al azar entre 2 y `3,5 + min(4, (ronda − 6) · 0,5)` m/s. Es decir, hasta 3,5 m/s en la ronda 6 y hasta 7,5 m/s desde la 14.
8. Cada munición nota el viento según su `windFactor` (de 0,2 el piano o el agujero negro a 0,5 la gallina). Las defensivas no vuelan.
9. **Duelo:** con 2 reyes vivos, el peso de cada rareza en el reparto se multiplica por común 0,55, rara 1,5, épica 2,6 y defensiva 0,9 (DOM-JUEGO-003).
10. Lava y viento se calculan con la ronda y la semilla, así que son iguales en todos los clientes y tras una migración de anfitrión.

### Constraints

- Hileras de 1,2 m porque el castillo está a escala 1,2 (DOM-JUEGO-004).
- La lava no debe llevarse el castillo entero en cadena (D-020): por eso no funde lo que cae sobre ella en la isla.

### Examples

- Ronda 4: la lava sube a −2,3 m con su efecto visual, pero ningún castillo pierde bloques.
- Ronda 10: desaparece la hilera de la base (portón de hierro incluido); murallas y torres bajan enteras hasta apoyarse en la superficie de lava (0,4 m).
- Borde: un bloque sale despedido fuera de la isla y cae al mar: se funde. Uno que cae en el patio inundado se queda flotando.
- Contraejemplo: el viento no cambia a mitad de ronda; lo que se ve al apuntar es lo que habrá al disparar.
- Con bots en normal, la lava causa 12 de las 26 eliminaciones (`ultimo-normal.txt`).

## Acceptance Criteria

- [x] La lava sube cada 3 rondas (cada ronda en modo rápido) y en la ronda 4 está en el nivel 1.
- [x] No hay viento en la ronda 5 y sí en la 6, con más de 1,5 m/s.
- [x] En el duelo sale munición más rara.
- [ ] Una prueba comprueba que en la ronda 10 se funde la hilera de la base y que un bloque caído sobre la lava de la isla no se funde.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/match.test.ts` («la lava sube cada 3 rondas», «el viento sopla desde la ronda 6», «en el duelo sale munición más rara») | 2026-09-26 | low → medium |
| Production data | `tests/balance/ultimo-*.txt`: causas de eliminación (lava 12/26 en normal, 12/20 en fácil, 4/19 en difícil) | 2026-09-26 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/map.ts` | `LAVA_LEVELS`, `LAVA_RISE_EVERY`, `WIND_FROM_ROUND` |
| Implemented in | `shared/match.ts` | `lavaLevelForRound`, `windForRound` |
| Implemented in | `client/src/game/sim/sim.ts` | `setLava`, `sinkDoomed`, `applyLava`, `LAVA_SINK_SPEED` |
| Implemented in | `shared/ammo.ts` | `DUEL_BOOST`, `windFactor` |
| Tested by | `tests/unit/match.test.ts` | Lava, viento y duelo |
| Decided in | D-020, D-021, D-058, D-063 | Lava rediseñada, escalada, duelo sin acortar, hileras de 1,2 m |

## Open Questions

- La especificación original pedía que la lava «funda o empuje» todo lo que toca; en la isla no lo hace a propósito. ¿Se quiere un efecto intermedio (empujar sin fundir)? — dimas
- La especificación original también acortaba las rondas en el duelo; ahora no (decisión del usuario, D-058). Queda solo la munición más rara.
