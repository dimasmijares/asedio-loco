---
id: DOC-OPS-003
type: spec
layer: documentation
scope: persistent
status: active
confidence: low
version: 1.1.0
created: 2026-09-28
updated: 2026-09-29
owner: dimas
dependencies:
  - id: DOC-OPS-002
    relation: extends
  - id: FEAT-INTERFAZ-001
    relation: constrained-by
tags: [proceso, diseno, revision, interfaz]
---

# DOC-OPS-003 — Revisión de diseño con el usuario

## Intent

Que el usuario sepa en diez segundos qué tiene que revisar, dónde y qué se espera de él, y que cada decisión quede atada a una tarea. Nada visible cambia en el juego sin pasar por aquí (WRK-SPEC-011).

## Definition

### Rules

1. **Un solo lienzo** de diseño por entrega. Tiene dos páginas: **Revisar**, la que se abre al entrar, y **Referencia**, con las capturas del juego actual, que no hay que revisar salvo que el usuario quiera comentar algo.
2. **Cada cosa que decidir es un punto R-NN.** Los identificadores son únicos y no se reutilizan. Cada punto tiene:
   - un tablero (o dos, PC y móvil) cuyo título empieza por su identificador: `R-03 · Barra de munición (móvil)`;
   - una sola pregunta concreta («¿apruebas las cartas por rareza?», «¿anillo o diana?»);
   - la tarea que desbloquea (WRK-TASK-NNN).
3. **El tablero «Qué revisar»** es el primero de la página Revisar. Tiene una fila por punto con identificador, pregunta, estado y tarea. Estados:
   - **Tu turno:** está listo para que lo revises.
   - **En preparación:** lo estoy haciendo; no hace falta mirarlo.
   - **Cambios pedidos:** lo estoy rehaciendo con tus comentarios.
   - **Aprobado:** sale de la página Revisar y pasa a Referencia.
4. **Cómo responde el usuario:** un comentario sobre el tablero, enviado a Claude, o un mensaje en el chat que empiece por el identificador:
   - `R-03 ok` aprueba;
   - `R-01 diana` elige una opción;
   - `R-02 más saturado` pide cambios;
   - un comentario sin identificador sobre una captura de Referencia se convierte en un punto nuevo o en una tarea.
5. **Qué hace el agente:** con cada respuesta, actualiza el estado en «Qué revisar», anota la decisión en la tarea (Implementation Notes y Evidence), responde y resuelve el hilo, y avisa en el chat solo con lo que ha cambiado.
6. **Las pruebas en el juego** (capturas después de implementar) vuelven como un punto nuevo con su propio identificador.

### Diseñar desde cero (desde el 29-09-2026)

Claude Design y los artifacts son lo mismo: el lienzo es un artifact de tipo Design. Para rediseñar no se trabaja sobre capturas:

7. **Design system «Asedio Loco · estilo»** (https://claude.ai/artifact/D3UZsBmqS3PPWLsKYptLj3): paleta, tipografía, tamaños, radios y componentes. Es la fuente del estilo. Hoy tiene los valores actuales del juego como base provisional y **espera las directrices nuevas del usuario** (paleta incluida); hasta entonces no se diseña nada nuevo sobre él.
8. **El usuario itera el design system fuera de esta sesión**, desde Claude en claude.ai o a mano en su página. El agente del repositorio no lo cambia salvo que se lo pidan; lo lee (`README.md` y `tokens.json`) antes de tocar el CSS del juego.
9. **Página «Diseñar» del lienzo**: maquetas editables (no capturas) hechas con el design system, con alternativas A/B/C cuando haga falta. Se crea con el primer rediseño.
10. **Ciclo:** maqueta en «Diseñar» → comentarios o retoques → aprobada → el agente la pasa al código y despliega → vuelve a «Revisar» como punto R-NN con la captura del juego real junto a la maqueta.

## Acceptance Criteria

- [ ] El lienzo de WRK-SPEC-011 sigue esta estructura.
- [ ] Cada punto R aprobado tiene su decisión anotada en la tarea.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Expert review | Pedido por el usuario tras la primera ronda de comentarios, que resultó caótica | 2026-09-28 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | Lienzo https://claude.ai/artifact/RWP97U9aWmerrw9ibSeLxA | Páginas Revisar y Referencia, tablero «Qué revisar» |
| Implemented in | Design system https://claude.ai/artifact/D3UZsBmqS3PPWLsKYptLj3 | Estilo del juego; provisional hasta las directrices nuevas |
| Tested by | WRK-TASK-060 | Primera revisión con este método |
