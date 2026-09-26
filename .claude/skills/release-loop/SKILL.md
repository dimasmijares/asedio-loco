---
name: release-loop
description: >-
  Ejecuta en serie las WRK-TASK de la entrega activa (WRK-SPEC + WRK-PLAN) sin
  supervisión, con commits directos a main y CI en verde antes de la siguiente,
  y se para siempre en un punto seguro según el presupuesto. Úsala para «sigue
  con la entrega hasta cerrarla», «ejecuta las tareas del plan» o «continúa el plan».
---

# release-loop

Completa una entrega tarea a tarea y se para antes de quedarse sin presupuesto. El protocolo es `specs/documentation/DOC-OPS-002-protocolo-de-iteracion.md` §3; aquí no se repite.

## Antes de empezar

1. `git status` limpio y `git pull --ff-only` en `main`. Si hay cambios ajenos sin commit, para y pregunta.
2. `npm run kdd:check` en verde.
3. `npm run kdd:pendientes`: identifica la entrega activa (`WRK-SPEC` y `WRK-PLAN` en `active`) y su tabla de etapas.
4. Si hay una `WRK-TASK` en `active`, es una tarea a medias de otra sesión: revisa su estado antes de seguir; si no está clara, para y pregunta.
5. Anota el `<total_tokens> … left` de este momento, si lo hay.

## Bucle

Mientras queden tareas sin terminar en la entrega **y** el presupuesto (abajo) dé verde:

1. **Elegir** la siguiente tarea marcada como lista (✓) en `kdd:pendientes`. Si ninguna lo está, para: el orden del plan necesita revisión.
2. **Preparar.** `npm run kdd -- context WRK-TASK-NNN` (o `/spec-activate WRK-TASK-NNN`) y lee lo que activa.
3. **Activar.** `status: active`, con `## File Scope`. `npm run kdd:check`.
4. **Implementar** solo dentro del File Scope y contra los criterios. Si el código contradice una especificación, anótalo como hallazgo.
5. **Verificar** según `RULE-003`: `npm run verify` y las E2E locales proporcionales (`npm run e2e -- <archivo>`). Física o munición: destrozo antes y después (`RULE-001`). Mensajes: `RULE-002`. Rendimiento: `/#bench` (`RULE-004`). Algo visible: capturas con `node tests/tools/review.mjs`.
6. **Consolidar la tarea**: criterios `- [x]`, `## Evidence` (commits, pruebas, fecha), especificaciones afectadas con versión subida, ADR para decisiones nuevas, tabla del `WRK-PLAN` y `status: completed`. `npm run kdd:check`.
7. **Publicar.** Commits pequeños en español a `main` (con la línea `Co-Authored-By` que pida la sesión), `git push` y `npm run ci:estado -- --wait`. Solo con CI en verde se sigue. Si falla, arréglalo; si no se puede, revierte (`git revert`) y para.
8. Vuelve al chequeo de presupuesto.

Al terminar la última tarea: `/spec-consolidate WRK-SPEC-NNN`, commit, push y CI en verde. Luego informa.

## Presupuesto (antes de cada tarea)

Usa la **primera** señal disponible:

1. **`npm run budget`.** Da el coste típico por tarea, lo consumido y lo restante en el bloque de 5 h y en la semana, y un veredicto GO / CAUTION / STOP. Para un veredicto firme necesita los topes: `npm run budget -- --session-pct N --weekly-pct M --reset-min K` con los datos de `/status`, o `.claude/budget.local.json` (copia de `.claude/budget.local.json.example`). GO sigue; CAUTION hace una tarea más y vuelve a mirar; STOP para.
2. **Aviso de tokens.** Si hay `<total_tokens> … left`, para por debajo del **15 %** del valor del inicio.
3. **Sin señal fiable:** como mucho **3** tareas por invocación.

Ante la duda, para. Parar pronto cuesta una sesión más; quedarse sin tokens a mitad de un push deja un estado que el usuario tiene que desenredar.

## Parada segura

Solo se para:

- justo después de CI en verde, con `main` sincronizado con `origin/main` y `git status` limpio;
- sin ninguna `WRK-TASK` en `active` a medias.

Si el presupuesto se agota en mitad de una tarea:

- **Casi terminada** (verificada, solo falta commit o CI): termínala y para.
- **Empezada**: descarta los cambios de código de la tarea (`git restore` de los archivos del File Scope que tocaste; nunca `git reset --hard` ni `git clean`), devuelve la tarea a `draft` y deja `kdd:check` en verde. Se retomará de cero.

## Al parar (siempre)

Informe corto en el chat:

- tareas terminadas y sus commits;
- estado: `git status`, último CI, tarea activa (debería no haber);
- siguiente tarea lista;
- motivo: presupuesto, CI, decisión del usuario o entrega completa;
- para reanudar: «Sigue con la entrega activa hasta cerrarla».

Después de decidir parar, no empieces nada.

## Escala al usuario (no sigas solo) si

- una tarea necesita una decisión de diseño nueva (ADR) o un cambio transversal (RFC);
- una tarea cambia la jugabilidad de forma visible (tiempos, daño, controles, cámara, reglas) y el usuario no lo ha decidido;
- CI falla dos veces por la misma causa tras un arreglo;
- el orden, las dependencias o el File Scope son ambiguos;
- el entorno falla (wrangler, Playwright, OneDrive con `EPERM`/`EBUSY`) y no es trivial arreglarlo.
