# Proyecto: ASEDIO LOCO (título provisional)

> **Histórico.** Es la especificación original. Lo que el juego hace hoy está en `specs/` (reglas en `DOM-JUEGO-*`, recorrido en `PROD-JUGAR-001`). Donde difieran, manda `specs/`.

Eres el desarrollador único de este proyecto, de principio a fin. Vas a construir y publicar un juego de navegador en 3D, multijugador en línea, para una partida de hasta 4 jugadores, alojado gratis. Trabaja de forma autónoma.

Solo hay un momento en el que me pedirás cosas: la **Fase 0**, para cuentas, credenciales y decisiones de infraestructura. A partir de la Fase 1, no me hagas preguntas. Decide tú, documenta la decisión y sigue adelante.

Tienes libertad creativa. Si algo de este documento te parece incoherente, aburrido o técnicamente inviable, cámbialo por algo mejor y apúntalo en `DECISIONES.md` con el motivo.

---

## 1. La idea del juego

Un "Angry Birds" en 3D de castillos y catapultas, en formato battle royale rápido.

- **Jugadores y mapa.** Hasta 4 jugadores, cada uno con su castillo en una esquina de una isla flotante cartoon. En el centro de cada castillo hay un **rey** (un muñeco con corona).
- **Castillos destructibles.** Cada castillo es una estructura de bloques con física real: madera, piedra, cristal y hierro, cada material con distinta resistencia y masa. Se derrumba como en Angry Birds.
- **Catapultas.** Cada jugador tiene una catapulta en su muralla. Apunta tirando hacia atrás con el ratón, como un tirachinas: la dirección y la distancia del arrastre fijan el ángulo horizontal, la elevación y la potencia. Una línea de puntos muestra solo el primer tramo de la trayectoria, no el impacto, para que haya habilidad.
- **Munición loca aleatoria.** Cada ronda, a cada jugador le toca un proyectil al azar según su rareza. Puede tener dos guardados y elegir cuál lanzar.
- **Eliminación.** Un jugador queda fuera cuando su rey cae de la isla, queda aplastado o toca el suelo fuera de su castillo. Lo que se considere "caído" debe ser claro y verse en pantalla.
- **Victoria.** Gana el último rey en pie. Una partida debe durar unos **4-6 minutos**.

### Ritmo: rondas simultáneas (decisión de diseño, cámbiala solo si encuentras algo claramente mejor)

- **Fase de apuntado (~12 s).** Todos apuntan a la vez, eligiendo cualquier castillo rival, y confirman. Si se acaba el tiempo, dispara con lo que tenga apuntado. Se ve en tiempo real hacia dónde apuntan los demás, con su catapulta girando.
- **Fase de impacto.** Todos los disparos salen a la vez con un pequeño escalonado para que se vean, y la cámara los sigue. Se resuelve la física hasta que todo se asienta, con un tope de ~6 s.
- **Resultado.** Una breve pantalla con quién recibió más daño y alguna frase graciosa. Siguiente ronda.

### Escalada battle royale

- Cada 3 rondas, el **mar de lava** (o nubes de tormenta, o lo que quede mejor) sube un nivel y se come los bloques de la base de todos los castillos.
- A partir de la ronda 6 empieza a soplar viento cambiante, con un indicador claro en pantalla.
- Si solo quedan 2 jugadores, las rondas son más cortas y sale munición más rara.

### Munición (mínimo 10 tipos; invéntate más si se te ocurren mejores)

- **Común**
  - Pedrusco: bola básica.
  - Tronco rodante: al caer, sigue rodando.
  - Racimo de cocos: se divide en 4 en el punto más alto.
- **Rara**
  - Vaca explosiva: muge al volar y explota con área.
  - Sandía pegajosa: se pega a lo que toca y explota a los 2 s.
  - Gallina saltarina: rebota 3 veces.
  - Piano: cae en vertical sobre el punto marcado.
- **Épica**
  - Agujero negro: atrae bloques durante 2 s.
  - Imán: arranca los bloques de hierro.
  - Bola de nieve: crece mientras rueda.
- **Defensiva** (se usa sobre tu propio castillo)
  - Andamio: reconstruye algunos bloques.
  - Burbuja: un escudo que absorbe un impacto.

