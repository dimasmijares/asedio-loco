---
id: WRK-TASK-064
type: spec
layer: work-task
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [PROD-JUGAR-001, FEAT-SALAS-001, FEAT-INTERFAZ-001, DOC-OPS-003]
tags: [flujo, salas, interfaz, revision]
---

# WRK-TASK-064 — Revisión del flujo de partidas

## Objective

Petición del usuario (28-09-2026): revisar cómo se crea una partida, cómo entran los jugadores, cómo se reinicia y cómo se sale, y proponer mejoras. El usuario revisa la propuesta (punto R-07 del lienzo, DOC-OPS-003) antes de implementar nada.

## File Scope

- Solo revisión: esta tarea no cambia código. Cada mejora aprobada pasa a ser una tarea nueva.
- Lienzo de diseño: tablero R-07.

## Implementation Notes

### Flujo actual (leído en `client/src/main.ts`, `client/src/ui/lobby.ts`, `client/src/game/match/ui.ts`, `client/src/game/modes/online.ts`, `solo.ts` y `server/index.ts`)

1. **Portada:** nombre, «Crear sala» o «Jugar solo contra bots». Con un enlace de sala: «Entrar en la sala ABCD» y «Crear otra sala». No se puede escribir un código a mano.
2. **Sala (lobby):** enlace con «Copiar enlace», 4 plazas (jugador, bot o «Plaza libre»), y el anfitrión elige cuántos bots, la dificultad y «Empezar partida». Los demás ven «Esperando a que el anfitrión empiece…». No hay botón para salir de la sala ni para cambiar el nombre.
3. **Partida:** no hay forma de salir ni de volver a la portada salvo cerrar o recargar la pestaña. En solitario tampoco se puede pausar.
4. **Final:** el anfitrión ve «Revancha» y «Salir»; los demás, «Esperando a que el anfitrión pida la revancha…» y «Salir». «Revancha» vuelve al lobby y el anfitrión tiene que pulsar «Empezar partida» otra vez (dos pasos). «Salir» recarga la página sin avisar al servidor: el jugador queda como «Desconectado» ocupando plaza.
5. **Quien llega con la partida empezada** entra como espectador sin saber cuándo podrá jugar; pasa a jugar en la revancha si hay hueco.
6. **Solitario:** al final, «Revancha» repite con los mismos rivales y dificultad; para cambiarlos hay que salir a la portada y volver a entrar en «Jugar solo».

### Propuesta (F1-F9, en orden de valor)

| Código | Mejora | Por qué |
|---|---|---|
| F1 | **Salir en cualquier momento.** En el menú del engranaje, «Salir de la partida» con confirmación. Online, tu castillo pasa a bot desde la ronda siguiente (la regla que ya confirmaste); en solitario, vuelve a la portada. | Hoy la única salida es cerrar la pestaña. |
| F2 | **Revancha en un paso.** «Revancha» empieza otra partida con los mismos jugadores y ajustes, sin pasar por la sala. Botón secundario «Volver a la sala» para cambiar bots, dificultad o esperar a más gente. | Hoy son dos pasos y los invitados no saben qué pasa. |
| F3 | **Salir de la sala de verdad.** Botón «Salir de la sala» en el lobby y mensaje `leave` al servidor: la plaza queda libre al momento. Si sale el anfitrión, hereda otro jugador. | Hoy quien se va sigue ocupando plaza como «Desconectado». |
| F4 | **Invitar más fácil.** Código de sala grande y legible; en móvil, botón «Compartir» del sistema (WhatsApp, etc.); en la portada, campo «Unirse con código». | Hoy solo se entra con el enlace copiado. |
| F5 | **La sala la gestiona el anfitrión tocando las plazas.** Tocar «Plaza libre» añade un bot; tocar un bot lo quita; tocar un jugador desconectado lo quita. Sustituye al desplegable de bots. | Más directo y se entiende sin leer. |
| F6 | **Nombre editable en la sala** y, si se deja vacío, un nombre divertido al azar en lugar de «Jugador 2». | El servidor ya acepta el cambio de nombre, pero no hay interfaz. |
| F7 | **Quien llega tarde sabe qué pasa:** «Partida en curso: entrarás a jugar en la próxima» y el marcador de la partida a la vista. | Hoy entra como espectador sin explicación. |
| F8 | **Final en solitario:** «Otra partida» (mismos rivales), «Cambiar rivales» (vuelve a elegir bots y dificultad) y «Salir». | Hoy cambiar la dificultad obliga a pasar por la portada. |
| F9 | **Pausa en solitario** al abrir el menú del engranaje. | En solitario no hay nadie esperando. |

Cambios de protocolo (RULE-002): F2 (arrancar la revancha sin lobby) y F3 (`leave`). F5 y F6 usan mensajes que ya existen (`config`, `name`).

## Acceptance Criteria

- [ ] Propuesta publicada como R-07 en el lienzo.
- [ ] El usuario aprueba, descarta o ajusta cada mejora (F1-F9); cada aprobada es una tarea nueva de WRK-PLAN-011.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Revisión | El usuario, sobre el tablero R-07 |

## Evidence

Pendiente.
