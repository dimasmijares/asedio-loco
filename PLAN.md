# Plan de cambios: control, cámara, ritmo y castillos

> **Histórico.** Este plan está cerrado y archivado como `WRK-SPEC-002` y `WRK-PLAN-002` en `specs/work/`. El trabajo pendiente se consulta con `npm run kdd:pendientes`.

Plan acordado tras la primera prueba del usuario (25-09-2026). Cada etapa se despliega sola: pruebas en local, push a `main`, CI contra producción en verde y revisión con capturas antes de empezar la siguiente. Las decisiones del usuario están al final.

## Lo que pide el usuario

1. El control actual (tirachinas con clic izquierdo) es poco intuitivo.
2. La cámara hace cosas raras.
3. Apuntar con el ratón mientras se mantiene el **clic derecho**.
4. **Espacio** para disparar: cuanto más tiempo se mantiene, más fuerza. Mientras se mantiene, se ve cómo se amplía la parábola.
5. La munición se elige con los números o con un clic.
6. **3 municiones distintas** para elegir en cada ronda.
7. **20 s** por ronda. Si todos han preparado su ataque, la ronda empieza antes.
8. Durante los disparos, cámara **panorámica**. Solo hay **repetición** con más detalle cuando muere un jugador.
9. **Castillos más grandes.**

## Cómo está ahora (para saber qué cambia)

- **Control:** `client/src/game/aim.ts`. Se pulsa con el izquierdo y se arrastra: la distancia da la potencia y el ángulo, el rumbo. La elevación va con la rueda o W/S. El clic derecho mueve la cámara. Espacio confirma («¡Listo!»).
- **Tiempo:** `shared/match.ts` da 12 s de apuntado (9 s en duelo). Si todos confirman, ya se adelanta la ronda (`host.ts`, `lockGrace`).
- **Munición:** 2 en la mano (`HAND = 2`). Cada ronda se repone la que se ha gastado.
- **Cámara en impacto:** `client/src/game/director.ts` sigue al proyectil más interesante, muestra el destrozo desde arriba y enfoca al rey que cae con cámara lenta. Esto es lo que da la sensación de «cosas raras»: salta de un disparo a otro.
- **Castillos:** 106 bloques cada uno (`shared/castle.ts`), en una isla de 60 × 60 m con los castillos a ±19 m.

## Etapas

### Etapa 1 · Ritmo y munición (pequeña) ✅ hecha

- Apuntado de 20 s, también en duelo. El modo `?fast=1` de las pruebas sigue en 3 s. La ronda arranca antes si todos están listos (ya funciona así).
- 3 municiones distintas por ronda, elegidas al azar con la semilla de siempre y sin repetidas. Las que no se usan se pierden y la ronda siguiente trae 3 nuevas (D5). Se eligen con 1/2/3 o con un clic en la tarjeta.
- Bots: eligen entre las 3.
- HUD: tres tarjetas y la ayuda con 1/2/3.
- Pruebas: los unitarios de `match.test.ts` (reparto de 3 sin repetir y duración) y el equilibrio, que se vuelve a medir porque con más tiempo y más munición cambia la duración de la partida.
- Se sube `PROTOCOL_VERSION` para que una pestaña con la versión anterior pida recargar.

### Etapa 2 · Control nuevo (la más importante) ✅ hecha

- **Clic derecho mantenido + ratón:** horizontal = rumbo, vertical = elevación. El cursor se oculta mientras se apunta (Pointer Lock) para no chocar con los bordes de la pantalla. La cámara sigue la dirección del tiro, detrás de la catapulta.
- **Espacio mantenido:** la potencia sube de 0 a 100 % en unos 1,5 s y se queda al máximo (D2). La vista previa enseña el primer tramo de la parábola, que se alarga con la fuerza y se corta antes de caer, sobre el 60 % del vuelo (D3). Al soltar, el disparo queda preparado y es definitivo para esa ronda (D1): el botón «¡Listo!» desaparece y el HUD lo marca con ✔.
- **Clic izquierdo:** solo para la interfaz (tarjetas de munición y botones). **Rueda:** acercar o alejar la cámara.
- Se mantienen como alternativa A/D (rumbo), W/S (elevación) y Q/E (castillo objetivo). Se quita el tirachinas.
- Tutorial de 3 pasos, panel de controles, «Cómo se juega» y README reescritos para el control nuevo. El campo de pruebas usa el mismo control.
- En red, las demás personas ven la parábola crecer mientras cargas (ya se envía la puntería a 10 Hz).
- Pruebas: una E2E nueva que apunta con el clic derecho, carga con Espacio y comprueba que el disparo sale con esa potencia. `autoplay` no cambia (manda la puntería directamente).

