---
id: DOM-JUEGO-003
type: spec
layer: domain
domain: juego
status: active
confidence: medium
version: 3.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: DOM-JUEGO-001
    relation: extends
  - id: DOM-JUEGO-004
    relation: uses-data-from
tags:
  - municion
  - equilibrio
---

# DOM-JUEGO-003 — Munición

## Intent

Define las 12 municiones locas, cómo se reparten en cada ronda y qué hace cada una. La munición es la principal fuente de variedad y de risas, y a la vez la que más puede romper el equilibrio: ninguna rara debería eliminar a nadie de un golpe salvo con muy buena puntería.

## Definition

### Concept

Cada ronda, cada jugador vivo recibe una **mano** de 3 municiones distintas y dispara una. Hay 4 rarezas: común, rara, épica y defensiva. Las defensivas no vuelan: actúan sobre el castillo propio. El daño sale siempre de la física (impactos, explosiones y campos de fuerza), nunca de una barra de vida.

### Rules

1. Al empezar cada ronda, la mano se vacía y se reparten 3 municiones **distintas** (`HAND = 3`). Las que no se usaron en la ronda anterior se pierden.
2. El reparto usa un generador con semilla `seed ^ hash("ammo:<ronda>:<hueco>")`: con la misma semilla, ronda y hueco sale la misma mano en todos los clientes.
3. Cada munición se saca con probabilidad proporcional a su peso; si sale una repetida se vuelve a sacar (hasta 50 intentos).
4. En el duelo (2 reyes vivos) los pesos se multiplican: común 0,55, rara 1,5, épica 2,6, defensiva 0,9.
5. Por sorteo, sin duelo: común 50 %, rara 28 %, épica 9 %, defensiva 13 %. En el duelo: común 26 %, rara 40 %, épica 22 %, defensiva 11 %.
6. Al disparar se gasta la munición elegida. Si nadie elige, sale la primera de la mano.
7. Un proyectil que rompe un bloque lo atraviesa y conserva el 60 % de su velocidad (D-013), o lo que diga su `plowKeep` (el piano, el 90 %).
8. Todas las que vuelan notan el arrastre del aire y el viento (DOM-JUEGO-002). Tienen CCD.
9. `explode` acepta `pierce` (los bloques cercanos no hacen de escudo) y `king` (factor de daño y empuje sobre el rey). Una explosión que no le da al rey de lleno (a más de 1,2 m) le quita como mucho un 60 %: hacen falta dos explosiones, un impacto directo o que le caiga el castillo encima (WRK-TASK-027).

| Munición | Rareza | Peso | Efecto | Parámetros clave |
|---|---|---|---|---|
| Pedrusco | común | 22 | Bola de piedra | r 0,45 m, densidad 6, vida 6 s |
| Tronco rodante | común | 14 | Apisonadora: al tocar algo rueda en línea recta en la dirección en que venía y arrasa lo que pilla | r 0,36 m, largo 1,9 m, densidad 3; no baja de 8 m/s ni de 12 rad/s mientras rueda; vida 7,5 s |
| Racimo de cocos | común | 14 | Metralla: se abre en 6 cocos ya cayendo (a 5 m/s hacia abajo), repartidos por todo el castillo | abanico ×1,6, cocos al 72 % de tamaño, densidad 10 |
| Vaca explosiva | rara | 8 | Bomba: muge y explota al tocar algo; deja un cráter | radio 4,8 m, fuerza 120 (rompe piedra cerca del centro) |
| Sandía pegajosa | rara | 7 | Carga de demolición: se pega y a los 2 s revienta desde dentro | radio 4 m, fuerza 130; los bloques a menos de 2 m no hacen de escudo (`pierce`) |
| Gallina saltarina | rara | 7 | Bomba de racimo: 3 botes cortos y bajos hacia el castillo rival más cercano; en cada uno suelta un racimo de huevos que explotan al tocar algo | 6, 5 y 5 huevos; cada huevo: radio 2,2 m, fuerza 72, al rey solo el 25 % del daño y del empuje; mecha de 1,5 s; direcciones con semilla (id de la gallina y bote) |
| Piano | rara | 6 | Martillo: se marca dónde caería, cae en vertical desde 22 m a los 1,1 s, atraviesa pisos y al tocar el suelo o pararse suelta un acorde final | densidad 6, viento 0,2; conserva el 90 % de la velocidad al romper (`plowKeep`); acorde de 2,8 m y fuerza 85 |
| Agujero negro | épica | 3 | Borrador: atrae y se traga lo cercano y, al cerrarse, escupe lo que no se ha tragado | campo de 5,5 m y 2,2 s, fuerza 50; lo que llega a 1,6 m del núcleo desaparece; al final, onda de 5 m y fuerza 80 |
| Imán | épica | 3 | Desmontador: arranca el hierro y, al acabar, lo lanza contra el castillo rival más cercano | campo de 10 m y 2,3 s, fuerza 30 (3 % sobre lo que no es hierro); rompe las uniones del hierro; retroceso: el hierro a menos de 4,5 m sale a 22 m/s |
| Bola de nieve | épica | 3 | Alud: crece mientras rueda en línea recta en la dirección en que llegó | radio de 0,45 a 1,5 m (+0,9 m/s), no baja de 9 m/s rodando |
| Andamio | defensiva | 7 | Reconstruye hasta 15 bloques propios (10 hasta WRK-TASK-033) | los más bajos primero; no si el hueco está ocupado o bajo la lava |
| Burbuja | defensiva | 6 | Escudo que absorbe un impacto | radio 7,2 m; el primer proyectil rival que entra desaparece y la burbuja se rompe. Mientras dura, las explosiones y campos de fuera no afectan |

