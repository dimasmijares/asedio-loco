---
id: WRK-TASK-006
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-004
activates:
  - FEAT-CONTROL-001
  - FEAT-INTERFAZ-001
  - FEAT-CAMARA-001
  - RULE-003
dependencies:
  - id: WRK-TASK-005
    relation: depends-on
tags:
  - moviles
  - control
---

# WRK-TASK-006 — M2: control táctil

## Objective

Que en un móvil en horizontal se pueda apuntar, cargar, disparar y cambiar de objetivo con los dedos (opción A de `docs/MOVILES.md`), con pantalla completa y un aviso de «Gira el móvil» en vertical.

## File Scope

Propuesto:

- `client/src/game/aim.ts` (`AimInput`: eventos `pointer` de tipo `touch`, arrastre = apuntar)
- `client/src/game/camera.ts` (pellizcar para acercar, equivalente a la rueda)
- `client/src/ui/hud.ts` (flechas de castillo objetivo; el botón de disparo ya existe)
- `client/src/ui/tutorial.ts`, `client/src/ui/lobby.ts` («Cómo se juega» y tutorial con textos táctiles)
- `client/src/ui/style.css` (aviso de girar, `touch-action`)
- `client/src/main.ts` (pantalla completa al empezar la partida)
- `tests/e2e/` (prueba táctil nueva) y `playwright.config.ts` si hace falta un proyecto con `hasTouch`

Fuera: física, red, servidor y el HUD compacto (WRK-TASK-007).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-CONTROL-001 | Arrastre horizontal = rumbo y vertical = elevación, como el clic derecho; el botón mantenido carga como Espacio (D1, D2) |
| FEAT-INTERFAZ-001 | Tutorial y «Cómo se juega» dicen «arrastra» y «mantén el botón» en táctil |
| FEAT-CAMARA-001 | Pellizcar hace lo mismo que la rueda (`camera.zoom`) |
| RULE-003 | Desplegar con CI verde; el control con ratón no puede cambiar |

- Sin Pointer Lock en táctil. Un dedo en la escena apunta; dos dedos, pellizco.
- La sensibilidad de Ajustes se aplica también al dedo.
- iOS Safari no bloquea la orientación: el aviso tiene que salir con CSS (`orientation: portrait`), sin depender de la API.
- La pantalla completa necesita un gesto del usuario: pedirla al pulsar «Jugar» o «Empezar».

## Acceptance Criteria

- [ ] Con emulación táctil, arrastrar sobre la escena cambia rumbo y elevación.
- [ ] Mantener el botón de disparo carga la fuerza y al soltar el disparo queda listo con esa potencia.
- [ ] Dos flechas cambian el castillo objetivo; tocar una tarjeta elige la munición.
- [ ] Pellizcar acerca y aleja la cámara.
- [ ] En vertical se ve el aviso de «Gira el móvil» y la partida no se puede jugar tapada.
- [ ] Tutorial y «Cómo se juega» muestran textos táctiles en un dispositivo táctil.
- [ ] La E2E de control con ratón (`controls.spec.ts`) sigue pasando.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Conversión de arrastre a rumbo y elevación, si se saca a una función pura |
| Integration | E2E con `hasTouch` de un Pixel y un iPhone: apuntar, cargar y disparar; aviso en vertical |
| Manual | Jugar dos rondas en un móvil real en horizontal: la emulación no reproduce el tacto ni Safari |

## Evidence

Pendiente.