### Etapa 3 · Cámara panorámica ✅ hecha

- Durante el impacto, un plano general que encuadra a la vez todos los proyectiles en vuelo y los castillos a los que van. Se mueve despacio, sin saltos de un disparo a otro. Si solo hay un disparo, se acerca más.
- Sin cámara lenta durante el impacto normal.
- El `director` se simplifica: se queda en encuadrar y deja de «perseguir».
- Revisión con capturas y con un vídeo corto de una ronda de 4 jugadores.

### Etapa 4 · Repetición cuando muere un rey ✅ hecha

- Cada cliente guarda los últimos ~5 s de lo que ve (poses de bloques, reyes y proyectiles, y efectos) en un búfer circular. En la escena más cargada son unos 2 MB.
- Cuando cae un rey, al acabar la fase de impacto y antes de los resultados, hay una fase nueva, `replay` (D4). La marca el anfitrión, así que todos la ven a la vez. Muestra los últimos 3-4 s antes de la muerte, a cámara lenta, desde cerca y en un ángulo que mira al rey, con un rótulo («¡Cae el rey de Conde Clic!»).
- Si caen dos reyes en la misma ronda, se repiten los dos seguidos.
- La física no se vuelve a simular: se reproducen las poses grabadas, así que la repetición es igual en todos los clientes y cuesta poco.
- Se sube `PROTOCOL_VERSION` (fase nueva en `MatchState`).
- Pruebas: unitarios del búfer, y en la E2E de 4 jugadores, comprobar que todos entran y salen de `replay` en la misma ronda.

### Etapa 5 · Castillos más grandes ✅ hecha

- Término medio (D6): bloques un 20 % más grandes y unos 140 por castillo (hoy 106), con murallas más altas y una torre más. Se espera un ~30 % más de coste de física. Isla más grande para que quepan. Se ajustan las posiciones de las catapultas, los puntos a los que apuntan los bots, los niveles de lava y la cámara.
- Antes y después: `tests/balance/destrozo`, el equilibrio de las tres dificultades y el banco de rendimiento con GPU y en CI. Si la partida se alarga de más, se compensa con la munición o la lava.
- Capturas nuevas para el README.

### Etapa 6 · Estudio para móviles (después de la 5) ✅ hecho: ver `docs/MOVILES.md`

- Estudiar si el juego puede ser apto para móviles y montar un plan. Hay que mirar:
  - **Control táctil:** equivalentes al clic derecho, a Espacio y a la rueda.
  - **Rendimiento:** medirlo en un móvil de gama media, con los castillos ya más grandes.
  - **Interfaz:** HUD en pantalla estrecha y en vertical.
  - **Red:** WebSocket con datos móviles, y qué pasa al cambiar de app.
  - **Batería y temperatura.**
- Entregable: documento de viabilidad con opciones y coste, y un plan por etapas como este.

## Cómo se despliega cada etapa

1. Cambios en commits pequeños. `npm test`, `npm run typecheck` y la batería E2E en local.
2. Capturas con `node tests/tools/review.mjs` y revisión a ojo.
3. Push a `main`: CI despliega y ejecuta las E2E contra producción (unos 3 minutos). `npm run ci:estado -- --wait`.
4. Si CI falla, se arregla antes de pasar a la siguiente etapa. Una etapa a medias no se deja en producción: se revierte.
5. `CLAUDE.md`, `DECISIONES.md` y README al día al cerrar cada etapa. Aviso al usuario con capturas para que pruebe.

Orden: 1 → 2 → 3 → 4 → 5. La 1 y la 2 cambian lo que más se nota al jugar; la 5 es la más costosa y conviene hacerla cuando el control ya esté cerrado.

## Decisiones del usuario (25-09-2026)

- **D1 · Soltar Espacio:** el disparo queda preparado y es definitivo para esa ronda.
- **D2 · Carga de fuerza:** se llena de 0 a 100 % en unos 1,5 s y se queda al máximo.
- **D3 · Parábola:** solo el primer tramo, que se alarga con la fuerza y se corta antes de caer.
- **D4 · Repetición:** al acabar la ronda, antes de los resultados, a cámara lenta y desde cerca.
- **D5 · Munición:** 3 distintas cada ronda. Las que no se usan se pierden.
- **D6 · Castillos:** término medio, bloques un 20 % más grandes y unos 140 por castillo.