### Constraints

- Cualquier cambio de física o de munición se mide antes y después con la prueba de destrozo y el equilibrio (RULE-001).
- Cada munición tiene icono, color, efecto visual y sonido propios (FEAT-SENSACION-001).

### Examples

- **Cada munición destroza a su manera (WRK-PLAN-007).** La prueba de destrozo (12 disparos por munición, la mitad al rey) mide cuánto y dónde, y marca con «!» la que sale de su franja de bloques rotos. Antes del plan → después:

  | Munición | Identidad | Franja | Rotos | Disp. (m) | Altura (m) | Fila baja | Piedra/hierro | Reyes |
  |---|---|---|---|---|---|---|---|---|
  | Pedrusco | El fiable | 9-11 | 9,8 → 9,8 | 0,8 | 2,6 | 2,4 | 5,7 | 5/12 |
  | Tronco | Apisonadora en línea | 10-13 | 6,5 → 10,4 | 3,1 | 4,3 | 0,8 | 3,5 | 0/12 |
  | Cocos | Metralla repartida | 10-13 | 6,5 → 12,8 | 2,2 | 3,2 | 2,0 | 5,6 | 0/12 |
  | Vaca | Bomba: cráter | 14-18 | 2,4 → 16,4 | 1,6 | 3,4 | 2,8 | 7,2 | 3/12 |
  | Sandía | Carga de demolición | 14-18 | 2,8 → 15,5 | 1,3 | 2,9 | 3,0 | 8,6 | 2/12 |
  | Gallina | Bomba de racimo | 12-16 | 5,5 → 14,9 | 2,2 | 3,3 | 1,8 | 5,7 | 3/12 |
  | Piano | Martillo vertical | 15-20 | 10,8 → 17,6 | 1,6 | 2,3 | 4,9 | 10,9 | 0/12 |
  | Agujero negro | Borrador que escupe | 20-26 | 17,2 → 22,8 | 2,5 | 3,6 | 2,5 | 9,1 | 2/12 |
  | Imán | Desmontador con retroceso | 18-24 | 13,1 → 21,3 | 2,1 | 2,6 | 4,5 | 12,0 | 3/12 |
  | Bola de nieve | Alud en línea | 18-24 | 9,8 → 19,8 | 3,0 | 3,9 | 2,8 | 10,3 | 1/12 |
  | **Media** | | | **8,4 → 16,1** | | | | | 19/120 |

  Firmas: el pedrusco, el daño más concentrado (0,8 m); el piano, el más bajo (2,3 m) y el que más base rompe; la bola de nieve y el tronco, los más alargados; el imán, el que más piedra y hierro rompe.

- Borde: una mano con pedrusco, vaca y burbuja; el jugador no elige y se acaba el tiempo: dispara el pedrusco.

## Acceptance Criteria

- [x] Cada ronda reparte 3 municiones distintas y nuevas.
- [x] Misma semilla, misma munición.
- [x] Las rarezas se respetan aproximadamente.
- [x] En el duelo sale munición más rara.
- [x] La media de destrozo por disparo está medida y guardada en `tests/balance/destrozo.txt`.
- [x] Cada munición ofensiva está en su franja y tiene una firma reconocible en la prueba (WRK-PLAN-007).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/match.test.ts` (reparto con semilla) | 2026-09-26 | low → medium |
| Testing | `tests/balance/destrozo.test.ts` → `destrozo.txt` | 2026-09-26 | — |
| Production data | `tests/balance/ultimo-*.txt` | 2026-09-26 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/ammo.ts` | `AMMO`, pesos, `DUEL_BOOST`, `drawAmmo` |
| Implemented in | `shared/match.ts` | `HAND`, `ammoRng`, `startRound`, `consumeAmmo` |
| Implemented in | `client/src/game/sim/projectiles.ts` | Comportamiento de cada munición |
| Implemented in | `client/src/game/sim/sim.ts` | `explode`, campos de fuerza, escudos (`SHIELD_RADIUS`) |
| Tested by | `tests/unit/match.test.ts` | Reparto |
| Tested by | `tests/balance/destrozo.test.ts` | Destrozo por munición |
| Decided in | D-013, D-015, D-019, D-052, D-058, D-063 | Atravesar, piano, mano, refuerzos, 3 por ronda, destrozo con 140 bloques |

## Open Questions

- Resueltas en WRK-PLAN-007: el imán y los débiles tienen ya su franja. Queda ver en partidas reales si 6-7 rondas en normal se hacen cortas.
