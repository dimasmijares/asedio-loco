---
id: ARCH-002
type: spec
layer: architecture
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: DOM-JUEGO-004
    relation: uses-data-from
  - id: DOM-JUEGO-003
    relation: uses-data-from
supersedes: null
tags:
  - capas
  - simulacion
  - eventos
---

# ARCH-002 — Capas del código y eventos de simulación

## Intent

La misma partida tiene que funcionar en solitario, en red, en pruebas de Node y en escenas de prueba. Esta especificación fija qué capa hace cada cosa y cómo se comunican, para que la lógica no se duplique y la vista no dependa de dónde se ejecuta la física.

## Definition

### Context

- Cliente, servidor y pruebas de Node necesitan las mismas reglas (mapa, castillo, munición, balística, partida).
- En red, solo el anfitrión simula la física (ARCH-003). Los demás clientes tienen que dibujar lo mismo sin simular.
- Las pruebas de equilibrio y de física corren en Node, sin DOM ni WebGL.

### Decision

Tres capas:

1. **`shared/`: lógica pura.** Sin DOM, sin Three.js y sin Rapier. Solo importa de sí misma. La usan el Worker, el cliente y las pruebas. Contiene protocolo, mapa, castillo, materiales, munición, balística, fractura, reglas de la partida (`match.ts`), bots y utilidades con semilla (`math.ts`).
2. **Simulación (`client/src/game/sim/`): solo en quien es anfitrión.** `Sim` envuelve Rapier y emite una cola de `SimEvent`. `MatchHost` (`match/host.ts`) aplica las reglas de la partida sobre esa simulación. Depende de una interfaz (`HostEnv`), así que también corre en Node para las pruebas de equilibrio.
3. **Vista (`view.ts`, `render/`, `match/ui.ts`): en todos los clientes.** Solo se alimenta de dos cosas:
   - Eventos `SimEvent`: `rm`, `spawn`, `hit`, `boom`, `proj`, `projEnd`, `king`, `joint`, `fx`, `shield`, `grow`, `dmg`.
   - Poses de cuerpos (`setBody(id, p, q)`).

   En local vienen de `Sim`. En red, de los mensajes `tk`/`full` del anfitrión, con los mismos eventos. La excepción son los fragmentos (`debris.ts`): cada cliente los simula por su cuenta a partir del evento `rm` (ARCH-004).

**Convención de ids** (un único espacio numérico compartido por red, vista y repetición):

| Cuerpo | Id | Origen |
|---|---|---|
| Bloque `i` del hueco `slot` | `slot*200 + 1 + i` | `BLOCK_ID_STRIDE` en `shared/castle.ts` |
| Rey del hueco `slot` | `1000 + slot` | `KING_ID_BASE`, `kingId()` |
| Proyectil | `2000`, `2001`… | `Sim.nextProj` |

Con 140 bloques por castillo (DOM-JUEGO-004) cabe de sobra en 200. Los fragmentos no tienen id: son locales.

**Modos** (`client/src/game/modes/`, elegidos por la ruta en `client/src/main.ts`):

| Ruta | Modo | Quién simula |
|---|---|---|
| `#sandbox` | `sandbox.ts`: campo de pruebas de las 12 municiones | El navegador |
| `#physics=<escena>` | `physicsTest.ts`: escenas de física | El navegador |
| `#solo` | `solo.ts`: partida contra bots | El navegador, con `MatchHost` |
| `#ABCD` | `online.ts`: partida en red | El anfitrión; el resto, `NetClient` |
| `#bench` | `bench.ts`: escena de rendimiento (ARCH-005) | El navegador |

### Rationale

- Separar `shared/` permite probar las reglas en menos de un segundo con Vitest y simular partidas enteras sin navegador (D-022).
- Que la vista solo consuma eventos y poses hace que el modo en red no necesite una vista distinta, y que la repetición pueda grabar lo que llega a la vista (D-061).
- Los clientes no simulan porque la física no es determinista entre navegadores (D-030).

### Consequences

- Todo efecto visible de la física tiene que salir como `SimEvent` o como pose. Si se dibuja algo leyendo `Sim` directamente, en red no se verá.
- Añadir un tipo de evento o un campo cambia el protocolo de partida (ARCH-003).
- Pasar de 200 bloques por castillo rompe la convención de ids y la compatibilidad de red.

## Acceptance Criteria

- [x] Ningún archivo de `shared/` importa DOM, Three.js ni Rapier (lo exige el uso en Node de `tests/balance`).
- [x] `MatchHost` juega partidas completas en Node sin navegador.
- [x] Las 4 escenas de física dan el mismo resultado en Node y en el navegador.
- [x] Un cliente en red ve, al converger cada ronda, los mismos bloques en pie que el anfitrión (margen de 2).
- [ ] Ninguna comprobación automática impide importar DOM o Rapier desde `shared/` (hoy lo detectarían las pruebas de Node solo si se ejecuta ese código).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `npm test` y `tests/balance` en Node; E2E multijugador en CI | 2026-09-26 | low → medium |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/` | Lógica pura compartida |
| Implemented in | `client/src/game/sim/sim.ts` | `Sim`, `SimEvent`, `DT` |
| Implemented in | `client/src/game/match/host.ts` | `MatchHost` y la interfaz `HostEnv` |
| Implemented in | `client/src/game/view.ts` | Consume `SimEvent` y poses |
| Implemented in | `shared/castle.ts` | `BLOCK_ID_STRIDE`, `KING_ID_BASE`, `kingId`, `slotOfBlock` |
| Implemented in | `client/src/main.ts`, `client/src/game/modes/` | Rutas y modos |
| Tested by | `tests/unit/physics.test.ts`, `tests/e2e/physics.spec.ts` | Escenas en Node y en navegador |
| Tested by | `tests/balance/balance.test.ts` | Partidas de bots en Node |
| Tested by | `tests/e2e/multiplayer.spec.ts` | Consistencia entre clientes |
| Decided in | D-009, D-022, D-030, D-048, D-061 | Fragmentos locales, equilibrio en Node, sin física en clientes, escenas en Node, repetición grabada |
