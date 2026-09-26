---
id: WRK-PLAN-004
type: spec
layer: work-plan
scope: ephemeral
status: active
confidence: medium
version: 0.2.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
parent: WRK-SPEC-004
activates:
  - ARCH-003
  - ARCH-005
  - FEAT-CONTROL-001
  - FEAT-INTERFAZ-001
  - RULE-003
tags:
  - moviles
---

# WRK-PLAN-004 — Juego en móviles

## Approach

Cinco etapas pequeñas o medianas (M1-M5), desplegadas por separado como las de WRK-PLAN-002. No cambian ni la física, ni la red, ni el servidor, salvo el saludo (`mobile`) y el mensaje `yield` de M1.

Opciones elegidas en `docs/MOVILES.md`:

- **Solo horizontal**, con aviso de «Gira el móvil» en vertical y pantalla completa (API Fullscreen) para ganar unos 60 px.
- **Control táctil A:** arrastrar un dedo sobre la escena apunta (horizontal, rumbo; vertical, elevación). Botón grande de disparo que se mantiene pulsado (ya existe), tarjetas de munición (ya funcionan), dos flechas para el objetivo y pellizcar para acercar.
- **HUD compacto** por debajo de 500 px de alto.
- **Perfil móvil automático** con `pointer: coarse`: calidad baja, densidad 1 y 30 fps fuera del impacto.
- **Anfitrión preferente de escritorio** y cesión del anfitrión en segundo plano.

### Orden y paralelismo

M1 primero, porque arreglaba un fallo que ya existía en el PC. Está hecha.

`docs/MOVILES.md` propone M2 y M3 «juntas». Aquí van **seguidas, no en paralelo**: las dos tocan `client/src/ui/hud.ts` y `client/src/ui/style.css`, y M3 mueve el botón de disparo, que es la pieza central del control táctil de M2. Con una sola tarea activa por copia de trabajo, repartirlas no ahorra tiempo y sí abre conflictos. M3 depende de M2, y las dos se anuncian al usuario a la vez, cuando el juego ya sea jugable en el móvil.

M4 solo depende de M1. Sus archivos (`stage.ts`, `game.ts`, `view.ts`) no se cruzan con M2 ni M3, así que podría adelantarse. Se recomienda después de M3 porque la prueba en un teléfono real necesita poder jugar con los dedos.

M5 depende de M2: el manifiesto fija la orientación horizontal y la pantalla completa que M2 introduce. Es opcional.

## Task Breakdown

| Task | Objective | Depends on | Size |
|------|-----------|------------|------|
| WRK-TASK-005 | El anfitrión en segundo plano cede la partida; un móvil cede el papel a un ordenador | — | S |
| WRK-TASK-006 | Control táctil, pantalla completa, aviso de girar y tutorial táctil | WRK-TASK-005 | M |
| WRK-TASK-007 | HUD compacto para alturas menores de 500 px | WRK-TASK-006 | M |
| WRK-TASK-008 | Perfil de rendimiento móvil y 30 fps fuera del impacto | WRK-TASK-005 | S |
| WRK-TASK-009 | PWA instalable en horizontal y pantalla completa | WRK-TASK-006 | S |

## Estado

| Orden | Tarea | Estado | Dependencias | Entrega |
|---|---|---|---|---|
| M1 | WRK-TASK-005 · Anfitrión en segundo plano | completed | — | `6e59421`, 25-09-2026. D-065, protocolo v5 |
| M2 | WRK-TASK-006 · Control táctil | completed | WRK-TASK-005 | Dedo para apuntar, botón redondo 🔥, flechas, pellizco, aviso de girar |
| M3 | WRK-TASK-007 · HUD compacto | completed | WRK-TASK-006 | Marcador sin nombres, todo más pequeño, botón en la esquina, final en dos columnas |
| M4 | WRK-TASK-008 · Perfil de rendimiento móvil | draft | WRK-TASK-005 | — |
| M5 | WRK-TASK-009 · PWA (opcional) | draft | WRK-TASK-006 | — |

## Architecture Impact

| Area | Impact | Spec affected |
|------|--------|---------------|
| Protocolo | `hello` lleva `mobile`; mensaje `yield` del anfitrión (v5, ya hecho) | ARCH-003 |
| Elección de anfitrión | Los ordenadores tienen preferencia al empezar y al heredar | ARCH-003 |
| Entrada | `AimInput` recibe eventos `pointer` de tipo `touch` además del ratón | none |
| Rendimiento | Perfil de calidad nuevo para móvil y límite de fps fuera del impacto | ARCH-005 |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| iOS Safari no bloquea la orientación ni da pantalla completa real | high | medium | El aviso de «Gira el móvil» funciona siempre; la pantalla completa real en iPhone solo llega con la PWA (M5) |
| Un móvil de gama baja no mueve la física de un anfitrión en solitario | medium | high | Perfil móvil (M4); si no basta, 3 castillos o jugar en red con un PC de anfitrión |
| Arrastrar con el dedo es menos fino que el ratón | medium | medium | Sensibilidad de Ajustes; botones de ajuste fino si hace falta |
| La emulación táctil de Playwright no refleja un móvil real | medium | medium | Prueba manual en un teléfono con los pasos de `docs/MOVILES.md` |
| M2 rompe el control con ratón | low | high | La E2E de control con ratón (`controls.spec.ts`) sigue en la batería |

## Dependencies

- Un móvil real de gama media para medir y jugar — dimas — antes de cerrar M4.
- Un iPhone (o alguien con uno) para comprobar el aviso de girar y la PWA — dimas — antes de cerrar M2 y M5.
