#!/usr/bin/env node
// Previsión de presupuesto de Claude Code: ¿cabe otra tarea?
//
// Lee los transcripts locales (~/.claude/projects/*/*.jsonl). Nunca envía nada a la red.
// Calcula el coste típico por sesión de este proyecto y el consumo de la ventana de 5 h
// y de la semana. Da KPIs y un veredicto GO / CAUTION / STOP.
//
// El tope real del plan no se puede leer. Lo más rápido: mirar /status y pasar lo que
// muestra (--session-pct 37 --weekly-pct 4 --reset-min 48). El script deduce los topes
// a partir del consumo que ya ha medido. También se pueden fijar en
// .claude/budget.local.json ({"blockCeiling": 1500000, "weeklyCeiling": 15000000}).
// Sin ninguno de los dos, usa el mayor bloque de 5 h histórico y baja la confianza.
//
// Porte de rag-docs/scripts/budget_forecast.py. Node 22, sin dependencias.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOUR = 3600_000;
const BLOCK = 5 * HOUR;
const WEEK = 7 * 24 * HOUR;

// Raíz del repo: la carpeta padre de scripts/. Así funciona desde cualquier cwd.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Peso de cada clase de token en los límites de uso. La lectura de caché cuenta
// una fracción de la entrada nueva. Se cambia en .claude/budget.local.json ("weights").
const DEFAULT_WEIGHTS = {
  input_tokens: 1.0,
  cache_creation_input_tokens: 1.0,
  cache_read_input_tokens: 0.1,
  output_tokens: 1.0,
};

const USAGE = `Uso: node scripts/budget.mjs [opciones]

Previsión de presupuesto de Claude Code para empezar otra tarea.
Lee los transcripts locales; no envía nada a la red.

Opciones:
  --projects-dir DIR   Carpeta de transcripts (por defecto ~/.claude/projects)
  --project-path DIR   Ruta del repo (por defecto la raíz de este repo)
  --config FILE        Archivo de topes (por defecto <repo>/.claude/budget.local.json)
  --task-cost N        Coste de la próxima tarea en tokens (sustituye la estimación)
  --session-pct N      % usado del bloque de 5 h, según /status. Calibra blockCeiling
  --weekly-pct N       % usado de la semana, según /status. Calibra weeklyCeiling
  --reset-min N        Minutos hasta el reset del bloque de 5 h, según /status
  -h, --help           Muestra esta ayuda`;

function fail(msg) {
  console.error(USAGE.split('\n')[0]);
  console.error(`budget.mjs: error: ${msg}`);
  process.exit(2);
}

// Redondeo de Python (mitad a par), para dar las mismas cifras que el original.
function pyRound(x) {
  const r = Math.round(x);
  if (Math.abs(x % 1) === 0.5 && r % 2 !== 0) return r - 1;
  return r;
}

function parseArgs(argv) {
  const args = {
    projectsDir: join(homedir(), '.claude', 'projects'),
    projectPath: REPO_ROOT,
    config: join(REPO_ROOT, '.claude', 'budget.local.json'),
    taskCost: 0,
    sessionPct: 0,
    weeklyPct: 0,
    resetMin: 0,
  };
  const spec = {
    '--projects-dir': ['projectsDir', 'path'],
    '--project-path': ['projectPath', 'path'],
    '--config': ['config', 'path'],
    '--task-cost': ['taskCost', 'int'],
    '--session-pct': ['sessionPct', 'float'],
    '--weekly-pct': ['weeklyPct', 'float'],
    '--reset-min': ['resetMin', 'int'],
  };
  for (let i = 0; i < argv.length; i++) {
    let flag = argv[i];
    let value;
    if (flag === '-h' || flag === '--help') {
      console.log(USAGE);
      process.exit(0);
    }
    const eq = flag.indexOf('=');
    if (flag.startsWith('--') && eq > 0) {
      value = flag.slice(eq + 1);
      flag = flag.slice(0, eq);
    }
    const entry = spec[flag];
    if (!entry) fail(`opción desconocida: ${flag}`);
    if (value === undefined) {
      if (i + 1 >= argv.length) fail(`${flag} necesita un valor`);
      value = argv[++i];
    }
    const [key, type] = entry;
    if (type === 'path') {
      args[key] = resolve(value);
    } else {
      const n = type === 'int' ? Number(value) : Number.parseFloat(value);
      if (!Number.isFinite(n) || (type === 'int' && !Number.isInteger(n)) || value.trim() === '') {
        fail(`${flag}: valor no válido: '${value}'`);
      }
      args[key] = n;
    }
  }
  return args;
}

