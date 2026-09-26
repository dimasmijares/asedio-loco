---
id: FEAT-CONTROL-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: PROD-JUGAR-001
    relation: implements
  - id: DOM-JUEGO-001
    relation: constrained-by
  - id: DOM-JUEGO-003
    relation: uses-data-from
  - id: ARCH-003
    relation: constrained-by
supersedes: null
tags:
  - control
  - punteria
  - raton
  - teclado
---

# FEAT-CONTROL-001 — Puntería y disparo

## Intent

Cada ronda el jugador tiene que fijar rumbo, elevación y fuerza de su disparo en 20 s, sin que el control estorbe. Esta especificación fija cómo se apunta con ratón y teclado, cómo se carga la fuerza y cuándo el disparo queda cerrado.

## Definition

### Purpose

Traducir ratón y teclado a una puntería `Aim {yaw, pitch, power}` y a un disparo definitivo (`locked`). Sustituye al tirachinas con clic izquierdo (D-007), que al usuario le resultó poco intuitivo.

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| Clic derecho mantenido + ratón | Pointer Events | Sí | Horizontal = rumbo (0,0035 rad/px), vertical = elevación (0,0028 rad/px) |
| Espacio mantenido | Teclado | Sí | Carga la fuerza. También el botón de disparo `#confirm` mantenido con el clic izquierdo |
| A/D (o ←/→) | Teclado | No | Rumbo a 0,6 rad/s |
| W/S (o ↑/↓) | Teclado | No | Elevación a 0,5 rad/s |
| Mayúsculas | Modificador | No | Modo precisión: ×0,25 en ratón y teclado |
| Q / E, Tab (Mayús+Tab al revés) | Teclado | No | Castillo objetivo anterior / siguiente; gira el rumbo hacia él |
| 1 / 2 / 3 o clic en la tarjeta | Teclado / ratón | No | Munición de la mano (3 por ronda) |
| Rueda | Ratón | No | Zoom de la cámara (FEAT-CAMARA-001) |
| `settings.sensitivity` | número 0,4-1,8 | No | Multiplica el movimiento del ratón (Ajustes) |
| `?nolock=1` | URL | No | Desactiva el bloqueo del puntero (pruebas) |

### Behavior

1. **Solo cuando se puede apuntar:** jugador vivo, fase `aim` y sin `locked`. Fuera de eso la entrada está desactivada y el clic derecho mueve la cámara.
2. **Apuntar:** el clic derecho pide Pointer Lock. Salvaguardas (D-062):
   - Se ignora el primer movimiento tras bloquear (Chrome manda un salto falso).
   - Cada movimiento se limita a ±200 px.
   - Si con el puntero bloqueado `movementX/Y` vale 0 pero el cursor se ha movido (eventos sintéticos), se usa el cursor.
   - Perder el foco (`blur`) o el bloqueo termina el apuntado y cancela la carga.
3. **Límites:** elevación entre 12° y 75° (por defecto 40°); fuerza 0-1, que da 9-33 m/s de salida.
4. **Cargar:** al pulsar Espacio la fuerza vuelve a 0 y sube lineal hasta 100 % en 1,5 s (`CHARGE_TIME`), donde se queda.
5. **Soltar:**
   - Menos de 0,12 s (`MIN_CHARGE`): no dispara y avisa «Mantén Espacio».
   - Si no, manda `{aim, locked: true}`. El disparo es definitivo: el anfitrión ignora cualquier entrada posterior de ese jugador en la ronda.
6. **Vista previa** (`TrajectoryPreview`, hasta 26 puntos, nunca el punto de caída):
   - Sin cargar (`guide`): tramo tenue (opacidad 0,55) con fuerza fija 0,55 hasta el 30 % del vuelo.
   - Cargando (`charge`): la fuerza actual hasta el 60 % del vuelo, así que la parábola crece. Usa el arrastre y el viento de la munición elegida.
7. **Red:** la puntería se manda como mucho a ~10 Hz. Los demás ven la catapulta girar y tensarse (D-032).
8. **Tiempo agotado sin soltar:** el anfitrión dispara con la última puntería recibida.

### Outputs

| Output | Type | Notes |
|---|---|---|
| `PlayerInput {aim, selected, target, locked}` | `MatchSource.send` | Al anfitrión local o por red (`in`) |
| Catapulta propia | Vista | Gira con `yaw` y se tensa con `power` |
| HUD | DOM | Potencia en % y m/s, elevación en grados, botón «Fuerza N %» y «✔ Disparo listo» |

### Known Limitations

- Pensado para ratón y teclado. En pantallas táctiles no se puede apuntar (no hay clic derecho). El botón de disparo sí responde al dedo, pero solo carga.
- Con el puntero bloqueado, Chromium sin interfaz entrega mal los movimientos sintéticos: las pruebas usan `?nolock=1`.

## Acceptance Criteria

- [x] Con clic derecho, mover el ratón a la derecha gira el rumbo a la derecha y hacia arriba sube la elevación.
- [x] Una pulsación corta de Espacio no dispara.
- [x] Mantener Espacio sube la fuerza y la parábola no encoge.
- [x] Al soltar, el jugador queda `locked` con esa fuerza (> 30 %) y otra carga no la cambia.
- [x] Con todos listos, la ronda arranca antes de agotar los 20 s.
- [ ] La fuerza llega al 100 % en 1,5 s ± un fotograma (sin prueba que mida el tiempo).
- [ ] Mayúsculas reduce a la cuarta parte el giro por píxel (sin prueba).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/controls.spec.ts` en CI contra producción | 2026-09-26 | low → medium |
| External source | `PLAN.md` etapa 2 y decisiones D1-D3 del usuario (25-09-2026) | 2026-09-25 | Define el comportamiento esperado |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/game/aim.ts` | `AimInput`, `CHARGE_TIME`, `MIN_CHARGE`, `TrajectoryPreview` |
| Implemented in | `client/src/game/match/ui.ts` | `onAim`, `fire`, `cycleTarget`, `selectAmmo`, envío a 10 Hz |
| Implemented in | `client/src/ui/hud.ts` | `bindCharge`, `setCharge`, `setAimInfo`, `showConfirm` |
| Implemented in | `shared/ballistics.ts` | `clampAim`, `PITCH_MIN/MAX`, `POWER_MIN/MAX` |
| Implemented in | `client/src/game/match/host.ts` | `setInput` ignora entradas tras `locked` |
| Tested by | `tests/e2e/controls.spec.ts` | Clic derecho, Espacio, disparo definitivo |
| Decided in | D-059, D-062, D-032 | Control nuevo, salvaguardas del puntero, puntería entre jugadores |
| External ref | `PLAN.md` etapa 2 | Petición del usuario |

## Open Questions

- ¿Lo ha validado el usuario jugando tras la etapa 2? `PLAN.md` recoge la petición previa, no una prueba posterior. Si lo confirma, la confianza pasa a `high`. — dimas
- `PREVIEW_TIME` (0,42 s) en `shared/ballistics.ts` ya no se usa: ¿se borra? — dimas