Cada munición necesita un icono y un color, un efecto visual y un sonido distintos. El reparto tiene que ser justo: una rara no puede eliminar a nadie de un solo golpe salvo con muy buena puntería.

### Relleno con bots

Si somos menos de 4, el anfitrión puede rellenar con bots, eligiendo entre 1 y 3 y la dificultad. El bot apunta al rival más débil o al más cercano con un error aleatorio que depende de la dificultad. Los bots también sirven para probar el juego tú solo.

### Estilo

Low-poly cartoon, colores saturados, contornos marcados o sombreado toon, cielo con nubes y agua o lava animada. Todo generado por código: geometría, texturas procedurales y sonido con WebAudio, sin assets externos. Cada jugador tiene un color y un estandarte. Cámara orbital en el lobby y en la fase de apuntado; en impacto, cámara que sigue al proyectil más interesante.

---

## 2. Requisitos técnicos

- **Cliente.** TypeScript + Vite + Three.js. Física con **Rapier** (`@dimforge/rapier3d-compat`) u otra si justificas que es mejor.
- **Plataforma.** Pensado para portátil, con ratón y teclado. Objetivo: **60 fps** en un portátil integrado de gama media con los 4 castillos enteros; como referencia, ~80-120 bloques por castillo. Si no llegas, reduce bloques, usa instancing o pon a dormir los cuerpos, en vez de sacrificar la jugabilidad.
- **Arquitectura de red (recomendada).**
  - Un servidor de salas ligero que solo retransmite mensajes y guarda el estado del lobby.
  - Un **cliente anfitrión autoritativo**, el creador de la sala, que ejecuta la física oficial y envía instantáneas de los bloques y reyes que se han movido (~15-20 Hz, cuantizadas, solo cuerpos despiertos).
  - El resto de clientes interpola. Entre rondas, el anfitrión envía el estado completo.
  - Evalúa si Rapier te permite física determinista en todos los clientes a partir del evento de disparo. Si es fiable, puedes usarla para ahorrar ancho de banda, pero el anfitrión sigue siendo la fuente de verdad.
- **Física avanzada.** Es una seña de identidad del juego, no un extra. Nada de "barras de vida" disfrazadas: el daño tiene que salir de la física.
  - **Materiales con propiedades reales.** Densidad, fricción, restitución y resistencia distintas para madera, piedra, cristal y hierro. La madera astilla, la piedra aguanta, el cristal se hace añicos y el hierro apenas se deforma pero pesa mucho.
  - **Rotura por fuerza de contacto.** Usa los eventos de fuerza de contacto del motor. Si un bloque recibe un impulso por encima del umbral de su material, se **fractura en trozos** (fractura Voronoi precalculada o troceo procedural), no solo desaparece. Los fragmentos siguen siendo cuerpos físicos durante unos segundos y luego se retiran para no penalizar el rendimiento.
  - **Integridad estructural.** Las piezas unidas (almenas, puentes, torres) usan joints rompibles. Si quitas la base, lo de arriba se viene abajo con sentido. Opcional: una propagación simple de carga para que una torre dañada ceda por su propio peso.
  - **Explosiones realistas.** Impulso radial con caída por distancia y oclusión simple (un muro grueso protege lo que tiene detrás), más una onda de polvo visual.
  - **Proyectiles.** Detección continua de colisiones (CCD) para que nada rápido atraviese muros. Arrastre del aire y efecto del viento sobre la trayectoria. Rotación, rebotes y rodadura según su forma: el tronco rueda y la bola de nieve gana masa y radio al rodar.
  - **Entorno.** La lava funde o empuja los bloques que toca. Los objetos que caen al agua o al vacío flotan o se hunden de forma creíble.
  - **Munición física.** Las municiones épicas (agujero negro, imán) aplican fuerzas continuas a los cuerpos cercanos durante su efecto, no animaciones falsas.
  - **Límites de coste.** Todo esto tiene que caber en el objetivo de 60 fps: fija un tope de cuerpos activos, pon a dormir los cuerpos quietos y usa instancing. En red, el anfitrión envía solo los cuerpos despiertos, y los fragmentos puramente decorativos se simulan en local en cada cliente sin sincronizar.