// Tokens ponderados de un mensaje del asistente.
function weightedTokens(usage, weights) {
  let sum = 0;
  for (const key of Object.keys(weights)) sum += weights[key] * (Number.parseInt(usage[key] ?? 0, 10) || 0);
  return pyRound(sum);
}

// Normaliza una ruta para comparar: minúsculas, barras de Windows y sin barra final.
// Acepta también la forma de Git Bash (/c/Users/...).
function norm(p) {
  if (!p) return '';
  let s = String(p).trim().replace(/\//g, '\\');
  const bash = s.match(/^\\([a-zA-Z])(\\|$)/);
  if (bash) s = `${bash[1]}:\\${s.slice(3)}`;
  return s.replace(/[\\]+$/, '').toLowerCase();
}

// Nombre de la carpeta que Claude Code da a un proyecto: la ruta con todo lo que
// no es letra o número cambiado por '-' (C:\Users\x → C--Users-x).
function projectDirName(p) {
  return String(p).replace(/[^a-zA-Z0-9]/g, '-');
}

function parseSession(path, weights) {
  let start = null;
  let end = null;
  let cwd = null;
  let total = 0;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (!row || typeof row !== 'object') continue;
    cwd = cwd || row.cwd || null;
    if (row.timestamp) {
      const t = Date.parse(row.timestamp);
      if (!Number.isNaN(t)) {
        start = start === null ? t : Math.min(start, t);
        end = end === null ? t : Math.max(end, t);
      }
    }
    const usage = row.message && typeof row.message === 'object' ? row.message.usage : null;
    if (usage) total += weightedTokens(usage, weights);
  }
  if (start === null || end === null || total === 0) return null;
  return { path, cwd, start, end, tokens: total };
}

