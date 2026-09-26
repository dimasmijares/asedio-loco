---
id: DOM-JUEGO-003
type: spec
layer: domain
domain: juego
status: active
confidence: medium
version: 1.0.0
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
7. Un proyectil que rompe un bloque lo atraviesa y conserva el 60 % de su velocidad (D-013).
8. Todas las que vuelan notan el arrastre del aire y el viento (DOM-JUEGO-002). Tienen CCD.

| Munición | Rareza | Peso | Efecto | Parámetros clave |
|---|---|---|---|---|
| Pedrusco | común | 22 | Bola de piedra | r 0,45 m, densidad 6, vida 6 s |
| Tronco rodante | común | 14 | Al tocar algo sigue rodando | r 0,36 m, largo 1,9 m, giro mínimo 7 rad/s, vida 7,5 s |
| Racimo de cocos | común | 14 | Se divide en 4 en el punto más alto | abanico cerrado, cocos al 72 % de tamaño, densidad 7 |
| Vaca explosiva | rara | 8 | Muge y explota al tocar algo | radio 3,6 m, fuerza 28 |
| Sandía pegajosa | rara | 7 | Se pega y explota a los 2 s | radio 3,6 m, fuerza 34 |
| Gallina saltarina | rara | 7 | Rebota 3 veces; cada bote es un picotazo | onda de 2,4 m y fuerza 24 por bote |
| Piano | rara | 6 | Se marca dónde caería y cae en vertical desde 22 m a los 1,1 s | densidad 3, viento 0,2 |
| Agujero negro | épica | 3 | Atrae y se traga lo cercano | campo de 5,5 m y 2,2 s, fuerza 50; lo que llega a 1,1 m se rompe; al final, implosión de 4 m |
| Imán | épica | 3 | Arranca el hierro | campo de 10 m y 2,6 s, fuerza 34 (3 % sobre lo que no es hierro); rompe las uniones del hierro |
| Bola de nieve | épica | 3 | Crece mientras rueda | radio de 0,45 a 1,6 m (+0,8 m/s), no baja de 9 m/s rodando |
| Andamio | defensiva | 7 | Reconstruye hasta 10 bloques propios | los más bajos primero; no si el hueco está ocupado o bajo la lava |
| Burbuja | defensiva | 6 | Escudo que absorbe un impacto | radio 7,2 m; el primer proyectil rival que entra desaparece y la burbuja se rompe. Mientras dura, las explosiones y campos de fuera no afectan |

### Constraints

- Cualquier cambio de física o de munición se mide antes y después con la prueba de destrozo y el equilibrio (RULE-001).
- Cada munición tiene icono, color, efecto visual y sonido propios (FEAT-SENSACION-001).

### Examples

- Destrozo medio por disparo contra un castillo entero, 6 disparos por munición (`tests/balance/destrozo.txt`):

  | Munición | Rotos | Movidos | Reyes |
  |---|---|---|---|
  | Pedrusco | 10,7 | 1,7 | 2/6 |
  | Tronco | 1,7 | 2,2 | 0/6 |
  | Cocos | 8,0 | 2,0 | 0/6 |
  | Vaca | 3,8 | 1,5 | 0/6 |
  | Sandía | 3,2 | 1,3 | 0/6 |
  | Gallina | 2,5 | 1,3 | 0/6 |
  | Piano | 10,5 | 2,2 | 0/6 |
  | Agujero negro | 14,2 | 16,2 | 0/6 |
  | Imán | 24,2 | 10,2 | 4/6 |
  | Bola de nieve | 9,5 | 6,3 | 0/6 |
  | **Media** | **8,8** | **4,5** | 6/60 |

- Borde: una mano con pedrusco, vaca y burbuja; el jugador no elige y se acaba el tiempo: dispara el pedrusco.
- Contraejemplo: ninguna rara ha eliminado a un rey en la prueba de destrozo (0 de 24 disparos).

## Acceptance Criteria

- [x] Cada ronda reparte 3 municiones distintas y nuevas.
- [x] Misma semilla, misma munición.
- [x] Las rarezas se respetan aproximadamente.
- [x] En el duelo sale munición más rara.
- [x] La media de destrozo por disparo está medida y guardada en `tests/balance/destrozo.txt`.

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

- El imán rompe 24 bloques de media y mata al rey en 4 de 6 disparos directos. ¿Es demasiado fuerte para una épica? — dimas
- El tronco (1,7 bloques) y la gallina (2,5) siguen siendo flojos para su rareza. — dimas
