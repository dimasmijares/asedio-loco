---
id: ADR-011
type: adr
layer: governance
status: accepted
confidence: high
version: 1.1.0
created: 2026-09-25
updated: 2026-10-03
owner: dimas
deciders:
  - dimas
dependencies:
  - id: DOC-OPS-001
    relation: implements
supersedes: null
tags:
  - pruebas
  - ci
  - e2e
---

# ADR-011 — Las E2E contra producción se reparten en trabajos paralelos, limitan el dibujo y exigen convergencia

## Context

Las pruebas E2E se ejecutan contra producción tras cada despliegue. Con toda la batería en un runner, CI tardaba 30-38 minutos. El runner dibuja por software y es unas 4 veces más lento que un PC: con 4-5 navegadores dibujando a la vez, la física del anfitrión iba más lenta que el reloj. Además, tras más destrozo, un rey a veces sigue rodando al empezar los resultados, y un cliente con retraso lo ve un poco después.

## Decision

- CI reparte la batería en **7 trabajos paralelos**: básicas, física, solitario, 4 jugadores, migración, revancha y red mala. Cada uno guarda sus capturas.
- `?render=N` limita el dibujo a N fotogramas por segundo. En las pruebas de red, solo el cliente que se captura dibuja a ritmo normal.
- Las pruebas de consistencia sondean hasta 4 s (6 s con red mala) a que todas las vistas coincidan con el anfitrión. Solo fallan si no convergen.
- Las escenas de física se ejecutan también en Node con Vitest.

## Consequences

**Positive:**

- Una ejecución completa, con despliegue, tarda unos 4 minutos. Esperar a CI entre etapas sale barato (RULE-003).
- Actualización del 03-10-2026: con más pruebas, `basicas` llegó a 14 minutos; se partió en `basicas`, `hud`, `espectador-repeticion` y `menus-y-marca` (11 trabajos) y `npm run e2e:grupos` impide que una prueba nueva se quede fuera de todos. Ese mismo día, `sala.spec` (partidas con dos y tres navegadores) pasó a su propio grupo, `sala` (12 trabajos): dentro de `menus-y-marca` lo llevaba a 11 minutos.
- Menos falsos fallos por lentitud del runner.

**Negative:**

- Las pruebas de red no miden el rendimiento de dibujo real de los clientes.
- Una prueba que converge tarde puede ocultar un desfase breve entre clientes.

**Neutral:**

- Una prueba larga nueva probablemente necesita su propio grupo en `deploy.yml`.

## Alternatives Considered

| Alternative | Why it was rejected |
|-------------|---------------------|
| Todo en un runner, en serie | 30-38 minutos por ejecución |
| Comparar clientes en un instante fijo | Fallos por reyes que aún ruedan |
| Quitar pruebas de red de CI | Son las que más valor dan contra producción |

## Knowledge Impact

- [ ] DOC-OPS-001 — grupos de CI, `?render`, convergencia y cómo lanzar una parte.

## Traceability

- Decisiones: D-048, D-049, D-050, D-057.
- Código: `.github/workflows/deploy.yml`, `tests/e2e/multiplayer.spec.ts`, `tests/unit/physics.test.ts`.