// Todas las sesiones y las de este proyecto. Una sesión es del proyecto si su cwd es
// la raíz o una subcarpeta, o si está en la carpeta de transcripts del proyecto.
function load(projectsDir, projectPath, weights) {
  const target = norm(projectPath);
  const ownDir = projectDirName(projectPath).toLowerCase();
  const everything = [];
  const mine = [];
  for (const dir of readdirSync(projectsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const full = join(projectsDir, dir.name);
    for (const file of readdirSync(full, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith('.jsonl')) continue;
      const session = parseSession(join(full, file.name), weights);
      if (!session) continue;
      everything.push(session);
      const cwd = norm(session.cwd);
      if (cwd === target || cwd.startsWith(target + '\\') || dir.name.toLowerCase() === ownDir) {
        mine.push(session);
      }
    }
  }
  return { everything, mine };
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const index = Math.min(ordered.length - 1, pyRound(fraction * (ordered.length - 1)));
  return ordered[index];
}

function rollingBlock(sessions, now) {
  const cutoff = now - BLOCK;
  return sessions.filter((s) => s.end >= cutoff).reduce((a, s) => a + s.tokens, 0);
}

function largestBlock(sessions) {
  let best = 0;
  for (const anchor of sessions.map((s) => s.start).sort((a, b) => a - b)) {
    const window = sessions
      .filter((s) => anchor <= s.start && s.start < anchor + BLOCK)
      .reduce((a, s) => a + s.tokens, 0);
    best = Math.max(best, window);
  }
  return best;
}

const fmt = (n) => n.toLocaleString('en-US');

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!existsSync(args.projectsDir) || !statSync(args.projectsDir).isDirectory()) {
    fail(`no hay carpeta de transcripts en ${args.projectsDir}`);
  }

  let config = {};
  const configPath = isAbsolute(args.config) ? args.config : resolve(args.config);
  if (existsSync(configPath) && statSync(configPath).isFile()) {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  }

  const weights = { ...DEFAULT_WEIGHTS, ...(config.weights || {}) };

  const now = Date.now();
  const { everything, mine } = load(args.projectsDir, args.projectPath, weights);

  // Fuera la sesión abierta (esta), para que no tuerza la base.
  const closed = mine.filter((s) => s.end < now - 3 * 60_000);
  const baseline = closed
    .sort((a, b) => a.end - b.end)
    .slice(-10)
    .map((s) => s.tokens);

  const taskP50 = percentile(baseline, 0.5);
  const taskP80 = percentile(baseline, 0.8);
  const confidence = baseline.length >= 5 ? 'alta' : baseline.length >= 3 ? 'media' : 'baja';
  // Con pocas sesiones el p80 es un solo valor atípico: se usa la mediana.
  const estimate = baseline.length >= 5 ? taskP80 : taskP50;
  const taskCost = args.taskCost || estimate;

  const blockUsed = rollingBlock(everything, now);
  const weekUsed = everything.filter((s) => s.end >= now - WEEK).reduce((a, s) => a + s.tokens, 0);

  // Un % de /status da el tope: tope = usado / (pct / 100). Otros dispositivos
  // inflan el % real, así que con solo estos transcripts el tope sale menor (prudente).
  let blockCeiling = Math.trunc(Number(config.blockCeiling) || 0);
  let weeklyCeiling = Math.trunc(Number(config.weeklyCeiling) || 0);
  let calibrated = false;
  if (args.sessionPct > 0 && blockUsed > 0) {
    blockCeiling = pyRound(blockUsed / (args.sessionPct / 100));
    calibrated = true;
  }
  if (args.weeklyPct > 0 && weekUsed > 0) {
    weeklyCeiling = pyRound(weekUsed / (args.weeklyPct / 100));
    calibrated = true;
  }

  const proxy = blockCeiling <= 0;
  if (proxy) blockCeiling = largestBlock(everything);
  const blockLeft = Math.max(0, blockCeiling - blockUsed);

  const burn = everything.filter((s) => s.end >= now - HOUR).reduce((a, s) => a + s.tokens, 0);

  const weekLeft = weeklyCeiling ? Math.max(0, weeklyCeiling - weekUsed) : 0;

  const headroom = taskCost ? blockLeft / taskCost : Infinity;
  const weeklyBlocks = Boolean(weeklyCeiling && taskCost && weekLeft < taskCost);
  let verdict;
  if (taskCost === 0) {
    verdict = 'SIN DATOS — haz 1-2 tareas para tener una base';
  } else if (weeklyBlocks) {
    verdict = 'STOP — el límite semanal no cubre otra tarea';
  } else if (proxy) {
    verdict =
      'SIN TECHO FIABLE — pásame los datos de /status con ' +
      '--session-pct N --weekly-pct M (o pon blockCeiling en ' +
      '.claude/budget.local.json); los KPIs de arriba son orientativos';
  } else if (headroom >= 2.0) {
    verdict = 'GO — hay margen para la siguiente tarea';
  } else if (headroom >= 1.2) {
    verdict = 'CAUTION — cabe una tarea; revisa antes de la siguiente';
  } else {
    verdict = 'STOP — no empieces otra tarea en este bloque';
  }

  // Un STOP o CAUTION solo por el bloque da igual si el bloque se reinicia pronto.
  if (
    args.resetMin > 0 &&
    args.resetMin <= 60 &&
    !weeklyBlocks &&
    (verdict.startsWith('STOP') || verdict.startsWith('CAUTION'))
  ) {
    verdict += `  ·  o espera ${args.resetMin} min al reset del bloque`;
  }

  const usedPct = blockCeiling ? `  (${pyRound((blockUsed / blockCeiling) * 100)}%)` : '';
  const proxyNote = proxy ? '  (proxy: mayor bloque histórico)' : calibrated ? '  (calibrado con /status)' : '';
  const label = baseline.length >= 5 ? 'p80' : 'mediana';
  const out = [
    '== Previsión de presupuesto (Claude Code) ==',
    `Sesiones del proyecto analizadas : ${mine.length} (base: ${baseline.length})`,
    `Confianza del pronóstico         : ${confidence}`,
    '',
    'KPIs',
    `  Coste por tarea p50 / p80       : ${fmt(taskP50)} / ${fmt(taskP80)} tok`,
    `  Coste estimado próxima tarea (${label}): ${fmt(taskCost)} tok`,
    `  Techo por bloque de 5 h         : ${fmt(blockCeiling)} tok${proxyNote}`,
    `  Consumido en el bloque actual   : ${fmt(blockUsed)} tok${usedPct}`,
    `  Presupuesto restante en bloque  : ${fmt(blockLeft)} tok`,
  ];
  if (weeklyCeiling) out.push(`  Semana: usado / restante        : ${fmt(weekUsed)} / ${fmt(weekLeft)} tok`);
  if (args.resetMin) out.push(`  Reset del bloque en             : ${args.resetMin} min`);
  out.push(
    `  Ritmo última hora               : ${fmt(burn)} tok/h`,
    `  Holgura (restante / coste tarea): ${Number.isFinite(headroom) ? headroom.toFixed(1) : 'inf'}x`,
    '',
    `Veredicto: ${verdict}`,
  );
  console.log(out.join('\n'));
}

main();
