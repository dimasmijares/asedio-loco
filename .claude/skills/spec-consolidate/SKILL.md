---
name: spec-consolidate
description: Cierra una entrega (WRK-SPEC-NNN) - repasa sus planes y tareas, pone al día las especificaciones de conocimiento, propone ADR para decisiones nuevas, sube la confianza con evidencia y deja el trabajo en completed. Úsala al terminar la última tarea de una entrega, o cuando /release-loop la termina.
---

# spec-consolidate

`$ARGUMENTS`: `WRK-SPEC-NNN`. Sigue `DOC-OPS-002` §6.

## 1. Árbol de trabajo

```bash
npm run kdd -- context WRK-SPEC-NNN --depth 3
npm run kdd:pendientes
```

Lee la `WRK-SPEC`, su `WRK-PLAN` y todas sus `WRK-TASK`: qué se hizo, qué se decidió, qué se aprendió. Si queda alguna tarea sin `completed`, para: la entrega no está cerrada.

Mira también los commits de la entrega (`git log --oneline` desde el primero de la primera tarea) por si algo no quedó en `## Evidence`.

## 2. Conocimiento activado

Para cada ID de `activates` (de la SPEC, el plan y las tareas): versión, confianza, reglas y criterios actuales.

## 3. Repaso

1. **Decisiones → ADR.** Busca en planes y tareas «decidimos», «elegimos», «descartamos», «en vez de», y las opciones que eligió el usuario. Cada decisión que condiciona el futuro y no tiene ADR recibe uno (`templates/adr.md`, siguiente `ADR-NNN`, `accepted` si el usuario la tomó).
2. **Especificaciones desfasadas.** Compara lo que dicen con lo que se implementó (constantes de `shared/`, comportamiento, límites). Cada una que cambie sube de versión (parche redacción, menor contenido, mayor si cambia una regla) y cita la tarea en `## Evidence`.
3. **Conocimiento nuevo.** Reglas del juego, funcionalidades o límites que aparecieron en el trabajo y no tienen especificación: `DOM-JUEGO`, `FEAT-MODULO` o `ARCH` nuevas, a `confidence: low` o `medium`.
4. **Límites conocidos.** Lo que queda pendiente y no pertenece a ningún plan va a `WRK-PLAN-005` (pendientes conocidos).
5. **Confianza.** `medium` si la tarea añadió pruebas automáticas; `high` solo si además el usuario lo ha probado jugando. Sin eso, no sube.
6. **Traceability.** Rutas nuevas de código y pruebas; compruébalas con Glob.

## 4. Aplicar

Aplica lo que no necesita decisión del usuario (versiones, evidencia, trazas, ADR de decisiones que él ya tomó). Lo dudoso, como propuesta.

Cierre del trabajo:

- `WRK-PLAN` con su tabla de estado final y `completed`; `WRK-SPEC` en `completed`, con criterios marcados y `## Evidence`.
- **No** archives: pasan a `archived` (con sus tareas) cuando el usuario lo haya probado.

```bash
npm run kdd:check
```

Si esta skill la invocó `/release-loop`, el commit y el push siguen su protocolo (commit a `main`, `npm run ci:estado -- --wait`). Si no, deja los cambios sin commit y dilo.

## 5. Informe

```
## Consolidación: WRK-SPEC-NNN — <título>

Trabajo: SPEC, PLAN, tareas (estado)
ADR creados: …
Especificaciones actualizadas: ID versión → versión (cambio)
Nuevas: ID (capa, confianza)
Confianza: ID low → medium (evidencia)
Pendientes a WRK-PLAN-005: …
Para el usuario: qué probar jugando y capturas (`node tests/tools/review.mjs <base> <carpeta>`)
```

Lo importante es lo que ayuda a la siguiente sesión, no contar lo que se hizo.
