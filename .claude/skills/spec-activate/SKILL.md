---
name: spec-activate
description: Prepara el contexto de trabajo de una WRK-TASK (o de una descripción libre) - sigue parent y activates, expande el grafo, filtra, respeta el presupuesto de activación y genera un prompt listo para implementar. Úsala al empezar una tarea o al lanzar un subagente que la vaya a ejecutar.
---

# spec-activate

Del ID de una tarea a un prompt con todo lo que hay que respetar. `$ARGUMENTS`: `WRK-TASK-NNN` o una descripción, con `--pattern bundle|layered` (por defecto `bundle`) y `--save` opcionales.

## 1. Activación explícita

Con un `WRK-TASK-NNN`:

```bash
npm run kdd -- context WRK-TASK-NNN --depth 2
```

1. Lee la tarea: Objective, File Scope, criterios, notas.
2. Sube por `parent` al `WRK-PLAN` y al `WRK-SPEC`.
3. Reúne `activates` de la tarea, del plan y de la `WRK-SPEC`.

Con una descripción: `npm run kdd -- filter --status active --format json` y elige por capa y tema (ver pistas en `/spec-context`).

## 2. Expansión

Para cada especificación activada, `npm run kdd -- context <ID> --depth 2 --format json`. Anota la distancia a la tarea.

## 3. Filtro

Quita:

- las `deprecated` o sustituidas (salvo que la tarea las active a propósito);
- las demasiado generales o demasiado concretas para esta tarea;
- las que no cambiarían nada de la implementación.

Las `RULE-*` que condicionan la tarea se quedan siempre (física `RULE-001`, red `RULE-002`, verificación `RULE-003`, rendimiento `RULE-004`).

## 4. Presupuesto

| Nivel | Especificaciones |
|---|---|
| WRK-TASK | 2-5 |
| WRK-PLAN | 3-7 |
| WRK-SPEC / descripción | 5-10 / 3-7 |

Si sobran, prioriza por cercanía, confianza, capa y fuerza del enlace (`constrained-by` > `implements` > `extends` > `uses-data-from`). Si de verdad hacen falta más, la tarea es demasiado grande: dilo.

## 5. Prompt

Lee Intent, Definition y criterios de cada una (sin Evidence ni Traceability).

**bundle**

```markdown
# Conocimiento activado
## <ID> — <título>
<Intent, Definition, Acceptance Criteria>

# Tarea
## WRK-TASK-NNN — <título>
<cuerpo completo, con File Scope>

Implementa la tarea dentro del File Scope. Cumple los criterios de la tarea y de las
especificaciones activadas. Verifica según RULE-003 (`npm run verify` y las E2E proporcionales).
Si el código contradice una especificación, anótalo como hallazgo; no lo esquives.
```

**layered**: el mismo contenido agrupado en «Reglas (se cumplen siempre)» (`RULE`, `DOM-JUEGO`), «Arquitectura (se respeta)» (`ARCH`), «Producto y funcionalidad (se alinea)» (`PROD`, `FEAT`) y «Tarea».

## 6. Salida

Tabla corta (ID, capa, confianza, origen: explícita o transitiva), tokens aproximados y el prompt. Con `--save`, se escribe en el scratchpad de la sesión, nunca en `specs/`.

Diferencia con `/spec-context`: aquel es un resumen para entender; este es el paquete para ejecutar.
