---
name: spec-validate
description: Pasa la puerta KDD (npm run kdd:check) y da un informe de salud de specs/ interpretado, con cada fallo explicado y su arreglo. Úsala antes de cerrar una tarea, tras editar especificaciones o cuando kdd:check o CI fallan por KDD.
---

# spec-validate

Informe de salud del grafo de especificaciones. Solo lectura: no arregla nada sin que se lo pidan.

## 1. Diagnóstico

```bash
npm run kdd:check          # la puerta: grafo, huérfanos y ciclo de vida
npm run kdd -- validate    # detalle de errores y avisos del grafo
npm run kdd -- orphans
npm run kdd -- stats
npm run kdd:pendientes
```

`kdd:check` es la misma puerta que CI ejecuta antes de desplegar (`.github/workflows/deploy.yml`). Si falla, el despliegue no sale.

## 2. Interpretar

Para cada problema: qué es, dónde (ID y archivo) y el arreglo concreto.

| Problema | Causa habitual | Arreglo |
|---|---|---|
| `broken-ref` | Errata en un ID o especificación sin escribir | Corregir el ID o crear la especificación (`/spec-create`) |
| `duplicate-id` | Dos archivos con el mismo ID | El más nuevo toma el siguiente número libre; los IDs publicados no cambian |
| `cycle` | Una relación apunta al revés | Decir qué enlace romper y por qué |
| `deprecated-ref` | Depende de algo en desuso | Apuntar a la que la sustituye (`supersedes`) |
| `invalid-status` | Estado que no vale para su tipo | Ver la tabla de estados de `specs/README.md` |
| `missing-parent` | Plan o tarea sin `parent` | Enlazar con su `WRK-SPEC` o `WRK-PLAN` |
| `[huérfana]` | Sin ningún enlace | Proponer vecinos por capa y tema |
| `[ciclo de vida]` | Ver `scripts/kdd.mjs` | Abajo |

Ciclo de vida:

- **Más de una WRK-TASK activa**: solo una por copia de trabajo. La que no está en curso vuelve a `draft`.
- **Terminada con criterios sin marcar o sin Evidence**: marcar `- [x]` con evidencia real (commits, pruebas, fecha) o devolverla a `active`.
- **Activa sin File Scope, con dependencias abiertas o con plan/WRK-SPEC no activos**: añadir `## File Scope` o activar el padre.
- **Archivada con el padre sin archivar**: archivar el plan y la `WRK-SPEC` a la vez.

Además, sin herramienta:

- Confianza `high` sin pruebas automáticas y validación del usuario en `## Evidence`.
- Rutas de `## Traceability` que no existen (compruébalas con Glob).
- Especificaciones `draft` con `low` de las que dependen otras: priorizarlas.

## 3. Informe

```
## Salud de specs — N especificaciones
Puerta: kdd:check ✓ / ✘ (n problemas)

### Bloquea
### Revisar
### Recomendaciones (por orden)
### Métricas (capas, confianza, tareas pendientes)
```

Si todo pasa, dilo en dos líneas. Para revisar una especificación concreta contra el código, usa el agente `spec-validator`.
