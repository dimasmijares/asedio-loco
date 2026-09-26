---
id: WRK-SPEC-002
type: spec
layer: work-spec
scope: ephemeral
status: archived
confidence: high
version: 1.0.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
activates:
  - FEAT-CONTROL-001
  - FEAT-CAMARA-001
  - FEAT-REPLAY-001
  - DOM-JUEGO-001
  - DOM-JUEGO-003
  - DOM-JUEGO-004
  - RULE-001
  - RULE-002
  - RULE-003
tags:
  - historico
  - control
  - camara
---

# WRK-SPEC-002 — Cambios tras la primera prueba del usuario

## Problem Statement

El 25-09-2026 el usuario jugó por primera vez y encontró tres problemas:

- El control de tirachinas con clic izquierdo era poco intuitivo.
- La cámara «hacía cosas raras»: durante el impacto saltaba de un proyectil a otro y metía cámara lenta.
- El ritmo y la escala se quedaban cortos: 12 s para apuntar, 2 municiones en la mano y castillos de 106 bloques.

## Proposed Change

Lo que pidió el usuario (`PLAN.md`, «Lo que pide el usuario»):

- Apuntar moviendo el ratón con el **clic derecho** mantenido.
- Mantener **Espacio** para cargar la fuerza, viendo crecer la parábola.
- Elegir la munición con los números o con un clic, entre **3 distintas** por ronda.
- **20 s** por ronda, que se adelanta si todos están listos.
- Cámara **panorámica** durante los disparos y **repetición** solo cuando muere un rey.
- **Castillos más grandes.**
- Después, un estudio de viabilidad para móviles.

**In scope:** las etapas 1-6 de `PLAN.md`, cada una desplegada por separado.

**Out of scope:** el trabajo de móviles en sí, que sale del estudio de la etapa 6 (WRK-SPEC-004).

## Knowledge Context

| Spec | Why it applies |
|------|----------------|
| FEAT-CONTROL-001 | El control nuevo (clic derecho, Espacio, rueda) sustituye al tirachinas |
| FEAT-CAMARA-001 | Plano panorámico sin saltos durante el impacto |
| FEAT-REPLAY-001 | Fase `replay` nueva cuando cae un rey |
| DOM-JUEGO-001 | 20 s de apuntado, también en duelo |
| DOM-JUEGO-003 | 3 municiones distintas por ronda; las no usadas se pierden |
| DOM-JUEGO-004 | Castillos a escala 1,2 con 140 bloques e isla mayor |
| RULE-001 | Medir destrozo y equilibrio antes y después de tocar munición o física |
| RULE-002 | Subir `PROTOCOL_VERSION` al cambiar `MatchState` o el plano del castillo |
| RULE-003 | Cada etapa se cierra con CI verde contra producción antes de la siguiente |

## Constraints

- Decisiones del usuario D1-D6 (`PLAN.md`, 25-09-2026):
  - **D1** · Soltar Espacio deja el disparo preparado y es definitivo para esa ronda.
  - **D2** · La fuerza se llena de 0 a 100 % en unos 1,5 s y se queda al máximo.
  - **D3** · La parábola solo enseña el primer tramo, que crece con la fuerza y se corta antes de caer.
  - **D4** · Repetición al acabar la ronda, antes de los resultados, a cámara lenta y desde cerca.
  - **D5** · 3 municiones distintas cada ronda; las que no se usan se pierden.
  - **D6** · Término medio: bloques un 20 % más grandes y unos 140 por castillo.
- Una etapa a medias no se deja en producción: se revierte — RULE-003.
- El estado completo por red sigue por debajo de 64 KB — ARCH-003.

## Acceptance Criteria

- [x] Se apunta con clic derecho + ratón y se carga con Espacio; el tirachinas desaparece.
- [x] 20 s por ronda y 3 municiones distintas por ronda, con bots que eligen entre ellas.
- [x] Durante el impacto hay un plano general sin saltos ni cámara lenta.
- [x] Cuando cae un rey, todos los clientes ven la repetición a la vez.
- [x] Castillos de 140 bloques con destrozo, equilibrio y rendimiento medidos antes y después.
- [x] Documento de viabilidad para móviles con plan por etapas (`docs/MOVILES.md`).

## Evidence

- Plan acordado: `b71ccd8` (25-09-2026). Etapas: `05339aa`, `534616f`, `28fc472`, `8ad0ab5`, `af03fd5`, `6757e9c` (todas el 25-09). Detalle en WRK-PLAN-002.
- Decisiones registradas: D-058 a D-064 en `DECISIONES.md`.
- CI verde contra producción al cerrar cada etapa (proceso de `PLAN.md`, «Cómo se despliega cada etapa»).
