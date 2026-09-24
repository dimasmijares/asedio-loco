# Decisiones

Registro de decisiones de diseño y técnicas, sobre todo las que se apartan de `PROMPT_asedio_loco.md`. La más reciente va al final.

## Fase 0

- **D-001 · Ubicación del proyecto.** Se queda dentro de OneDrive por decisión del usuario, sabiendo que la sincronización puede bloquear archivos de `node_modules` o de las compilaciones.
- **D-002 · Node 22.** Se usa el Node 22 LTS ya instalado; cumple los requisitos de Vite, Wrangler y Playwright.
- **D-003 · Servidor de salas: Cloudflare Workers + Durable Objects (plan gratuito).** Se ha comparado con PartyKit, Deno Deploy, Render, Fly.io y P2P (septiembre de 2026). Fly.io ya no tiene plan gratis. Render apaga el servicio tras 15 min sin tráfico y tarda ~1 min en arrancar. Deno Deploy no tiene un objeto con estado por sala. PartyKit ahora es una capa sobre Durable Objects. Cloudflare no se duerme ni pide tarjeta. Cada sala es una Durable Object respaldada por SQLite (la única opción del plan gratis) y usa la API de hibernación de WebSockets.
- **D-004 · El cliente se sirve desde el mismo Worker.** Va como archivos estáticos (`assets`), así que comparte origen con los WebSockets y no hace falta CORS. Las peticiones a estáticos son gratis e ilimitadas. `run_worker_first` solo incluye `/api/*` y `/ws/*`. URL: `https://asedio-loco.dimasmijares.workers.dev`.
- **D-005 · No se instalan el plugin ni los MCP de Cloudflare para agentes.** Wrangler y la documentación pública bastan, y así no se toca la configuración global del usuario.
- **D-006 · Despliegue continuo con `wrangler deploy` directo.** No se usa `cloudflare/wrangler-action`: Wrangler ya es dependencia de desarrollo y así se usa la misma versión en local y en CI. El token de Cloudflare solo tiene el permiso `Workers Scripts:Edit`. El ID de cuenta no es secreto y se guarda como variable del repo.
