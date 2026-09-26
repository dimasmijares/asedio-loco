---
name: spec-impact
description: Analiza qué se ve afectado si cambia una especificación de specs/ (otras especificaciones, trabajo en curso, código y pruebas) y propone el orden de revisión. Úsala antes de cambiar una regla del juego, una ARCH o una RULE, o al consolidar una entrega.
---

# spec-impact

`$ARGUMENTS`: el ID que va a cambiar (p. ej. `DOM-JUEGO-004`).

## 1. Datos del grafo

```bash
npm run kdd -- impact <ID>
npm run kdd -- context <ID> --depth 2 --format json
```

## 2. Leer la especificación

Capa, confianza, reglas clave, criterios y `## Traceability`: qué código y qué pruebas la implementan.

## 3. Clasificar lo afectado

| Nivel | Criterio |
|---|---|
| **Directo, alto** | `implements` o `activates` la especificación |
| **Directo, medio** | `constrained-by`, `extends` o `depends-on` |
| **Transitivo, bajo** | A más de un salto |

Trabajo (`WRK-*`) afectado:

- `active` o `draft`: riesgo en curso; puede estar implementando conocimiento desfasado.
- `completed` o `archived`: posible retrabajo; no se reabren, se crea tarea nueva.

Fuera del grafo, busca con Grep en el código y en las pruebas citados:

- constantes de `shared/` (tiempos, municiones, bloques, ids) y quién las usa;
- mensajes de `shared/protocol.ts` o `client/src/game/net/messages.ts`: cambiar el formato exige subir la versión del protocolo (`RULE-002`);
- física o munición: medir antes y después con las pruebas de destrozo y equilibrio (`RULE-001`);
- pruebas E2E y de equilibrio que fijan el comportamiento actual.

## 4. Informe

```
## Impacto: <ID> — <título>

### Qué cambia
### Directo (alto)
| ID | Título | Relación | Riesgo |
### Indirecto
| ID | Título | Camino | Riesgo |
### Trabajo afectado
| WRK | Estado | Impacto |
### Código y pruebas
| Ruta | Por qué |
### Orden de revisión
1. …
### Gobierno
- ¿ADR nuevo? ¿Sube versión (parche, menor, mayor si cambia una regla)? ¿Sube el protocolo?
```

## Notas

- Si nada depende de ella, dilo: es una hoja o está huérfana.
- Con más de cinco afectados, agrupa por capa.
- Un cambio visible de jugabilidad lo decide el usuario: el informe lo señala, no lo aprueba.
- Solo lectura.
