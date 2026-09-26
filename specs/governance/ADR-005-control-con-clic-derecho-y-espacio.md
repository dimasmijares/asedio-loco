---
id: ADR-005
type: adr
layer: governance
status: accepted
confidence: high
version: 1.0.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
deciders:
  - dimas
dependencies:
  - id: FEAT-CONTROL-001
    relation: implements
supersedes: null
tags:
  - control
  - interfaz
---

# ADR-005 — Apuntar con el clic derecho y cargar la fuerza manteniendo Espacio

## Context

El control original era un tirachinas: arrastrar con el clic izquierdo fijaba rumbo y potencia, y la elevación iba con la rueda o W/S. En la primera prueba, el usuario lo encontró poco intuitivo. Un arrastre 2D no puede fijar bien tres parámetros a la vez.

## Decision

- **Clic derecho mantenido + ratón:** horizontal = rumbo, vertical = elevación, con el puntero bloqueado (Pointer Lock).
- **Espacio mantenido:** la fuerza sube de 0 a 100 % en 1,5 s y se queda al máximo. La parábola de la vista previa (el primer 60 % del vuelo) crece con ella.
- **Al soltar, el disparo es definitivo** para esa ronda. Una pulsación de menos de 0,12 s no dispara. El botón de disparo también se mantiene pulsado para cargar.
- Clic izquierdo solo para la interfaz; la rueda acerca la cámara. A/D, W/S y Q/E quedan como alternativa; 1/2/3 eligen munición.
- Bloqueo del puntero con dos salvaguardas: se ignora el primer movimiento y cada movimiento se limita a 200 px.

## Consequences

**Positive:**

- Un eje por gesto: más fácil de explicar y de dominar.
- Los demás ven crecer la parábola ajena (la puntería ya viaja a 10 Hz).

**Negative:**

- Necesita ratón y teclado: en táctil no se puede apuntar. El plan de móviles (M2) propone arrastrar un dedo como equivalente.
- Pointer Lock tiene comportamientos raros en Chrome y en eventos sintéticos; las pruebas usan `?nolock=1`.
- El disparo no se puede corregir tras soltar.

**Neutral:**

- La cámara de apuntado se retrasa y mira más alto para que quepa la parábola.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Tirachinas con clic izquierdo (D-007) | Poco intuitivo según el usuario |
| Espacio que solo confirma («¡Listo!») | Sin gesto de fuerza; el usuario pidió cargar |
| Fuerza que sube y baja en bucle | El usuario eligió que se quede al máximo (D2) |

## Knowledge Impact

- [ ] FEAT-CONTROL-001 — gestos, tiempos (1,5 s, 0,12 s), alternativas de teclado y salvaguardas.
- [ ] FEAT-INTERFAZ-001 — tutorial, panel de controles y «Cómo se juega» con el control nuevo.

## Traceability

- Decisiones: D-059, D-062 (sustituyen a D-007).
- `PLAN.md`, etapa 2 y decisiones D1, D2 y D3 del usuario.
- Código: `client/src/game/aim.ts`, `tests/e2e/controls.spec.ts`.
