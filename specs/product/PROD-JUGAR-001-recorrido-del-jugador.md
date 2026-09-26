---
id: PROD-JUGAR-001
type: spec
layer: product
domain: juego
status: active
confidence: medium
version: 1.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: DOM-JUEGO-001
    relation: uses-data-from
  - id: DOM-JUEGO-003
    relation: uses-data-from
tags:
  - recorrido
  - salas
  - portada
---

# PROD-JUGAR-001 — Recorrido del jugador

## Intent

Describe lo que vive una persona desde que abre el enlace hasta que pide la revancha: sin cuentas ni instalaciones, jugar con amigos pasándoles un enlace, o solo contra bots. Sirve para saber qué pantallas existen, en qué orden y qué se promete en cada una.

## Definition

### Purpose

Que un grupo de hasta 4 amigos pueda jugar una partida de unos 5 minutos en el navegador con solo compartir un enlace, y que una persona sola pueda jugar contra bots o trastear en el campo de pruebas.

### Actors

- **Creador de la sala:** crea la sala y la configura. Suele ser el anfitrión, el que ejecuta la física (ARCH-003).
- **Jugador invitado:** entra con el enlace y elige nombre.
- **Espectador:** el 5.º y siguientes, o quien llega con la partida empezada. Ve la partida pero no puede disparar.
- **Bots:** rellenan huecos libres, en 3 dificultades (FEAT-BOTS-001).
- **Jugador en solitario:** juega contra 1-3 bots en su navegador.

### Flow

1. **Portada** (`/`): título animado sobre la isla girando. Campo «¿Cómo te llamas?» (se recuerda), botones «Crear sala» y «Jugar solo contra bots», y enlaces a «Cómo se juega» y «Ajustes» (FEAT-INTERFAZ-001).
2. **Cómo se juega:** un panel con las reglas y los controles.
3. **Jugar solo** (`#solo`): se eligen los rivales (1-3, por defecto 3) y la dificultad (fácil, normal o difícil). Desde aquí también se entra al **campo de pruebas** (`#sandbox`, munición infinita, FEAT-SANDBOX-001).
4. **Crear sala:** se crea una sala con código de 4 letras y la URL pasa a `/#ABCD`. El lobby muestra «Copiar enlace».
5. **Entrar por enlace:** quien abre `/#ABCD` ve «Entrar en la sala ABCD» (y «Crear otra sala»). Si ya estaba en esa sala (token en `localStorage`), entra directamente y recupera su castillo.
6. **Lobby:** lista de conectados con color y emblema, espectadores, y para el anfitrión: bots de relleno (0 hasta los huecos libres), su dificultad y «¡A la batalla!». Si hay menos de 2 contando bots, el botón pide «Faltan rivales (añade bots)». Si la sala está llena, «La sala está llena: miras como espectador».
7. **Partida:** rondas simultáneas (DOM-JUEGO-001) con munición (DOM-JUEGO-003). En la primera partida sale un tutorial de 3 pasos que avanza haciendo y se puede saltar; en solitario da 10 s más en la ronda 1. Se apunta con el clic derecho y se carga con Espacio (FEAT-CONTROL-001).
8. **Caída de un rey:** repetición a cámara lenta antes de los resultados (FEAT-REPLAY-001).
9. **Final:** ganador y estadísticas divertidas: mayor destrozo, mejor disparo, disparo más ridículo, autogol y castillo más entero (FEAT-SENSACION-001).
10. **Revancha:** en red, solo el anfitrión ve «¡Revancha!»; los demás, «Esperando a que el anfitrión pida la revancha…». Todos vuelven al lobby con la misma sala y los mismos jugadores. En solitario empieza otra partida. «Salir» recarga la página.
11. **Espectador que entra tarde:** recibe el estado completo al llegar, ve la partida en directo y no puede disparar. No ve la repetición de reyes que cayeron antes de su llegada.
12. **Recargar a mitad de partida:** se vuelve al mismo hueco con el token y se pide el estado completo.
13. **Móvil:** en horizontal se apunta arrastrando el dedo y se dispara manteniendo el botón redondo (WRK-TASK-006). Al entrar se pide pantalla completa (Android) y en vertical se pide girar el móvil. Si el creador de la sala es un móvil y hay un ordenador, el ordenador es el anfitrión. Si el anfitrión pasa a segundo plano 2 s, cede la partida a otro jugador. El plan está en `docs/MOVILES.md` (M2-M5 pendientes).

### Acceptance Criteria

- [x] La portada y el campo de pruebas cargan sin errores en consola.
- [x] Se crea una sala, un segundo navegador entra por el enlace y ambos ven la lista de conectados.
- [x] Una partida en solitario contra bots llega a un ganador.
- [x] 4 jugadores juegan hasta el final y todos ven el mismo ganador.
- [x] Un espectador que entra a mitad de partida ve el estado correcto y el servidor rechaza sus disparos.
- [x] Un jugador que recarga a mitad de partida recupera su castillo.
- [x] La revancha vuelve al lobby con la misma sala y los mismos jugadores.
- [x] Un móvil que crea la sala cede el papel de anfitrión a un ordenador.
- [x] Apuntar con el clic derecho y cargar con Espacio dispara con esa potencia.
- [ ] El tutorial de 3 pasos y «Cómo se juega» tienen prueba automática.
- [x] Se puede apuntar y disparar en una pantalla táctil (`tests/e2e/touch.spec.ts`).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | Batería E2E contra producción en CI, repartida en 7 trabajos | 2026-09-26 | low → medium |
| Expert review | Primera prueba del usuario (25-09-2026) que originó `PLAN.md` | 2026-09-25 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/main.ts` | Rutas: portada, `#ABCD`, `#solo`, `#sandbox`, `#bench`, `#physics=` |
| Implemented in | `client/src/ui/lobby.ts` | Portada, «Cómo se juega», jugar solo, lobby |
| Implemented in | `client/src/ui/tutorial.ts` | Tutorial de 3 pasos |
| Implemented in | `client/src/game/match/ui.ts` | Pantalla final, revancha y salir |
| Implemented in | `client/src/game/modes/solo.ts`, `online.ts` | Partida en solitario y en red |
| Tested by | `tests/e2e/smoke.spec.ts` | Portada y campo de pruebas |
| Tested by | `tests/e2e/lobby.spec.ts` | Crear sala y unirse por enlace |
| Tested by | `tests/e2e/solo.spec.ts` | Partida contra bots |
| Tested by | `tests/e2e/multiplayer.spec.ts` | 4 jugadores, espectador, reconexión, anfitrión caído o en segundo plano, móvil, revancha, red mala |
| Tested by | `tests/e2e/controls.spec.ts` | Control con clic derecho y Espacio |
| Decided in | D-031, D-033, D-043, D-044, D-059, D-065 | Migración, espectadores, portada, tutorial, control, móvil |
| External ref | `docs/MOVILES.md` | Viabilidad y plan para móviles |

## Open Questions

- Si el anfitrión se desconecta en el lobby tiene 8 s para volver (D-031); no está claro qué ven los demás mientras tanto.
