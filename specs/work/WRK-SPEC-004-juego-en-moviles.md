---
id: WRK-SPEC-004
type: spec
layer: work-spec
scope: ephemeral
status: active
confidence: medium
version: 0.2.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
activates:
  - ARCH-003
  - ARCH-005
  - FEAT-CONTROL-001
  - FEAT-INTERFAZ-001
  - FEAT-SALAS-001
  - PROD-JUGAR-001
  - RULE-002
  - RULE-003
  - RULE-004
dependencies:
  - id: WRK-SPEC-002
    relation: depends-on
tags:
  - moviles
---

# WRK-SPEC-004 — Juego en móviles

## Problem Statement

El juego está pensado para ratón y teclado. En un móvil hoy no se puede jugar:

- **Control:** apuntar necesita el clic derecho y cargar, Espacio. El botón de disparo sí carga, pero no hay forma de apuntar. Bloqueante.
- **HUD:** en vertical el título se parte y el marcador queda debajo de la lista de jugadores; en horizontal (360 px de alto) la lista y el panel de controles ocupan media pantalla.
- **Rendimiento:** un paso de física cuesta unos 5 ms en un PC de sobremesa; en un móvil de gama media se estiman 12-18 ms, en el límite de los 16,7 ms. Con densidad 2,6, la calidad media y alta dibujan demasiados píxeles.
- **Segundo plano:** si el anfitrión cambia de app o de pestaña, `requestAnimationFrame` se para y la partida se congela para todos. Esto pasaba también en el PC.

Se sabe por el estudio de la etapa 6 (`docs/MOVILES.md`): capturas en un Pixel 7 emulado, las medidas de `CLAUDE.md` y el código. No se ha probado en un móvil real.

## Proposed Change

Hacer el juego jugable en un móvil **en horizontal**, sin tocar la física, la red ni el servidor más allá del saludo.

**In scope:**

- Ceder el anfitrión al pasar a segundo plano, y anfitrión preferente de escritorio (M1).
- Control táctil: arrastrar un dedo para apuntar (opción A), pantalla completa y aviso de «Gira el móvil» (M2).
- HUD compacto para alturas menores de 500 px (M3).
- Perfil de rendimiento móvil automático (M4).
- PWA opcional (M5).

**Out of scope:**

- Vertical completo: cámara y HUD distintos, coste medio-alto por poco beneficio.
- Joystick virtual (opción B) y «tocar el punto» con `solveAim` (opción C): la B tapa la escena y la C quita mérito a acertar.
- Tiendas de aplicaciones.
- Opción de 3 castillos: solo si el perfil móvil no basta (ver Open Questions).

## Knowledge Context

| Spec | Why it applies |
|------|----------------|
| ARCH-003 | Migración de anfitrión y `yield`; el saludo dice si el cliente es móvil |
| ARCH-005 | Calidad adaptativa, densidad de píxeles y topes de fragmentos y partículas |
| FEAT-CONTROL-001 | El táctil tiene que equivaler al clic derecho, a Espacio y a la rueda |
| FEAT-INTERFAZ-001 | HUD, tutorial y ajustes en pantalla pequeña |
| FEAT-SALAS-001 | Elección de anfitrión: primero los ordenadores |
| PROD-JUGAR-001 | El recorrido desde el enlace hasta la partida, ahora en el móvil |
| RULE-002 | Cambios en el saludo o en el protocolo suben `PROTOCOL_VERSION` |
| RULE-003 | Cada etapa M se cierra con CI verde contra producción |
| RULE-004 | El perfil móvil tiene que caber en el presupuesto de rendimiento |

## Constraints

- El control con ratón y teclado no puede empeorar — FEAT-CONTROL-001.
- Una etapa a medias no se deja en producción — RULE-003.
- iOS Safari: orientación y pantalla completa funcionan peor; el aviso de «Gira el móvil» tiene que funcionar siempre — `docs/MOVILES.md`, riesgos.
- Las cifras de rendimiento en móvil son estimaciones hasta medir en un teléfono real — `docs/MOVILES.md`.

## Acceptance Criteria

- [x] Un anfitrión que pasa a segundo plano cede la partida y otro jugador la sigue llevando (M1).
- [ ] En un móvil en horizontal se puede apuntar, cargar, disparar y cambiar de objetivo con los dedos (M2).
- [ ] En vertical aparece el aviso de «Gira el móvil».
- [ ] Con 360 px de alto el HUD no tapa más de lo imprescindible y nada se solapa (M3).
- [ ] Un móvil arranca con el perfil de rendimiento móvil y la partida en solitario es jugable en un teléfono real de gama media (M4).
- [ ] Las E2E con emulación táctil pasan contra producción.

## Open Questions

- [ ] ¿Hace falta la opción de 3 castillos para móviles de gama baja? — dimas, tras medir en un móvil real (WRK-TASK-008).
- [ ] ¿Se hace la PWA (M5) o basta con el navegador? — dimas, tras probar M2-M4 en su teléfono.
- [ ] ¿Hacen falta botones de ajuste fino de rumbo y elevación por la precisión del dedo? — dimas, tras probar M2.