- **Migración de anfitrión.** Si el anfitrión se desconecta, otro jugador toma el relevo con el último estado completo. Si esto resulta demasiado complejo, como mínimo: pausar, avisar y reanudar si vuelve en 30 s.
- **Salas.** Una partida por sala. URL del tipo `https://<dominio>/#ABCD`. El primero crea la sala y ve un botón de "copiar enlace". Los que entran eligen nombre. Máximo 4 jugadores; el quinto y siguientes entran como espectadores. Reconexión: si recargas, recuperas tu castillo mediante un token en `localStorage`.
- **Seguridad básica.**
  - Valida en el servidor el tamaño y el tipo de los mensajes, y limita la frecuencia.
  - Nombres saneados y de 16 caracteres como máximo.
  - Una sala vacía se destruye sola.
- **Todo gratuito.** Nada de tarjetas ni planes de pago.

---

## 3. FASE 0: preparación (la única fase interactiva)

Hazla en pasos cortos, uno cada vez, esperando mi confirmación en cada uno. No introduzcas contraseñas por mí: cuando haga falta iniciar sesión, dame el comando exacto y yo lo ejecuto.

**0.1 Entorno.** Comprueba Node (LTS), npm, git y `gh`. Instala Playwright con Chromium. Dime qué falta y cómo instalarlo en mi sistema.

**0.2 GitHub.** Comprueba `gh auth status`. Si no hay sesión, pídeme que ejecute `gh auth login`. Crea el repo público `asedio-loco` (o el nombre que acordemos) y haz el primer commit con `README.md`, `CLAUDE.md` y `DECISIONES.md`.

**0.3 Hosting gratuito del servidor de salas.**
1. Investiga (web o documentación oficial) las **condiciones actuales** de los planes gratuitos. No te fíes de lo que recuerdas; los planes cambian.
2. Opción preferida: **Cloudflare Workers + Durable Objects**, una Durable Object por sala con WebSockets, sirviendo también el cliente estático desde el mismo Worker o desde Cloudflare Pages. Un solo proveedor y sin servidores que se duerman.
3. Alternativas si esa no encaja: PartyKit, Deno Deploy, Fly.io o Render. Descarta las que se duermen con arranques en frío largos, salvo que no haya otra.
4. Último recurso: P2P con PeerJS y el anfitrión como servidor.
5. Preséntame una tabla corta con las opciones: coste, límites, si se duermen y complejidad. Dime cuál eliges y por qué.
6. Cuando confirme, guíame para crear la cuenta e iniciar sesión (`npx wrangler login` o lo que toque) y verifica que funciona.

**0.4 Hosting del cliente.** Decide si va en el mismo proveedor o en GitHub Pages. Elige lo más simple que funcione con WebSockets hacia el servidor (vigila CORS y los orígenes permitidos).

**0.5 Despliegue continuo.** Configura GitHub Actions para desplegar cliente y servidor al hacer push a `main`. Guíame para crear los tokens mínimos necesarios, con permisos restringidos, y guardarlos como secrets del repo con `gh secret set`. Yo pego los valores; tú no los ves ni los escribes en ningún archivo.

**0.6 Esqueleto desplegado.** Publica un "hola mundo" de extremo a extremo: la página carga, crea una sala, un segundo navegador entra con el enlace y ambos ven la lista de conectados. Pruébalo con Playwright contra la **URL pública**. Dame esa URL.

**0.7 Confirmación final.** Resúmeme en 5 líneas qué cuentas, servicios y límites quedan configurados. Cuando diga "adelante", empieza la Fase 1 y **no vuelvas a preguntarme nada**.

---

## 4. FASES 1-6: desarrollo autónomo

Al terminar cada fase:
- haz commit y push, y despliega;
- ejecuta las pruebas de la fase;
- actualiza `CLAUDE.md` con el estado y `DECISIONES.md` con las decisiones tomadas.

Si algo te bloquea, busca la alternativa más simple, apúntala y sigue.

**Fase 1: sandbox de un jugador.** Isla, un castillo de bloques con física, catapulta con apuntado tipo tirachinas, pedrusco y cámara. Incluye ya los materiales, la rotura por fuerza de contacto con fractura en trozos, los joints rompibles y la CCD de la sección de física avanzada. Tiene que ser divertido derribar bloques antes de pasar a lo siguiente.

