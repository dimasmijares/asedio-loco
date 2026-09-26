#!/usr/bin/env node
// Puerta KDD y lista de pendientes, sobre la librería de tools/spec-graph.
//
//   node scripts/kdd.mjs check        grafo, huérfanos y ciclo de vida (sale con 1 si algo falla)
//   node scripts/kdd.mjs pendientes   tareas sin terminar, agrupadas por plan, y cuáles están listas
//
// `check` es más estricto que `spec-graph validate`: allí solo los errores paran; aquí también
// paran los avisos de estado, padre, patrón de id y ciclos. Solo se ignora `stale-spec`.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraph, validateGraph, findOrphans } from '../tools/spec-graph/spec-graph-lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const graph = buildGraph(resolve(root, 'specs'), root);
const byId = new Map(graph.nodes.map((n) => [n.id, n]));
const TERMINAL = new Set(['completed', 'archived']);
const isWork = (n) => n?.layer?.startsWith('work-');

// spec-graph guarda `parent` como un enlace depends-on más: el padre es el que tiene la capa de arriba.
const PARENT_LAYER = { 'work-task': 'work-plan', 'work-plan': 'work-spec' };
const dependsOn = (n) =>
  graph.edges.filter((e) => e.source === n.id && e.relation === 'depends-on').map((e) => byId.get(e.target));
const parentOf = (n) => dependsOn(n).find((d) => d?.layer === PARENT_LAYER[n.layer])?.id;
const taskDeps = (n) => dependsOn(n).filter((d) => d?.layer === n.layer);

function section(body, title) {
  const m = body.match(new RegExp(`^## ${title}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return m ? m[1].trim() : null;
}

function lifecycle() {
  const issues = [];
  const active = graph.nodes.filter((n) => n.layer === 'work-task' && n.status === 'active');
  if (active.length > 1) {
    issues.push(`Hay más de una WRK-TASK activa: ${active.map((n) => n.id).join(', ')}.`);
  }
  for (const n of graph.nodes.filter(isWork)) {
    const body = n.body || '';
    if (TERMINAL.has(n.status)) {
      if (/^\s*- \[ \]/m.test(body)) issues.push(`${n.id} está ${n.status} con criterios sin marcar.`);
      const ev = section(body, 'Evidence');
      if (!ev || /^(pendiente|pending)/i.test(ev) || /^\{.*\}$/s.test(ev)) {
        issues.push(`${n.id} está ${n.status} sin Evidence.`);
      }
    }
    const parent = byId.get(parentOf(n));
    if (n.layer === 'work-task' && n.status === 'active') {
      if (!/^## (File Scope|Scope)\s*$/m.test(body)) issues.push(`${n.id} está activa sin File Scope.`);
      for (const d of taskDeps(n)) {
        if (!TERMINAL.has(d.status)) issues.push(`${n.id} está activa y depende de ${d.id}, que está ${d.status}.`);
      }
      const spec = parent && byId.get(parentOf(parent));
      if (parent?.layer === 'work-plan' && parent.status !== 'active') {
        issues.push(`${n.id} está activa pero su plan ${parent.id} está ${parent.status}.`);
      }
      if (spec && spec.status !== 'active') issues.push(`${n.id} está activa pero ${spec.id} está ${spec.status}.`);
    }
    if (n.status === 'archived' && parent && parent.status !== 'archived') {
      issues.push(`${n.id} está archivada pero su padre ${parent.id} no.`);
    }
  }
  return issues;
}

function check() {
  const problems = [];
  for (const e of graph._errors) problems.push(`No se puede leer ${e.file}: ${e.error}`);
  for (const i of validateGraph(graph)) {
    if (i.type !== 'stale-spec') problems.push(`[${i.type}] ${i.message}`);
  }
  for (const id of findOrphans(graph.nodes, graph.edges)) problems.push(`[huérfana] ${id} no enlaza con nada`);
  problems.push(...lifecycle().map((m) => `[ciclo de vida] ${m}`));

  if (problems.length) {
    console.error(`KDD: ${problems.length} problema(s)\n`);
    for (const p of problems) console.error(`  ✘ ${p}`);
    process.exit(1);
  }
  console.log(`KDD en orden: ${graph.nodes.length} especificaciones y ${graph.edges.length} enlaces.`);
}

function pendientes() {
  const tasks = graph.nodes.filter((n) => n.layer === 'work-task' && !TERMINAL.has(n.status));
  if (!tasks.length) {
    console.log('No hay tareas pendientes.');
    return;
  }
  const groups = new Map();
  for (const t of tasks) {
    const key = parentOf(t) || '(sin plan)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  for (const [planId, list] of groups) {
    const plan = byId.get(planId);
    console.log(`\n${planId}${plan ? ` · ${plan.title?.replace(/^\S+ — /, '')} [${plan.status}]` : ''}`);
    for (const t of list.sort((a, b) => a.id.localeCompare(b.id))) {
      const waiting = taskDeps(t).filter((d) => !TERMINAL.has(d.status)).map((d) => d.id);
      const mark = t.status === 'active' ? '▶' : waiting.length ? '·' : '✓';
      const note = t.status === 'active' ? 'en curso' : waiting.length ? `espera a ${waiting.join(', ')}` : 'lista';
      console.log(`  ${mark} ${t.id} ${t.title?.replace(/^\S+ — /, '')} (${note})`);
    }
  }
  console.log('\n▶ en curso   ✓ lista para empezar   · bloqueada por otra tarea');
}

const cmd = process.argv[2];
if (cmd === 'check') check();
else if (cmd === 'pendientes') pendientes();
else {
  console.error('Uso: node scripts/kdd.mjs check|pendientes');
  process.exit(2);
}
