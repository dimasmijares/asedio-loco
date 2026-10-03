---
id: DOM-JUEGO-002
type: spec
layer: domain
domain: juego
status: active
confidence: medium
version: 1.1.0
created: 2026-09-26
updated: 2026-10-03
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

Hace que la partida se cierre sola, como en un battle royale: la lava sube y se come los castillos y en el duelo sale munición más fuerte (el viento se quitó el 03-10-2026, ADR-018). Sin esto, dos jugadores prudentes podrían alargar la partida sin fin.

## Definition

### Concept

La **lava** es un mar que rodea la isla y sube por niveles al empezar ciertas rondas. El **viento** era un vector horizontal que desviaba los proyectiles; desde el 03-10-2026 no sopla (ADR-018). Las dos cosas dependen solo del número de ronda y de la semilla de la partida.

### Rules

1. **Nivel de lava** (WRK-TASK-057): sube un poco al empezar cada ronda y se queda quieta: altura −3,6 + 0,444 · (ronda − 1), con tope 5,2 m. Con `?fast=1`, el triple por ronda. La tabla de abajo es la de antes (un salto cada 3 rondas); las alturas de las rondas 1, 4, 7, 10… coinciden con ella.
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
7. **Sin viento** (ADR-018, 03-10-2026): `wind` vale `[0, 0, 0]` en todas las rondas. Antes soplaba desde la ronda 6, hasta 7,5 m/s.
8. La física y la parábola siguen admitiendo un viento (cada munición lo notaría según su `windFactor`); a cero no hace nada. Las defensivas no vuelan.
9. **Duelo:** con 2 reyes vivos, el peso de cada rareza en el reparto se multiplica por común 0,55, rara 1,5, épica 2,6 y defensiva 0,9 (DOM-JUEGO-003).
10. La lava se calcula con la ronda y la semilla, así que son iguales en todos los clientes y tras una migración de anfitrión.

### Constraints

- Hileras de 1,2 m porque el castillo está a escala 1,2 (DOM-JUEGO-004).
- La lava no debe llevarse el castillo entero en cadena (D-020): por eso no funde lo que cae sobre ella en la isla.

### Examples

- Ronda 4: la lava sube a −2,3 m con su efecto visual, pero ningún castillo pierde bloques.
- Ronda 10: desaparece la hilera de la base (portón de hierro incluido); murallas y torres bajan enteras hasta apoyarse en la superficie de lava (0,4 m).
- Borde: un bloque sale despedido fuera de la isla y cae al mar: se funde. Uno que cae en el patio inundado se queda flotando.
- Con bots en normal, la lava causa 12 de las 26 eliminaciones (`ultimo-normal.txt`).

## Acceptance Criteria

- [x] La lava sube cada 3 rondas (cada ronda en modo rápido) y en la ronda 4 está en el nivel 1.
- [x] No sopla el viento en ninguna ronda (ADR-018).
- [x] En el duelo sale munición más rara.
- [ ] Una prueba comprueba que en la ronda 10 se funde la hilera de la base y que un bloque caído sobre la lava de la isla no se funde.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/match.test.ts` («la lava sube cada 3 rondas», «en el duelo sale munición más rara») | 2026-09-26 | low → medium |
| Testing | `tests/unit/match.test.ts` («no sopla el viento en ninguna ronda») | 2026-10-03 | — |
| Production data | `tests/balance/ultimo-*.txt`: causas de eliminación (lava 12/26 en normal, 12/20 en fácil, 4/19 en difícil) | 2026-09-26 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/map.ts` | `LAVA_LEVELS`, `LAVA_RISE_EVERY` |
| Implemented in | `shared/match.ts` | `lavaLevelForRound`; `startRound` deja el viento a cero |
| Implemented in | `client/src/game/sim/sim.ts` | `setLava`, `sinkDoomed`, `applyLava`, `LAVA_SINK_SPEED` |
| Implemented in | `shared/ammo.ts` | `DUEL_BOOST`, `windFactor` |
| Tested by | `tests/unit/match.test.ts` | Lava, sin viento y duelo |
| Decided in | D-020, D-021, D-058, D-063 | Lava rediseñada, escalada, duelo sin acortar, hileras de 1,2 m |

## Open Questions

- La especificación original pedía que la lava «funda o empuje» todo lo que toca; en la isla no lo hace a propósito. ¿Se quiere un efecto intermedio (empujar sin fundir)? — dimas
- La especificación original también acortaba las rondas en el duelo; ahora no (decisión del usuario, D-058). Queda solo la munición más rara.