**Fase 2: partida local completa contra bots.** 4 castillos, reyes, rondas simultáneas, eliminación, victoria, escalada de lava y viento, y al menos 6 municiones. Bots con 3 niveles de dificultad.

**Fase 3: multijugador.** Lobby, enlace de sala, anfitrión autoritativo, instantáneas con interpolación, espectadores, reconexión, rellenar con bots y revancha, que mantiene la sala y los jugadores.

**Fase 4: contenido y sensación de juego.**
- Todas las municiones.
- Explosiones, polvo y astillas, sacudida de cámara y cámara lenta en la eliminación de un rey.
- Sonido procedural.
- Pantalla de resultados con estadísticas divertidas: mayor destrozo y disparo más ridículo.

**Fase 5: rendimiento y robustez.**
- Perfilado: instancing, cuerpos durmiendo, límite de partículas y compresión de instantáneas.
- Pruebas con latencia simulada y pérdida de paquetes.
- Migración o pausa del anfitrión.

**Fase 6: pulido.** Pantalla de inicio con título animado, tutorial de 3 pasos en la primera partida, accesibilidad básica (textos legibles, colores de jugador distinguibles para daltonismo y opción de silencio) y ajustes de calidad gráfica (bajo, medio, alto).

---

## 5. Verificación obligatoria con Playwright

Chromium sin interfaz con WebGL: usa los flags necesarios, como `--use-angle=swiftshader` o `--enable-unsafe-swiftshader`, y comprueba que el canvas no sale negro.

Estas pruebas deben pasar en local **y contra la URL pública**:

1. **Humo.** La página carga sin errores en consola y las capturas de la isla y los castillos son correctas. **Revisa tú las capturas** y corrige lo que se vea mal.
2. **Partida completa con 4 clientes.** 4 contextos de navegador, uno crea la sala y 3 entran por el enlace. Juegan con puntería automática hasta que hay un ganador, y todos los clientes muestran el mismo ganador y el mismo número de rondas.
3. **Consistencia.** Al final de cada ronda, la posición de los reyes y el número de bloques en pie coinciden entre clientes dentro de una tolerancia.
4. **Espectador.** Un quinto cliente entra a mitad de partida, ve el estado correcto y no puede disparar.
5. **Reconexión.** Un jugador recarga a mitad de partida y recupera su castillo.
6. **Anfitrión caído.** Se cierra el cliente anfitrión y el comportamiento es el diseñado (migración o pausa), sin romper la partida.
7. **Física.** Escenas de prueba automáticas: un pedrusco rápido no atraviesa un muro fino (CCD); una torre sin base se derrumba; el cristal se rompe antes que la piedra con el mismo impacto; un bloque fracturado genera fragmentos que luego se retiran. Guarda capturas antes y después del impacto y revísalas.
8. **Rendimiento.** Mide los fps en la escena más cargada y registra el resultado en `CLAUDE.md`.

Añade además tests unitarios (Vitest) para la lógica pura: rondas, reparto aleatorio de munición con semilla, validación de mensajes y eliminación.

---

## 6. Definición de terminado

- URL pública estable y funcional. Yo paso el enlace a 3 amigos y jugamos sin cuentas ni instalaciones.
- Todas las pruebas de la sección 5 en verde contra producción.
- `README.md` con cómo jugar, controles, cómo desplegar y límites del plan gratuito.
- `CLAUDE.md` con arquitectura, protocolo de mensajes, estado actual y cómo ejecutar las pruebas.
- `DECISIONES.md` con cada decisión de diseño o técnica que se aparte de este documento.

**Entrega final en el chat:**
- la URL;
- una frase para invitar a mis amigos;
- 3 capturas destacadas;
- una lista breve de lo que no llegaste a hacer o sabes que falla.

---

## 7. Reglas de trabajo

- Commits pequeños y descriptivos, en español.
- No subas secretos, tokens ni `.env` al repo.
- No te quedes atascado más de ~3 intentos en el mismo problema: simplifica, documenta y sigue.
- Prioridad cuando haya conflicto: **que sea divertido y jugable > que funcione en red de forma fiable > que se vea espectacular > que tenga mucho contenido**.
