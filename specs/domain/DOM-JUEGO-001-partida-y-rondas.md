---
id: DOM-JUEGO-001
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
  - id: DOM-JUEGO-004
    relation: uses-data-from
tags:
  - rondas
  - eliminacion
  - victoria
---

# DOM-JUEGO-001 — Partida y rondas

## Intent

Fija las reglas de una partida: quién juega, cómo se suceden las rondas simultáneas, cuándo cae un rey y quién gana. Es la base del resto de reglas del juego (escalada, munición) y lo que el anfitrión aplica en cada partida, en solitario y en red.

## Definition

### Concept

Una **partida** enfrenta a 2-4 castillos, uno por hueco (0-3) de la isla. Cada castillo tiene un **rey**. Todos juegan a la vez por **rondas**: todos apuntan, todos disparan, la física resuelve el destrozo y se ven los resultados. Gana el último rey en pie. El estado (`MatchState`) es serializable y lo decide solo el anfitrión.

### Rules

1. Hay como mucho 4 jugadores (`MAX_PLAYERS`). Los humanos ocupan sus huecos y los bots de relleno, los huecos libres más bajos. Hacen falta al menos 2 (humanos conectados más bots) para empezar.
2. La partida empieza con una fase `intro` de 3 s (1 s en modo rápido) y luego la ronda 1.
3. Cada ronda recorre las fases `aim` → `impact` → (`replay`) → `results`. Al acabar `results` se comprueba si hay ganador; si lo hay, la fase pasa a `over`.
4. **Apuntado:** 20 s en todas las rondas, también en el duelo (3 s con `?fast=1`). En solitario, si toca el tutorial, la ronda 1 tiene 10 s más.
5. **Adelanto:** si todos los jugadores vivos han confirmado su disparo, la ronda sale 0,6 s después, sin esperar al reloj.
6. Si se acaba el tiempo, cada jugador vivo dispara con la puntería y la munición que tenga en ese momento. Un jugador desconectado también dispara así (no pasa a ser un bot).
7. **Impacto:** los disparos salen por orden de hueco, separados 0,45 s. La fase termina cuando todos han salido, han pasado más de 2,2 s, no queda ningún proyectil y todo está quieto; como mucho, 9 s (7 s en modo rápido) más 0,45 s por disparo.
8. **Repetición:** si en la ronda cayó algún rey, antes de los resultados hay una fase `replay` de 5 s por rey (1,5 s en modo rápido), con un máximo de 2 reyes. La física se pausa mientras dura.
9. **Resultados:** 3,5 s (1 s en modo rápido), con los bloques perdidos y causados por cada uno y una frase según lo ocurrido.
10. **Eliminación.** El rey cae, en cualquier fase, si:
    - su altura baja de −1,2 m, o sale de la isla por debajo de 0,5 m, o se pierde en el vacío (`fell`);
    - la base de su cápsula queda a menos de 6 cm sobre la lava (`lava`);
    - está por debajo de 0,95 m y fuera de su zona de castillo (5,6 m + 0,2 m de margen desde el centro) (`outside`);
    - lo aplastan: fuerza de contacto de más de 600, daño acumulado ≥ 1 o una explosión cercana (`crushed`). Los umbrales están en DOM-JUEGO-004.
11. La eliminación se apunta a quien golpeó al rey por última vez (`lastHitBy`), que suma una baja si no es el propio jugador.
12. **Victoria:** gana el último rey en pie. Si caen todos los que quedaban en la misma ronda, gana el que tenga más bloques en pie y, si empatan, el que cayó el último. Al terminar la ronda 24 (`MAX_ROUNDS`) gana el vivo con más bloques en pie.
13. **Cierre rápido:** si durante el apuntado solo queda un rey (por ejemplo, la lava se ha llevado a otro al empezar la ronda), el reloj baja a 0,5 s.
14. **Duelo:** con exactamente 2 reyes vivos. No acorta la ronda; solo cambia el reparto de munición (DOM-JUEGO-002).
15. **Estadísticas:** el anfitrión lleva por jugador los bloques rivales destruidos, los propios perdidos, bajas, mejor disparo (más bloques en una ronda), disparos al aire, peor fallo en metros y bloques propios rotos. La pantalla final las presenta (FEAT-SENSACION-001).

### Constraints

- Solo el anfitrión aplica estas reglas; los clientes reciben el estado (ARCH-003).
- Duración de referencia de la especificación original: 4-6 minutos por partida.

### Examples

- 4 bots en normal: de media 8,6 rondas y unos 274 s (`ultimo-normal.txt`, 8 partidas, tras WRK-TASK-023).
- Dos jugadores confirman a los 5 s y un tercero no: la ronda sigue hasta los 20 s.
- Borde: un humano desconectado sigue vivo y nunca confirma (`client/src/game/match/host.ts` solo marca `locked` a los bots y a quien manda su disparo), así que con un desconectado en la partida la ronda nunca se adelanta y agota los 20 s.
- Borde: un rey sale despedido y cae de pie en el patio de su propio castillo: sigue vivo (está dentro de su zona). Si cae en el césped, fuera de la zona, queda eliminado (`outside`).
- Borde: los dos últimos reyes caen en la misma ronda: gana quien conserva más bloques, aunque su rey cayera primero.
- Contraejemplo: un castillo sin bloques con el rey en pie sigue en la partida; no hay barra de vida.

## Acceptance Criteria

- [x] Se apunta durante 20 s también en el duelo.
- [x] Gana el último rey en pie; si caen todos, desempata el orden de caída.
- [ ] Si caen todos, desempatan antes los bloques en pie (sin prueba: `match.test.ts` solo prueba castillos con los mismos bloques).
- [x] Eliminar dos veces a un jugador no cuenta doble.
- [x] Una partida de 4 jugadores en red llega a un ganador y todos los clientes ven el mismo ganador y el mismo número de rondas.
- [x] Una partida en solitario contra bots llega a un ganador.
- [x] Todos los clientes ven el mismo número de repeticiones.
- [ ] El adelanto por «todos listos» (0,6 s) tiene prueba propia.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/match.test.ts` (rondas, eliminación y victoria) | 2026-09-26 | low → medium |
| Testing | `tests/e2e/multiplayer.spec.ts`, `tests/e2e/solo.spec.ts` | 2026-09-26 | — |
| Production data | `tests/balance/ultimo-facil.txt` (12,5 rondas, 271 s), `ultimo-normal.txt` (8,6, 274 s), `ultimo-dificil.txt` (7,4, 244 s; tras WRK-TASK-023) | 2026-09-26 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/match.ts` | Duraciones, `startRound`, `eliminate`, `checkWinner`, `MAX_ROUNDS` |
| Implemented in | `client/src/game/match/host.ts` | Fases, adelanto (`lockGrace`), escalonado (`STAGGER`), repetición |
| Implemented in | `client/src/game/sim/sim.ts` | `checkKings`, `KING_CRUSH_FORCE` |
| Tested by | `tests/unit/match.test.ts` | Rondas y victoria |
| Tested by | `tests/e2e/multiplayer.spec.ts` | «4 jugadores hasta el final…» |
| Decided in | D-024, D-058, D-061 | Empates, 20 s y 3 municiones, repetición |
| External ref | `PLAN.md` (D1, D4, D5) | Decisiones del usuario |

## Open Questions

- La especificación original pedía partidas de 4-6 minutos; con bots difíciles salen unos 3,4. ¿Es aceptable? — dimas
- `PlayerState.ammo` dice «máx. 2» en un comentario, pero la mano es de 3 (`HAND`). Comentario desfasado.
