---
id: ADR-003
type: adr
layer: governance
status: accepted
confidence: high
version: 1.0.0
created: 2026-09-24
updated: 2026-09-26
owner: dimas
deciders:
  - dimas
dependencies:
  - id: ARCH-004
    relation: implements
  - id: DOM-JUEGO-004
    relation: implements
supersedes: null
tags:
  - fisica
  - rapier
  - rotura
---

# ADR-003 — Rapier como motor de física, con rotura por golpes y fragmentos locales

## Context

La física es la seña de identidad: el daño tiene que salir de ella, no de barras de vida. Hace falta un motor en WebAssembly con eventos de fuerza de contacto, uniones, CCD y cuerpos que se duermen. Con Rapier aparecieron problemas propios: los bloques que sostienen peso recibían fuerzas enormes en reposo, las uniones peleaban con los contactos y forzar el sueño hacía que el castillo se desplomara solo.

## Decision

- Se usa `@dimforge/rapier3d-compat` (0.20), a 60 Hz fijos y como mucho 4 pasos por fotograma.
- **Solo rompen los golpes:** un evento de fuerza daña si los cuerpos chocaban a más de 0,7 m/s, salvo aplastamientos de más de 3 veces el umbral. Los golpes medianos acumulan daño.
- **Uniones fijas sin contacto** entre sus dos piezas; se rompen por fuerza o si los anclajes se separan más de 7 cm.
- El proyectil atraviesa lo que rompe y conserva el 60 % de su velocidad.
- **Fragmentos decorativos** en un segundo mundo de Rapier local, en cada cliente, sin sincronizar, con los bloques reales como cinemáticos.
- Nunca se duermen cuerpos a mano; las consultas espaciales primero recogen y luego modifican.

## Consequences

**Positive:**

- Los castillos se asientan y se duermen solos; el derrumbe tiene sentido.
- Los fragmentos no cuestan red.

**Negative:**

- Los umbrales de rotura están ajustados a mano para esta versión de Rapier. Cambiar de versión o de paso obliga a volver a medir (RULE-001).
- La escena de CCD no demuestra que la CCD sirva: en Rapier 0.20 nada atraviesa el muro aunque esté desactivada.
- 1,1 MB comprimido de WebAssembly que carga también la portada.

**Neutral:**

- Las escenas de física se ejecutan igual en Node y en el navegador.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Otro motor (cannon-es, ammo.js…) | No se evaluó a fondo: la especificación original recomendaba Rapier y cubría todo lo necesario (eventos de fuerza, uniones, CCD, sueño) |
| Rotura por cualquier fuerza de contacto | Los bloques de carga se rompían en reposo |
| Uniones con contacto entre piezas | Fuerzas de más de 1800 en reposo |
| Fragmentos sincronizados por red | Coste de red sin valor de juego |

## Knowledge Impact

- [ ] ARCH-004 — motor, paso fijo, criterio de rotura, uniones y mundo de fragmentos.
- [ ] DOM-JUEGO-004 — umbrales por material y comportamiento de las uniones.

## Traceability

- Decisiones: D-009, D-010, D-011, D-012, D-013, D-014, D-017, D-018, D-042, D-047, D-048.
- Código: `client/src/game/sim/sim.ts`, `client/src/game/sim/debris.ts`, `shared/materials.ts`.
