/**
 * spec-graph-lib — Pure functions for the spec-driven knowledge graph.
 *
 * The frontmatter of each spec IS the graph (distributed in files).
 * This library scans, parses, and makes it queryable.
 */

import matter from 'gray-matter';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Inverse relation map for enrichment. */
export const INVERSE_RELATIONS = {
  implements: 'implemented-by',
  'constrained-by': 'constrains',
  extends: 'extended-by',
  'uses-data-from': 'data-used-by',
  supersedes: 'superseded-by',
  'depends-on': 'depended-on-by',
  activates: 'activated-by',
};

/** Layer colors for visualizations. */
export const LAYER_COLORS = {
  // Knowledge axis
  architecture: '#4a9eff',
  domain: '#51cf66',
  product: '#ffd43b',
  feature: '#ff922b',
  documentation: '#cc5de8',
  // Work axis
  'work-spec': '#ff6b6b',
  'work-plan': '#e599f7',
  'work-task': '#ffa8a8',
};

/** Governance type colors (keyed by type, not layer). */
export const GOVERNANCE_COLORS = {
  rfc: '#20c997',
  adr: '#339af0',
  rule: '#f06595',
};

/** Axis classification: maps layer/type to axis. */
const KNOWLEDGE_LAYERS = new Set(['architecture', 'domain', 'product', 'feature', 'documentation']);
const WORK_LAYERS = new Set(['work-spec', 'work-plan', 'work-task']);
const GOVERNANCE_TYPES = new Set(['rfc', 'adr', 'rule']);

/** Classify a node into its axis: knowledge, work, governance, or unknown. */
export function classifyAxis(node) {
  if (GOVERNANCE_TYPES.has(node.type)) return 'governance';
  if (WORK_LAYERS.has(node.layer)) return 'work';
  if (KNOWLEDGE_LAYERS.has(node.layer)) return 'knowledge';
  return 'unknown';
}

/** Valid statuses per axis/type. */
export const VALID_STATUSES = {
  knowledge: ['draft', 'active', 'deprecated'],
  work: ['draft', 'active', 'completed', 'archived'],
  rfc: ['draft', 'discussion', 'accepted', 'rejected', 'withdrawn'],
  adr: ['proposed', 'accepted', 'deprecated', 'superseded'],
  rule: ['active', 'deprecated'],
};

/** Get valid statuses for a node based on its axis and type. */
function getValidStatuses(node) {
  if (GOVERNANCE_TYPES.has(node.type)) return VALID_STATUSES[node.type];
  const axis = classifyAxis(node);
  return VALID_STATUSES[axis] || null;
}

/** ID patterns per layer/type. */
const ID_PATTERNS = {
  architecture: /^ARCH-\d{3}$/,
  domain: /^DOM-[A-Z]+-\d{3}$/,
  product: /^PROD-[A-Z]+-\d{3}$/,
  feature: /^FEAT-[A-Z]+-\d{3}$/,
  documentation: /^DOC-[A-Z]+-\d{3}$/,
  'work-spec': /^WRK-SPEC-\d{3}$/,
  'work-plan': /^WRK-PLAN-\d{3}$/,
  'work-task': /^WRK-TASK-\d{3}$/,
  rfc: /^RFC-\d{3}$/,
  adr: /^ADR-\d{3}$/,
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/** Recursively find all .md files under a directory. */
export function findMarkdownFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && !entry.startsWith('.') && entry !== '_build' && entry !== 'node_modules') {
      results.push(...findMarkdownFiles(full));
    } else if (entry.endsWith('.md') && stat.isFile()) {
      results.push(full);
    }
  }
  return results;
}

/** Parse all specs from a directory, returning nodes + raw edges. */
export function scanSpecs(specsDir, basePath) {
  const files = findMarkdownFiles(specsDir);
  const nodes = [];
  const edges = [];
  const errors = [];

  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, 'utf-8');
    } catch {
      errors.push({ file, error: 'Could not read file' });
      continue;
    }

    let parsed;
    try {
      parsed = matter(content);
    } catch {
      errors.push({ file, error: 'Could not parse YAML frontmatter' });
      continue;
    }

    const fm = parsed.data;
    if (!fm.id) continue; // Not a spec (e.g., README, index)

    const relPath = relative(basePath || process.cwd(), file);

    // Extract title from first # heading in body
    const titleMatch = parsed.content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : null;

    const node = {
      id: fm.id,
      type: fm.type || 'spec',
      layer: fm.layer || null,
      domain: fm.domain || null,
      subdomain: fm.subdomain || null,
      status: fm.status || 'draft',
      confidence: fm.confidence || 'low',
      owner: fm.owner || null,
      version: fm.version || null,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      title,
      file: relPath,
      body: parsed.content || null,
      // Enriched fields (P1)
      created: fm.created || null,
      updated: fm.updated || null,
      reviewers: Array.isArray(fm.reviewers) ? fm.reviewers : [],
      scope: fm.scope || null,
    };
    node._axis = classifyAxis(node);
    if (!node.scope) {
      node.scope = node._axis === 'knowledge' ? 'persistent'
        : node._axis === 'work' ? 'ephemeral'
        : node._axis === 'governance' ? (node.type === 'rfc' ? 'ephemeral' : 'persistent')
        : null;
    }
    nodes.push(node);

    if (Array.isArray(fm.dependencies)) {
      for (const dep of fm.dependencies) {
        if (dep && dep.id) {
          edges.push({
            source: fm.id,
            target: dep.id,
            relation: dep.relation || 'depends-on',
          });
        }
      }
    }

    if (fm.supersedes) {
      edges.push({
        source: fm.id,
        target: fm.supersedes,
        relation: 'supersedes',
      });
    }

    // Parse `activates` field (Work Artifacts → Knowledge Artifacts)
    if (Array.isArray(fm.activates)) {
      for (const targetId of fm.activates) {
        if (typeof targetId === 'string') {
          edges.push({
            source: fm.id,
            target: targetId,
            relation: 'activates',
          });
        }
      }
    }

    // Parse `parent` field (WRK-TASK → WRK-PLAN, WRK-PLAN → WRK-SPEC)
    if (fm.parent) {
      edges.push({
        source: fm.id,
        target: fm.parent,
        relation: 'depends-on',
      });
    }
  }

  return { nodes, edges, errors };
}

/** Build the full graph object with metadata. */
export function buildGraph(specsDir, basePath) {
  const { nodes, edges, errors } = scanSpecs(specsDir, basePath);
  const orphanIds = findOrphans(nodes, edges);

  return {
    nodes,
    edges,
    metadata: {
      generated: new Date().toISOString(),
      spec_count: nodes.length,
      edge_count: edges.length,
      orphan_count: orphanIds.length,
    },
    _errors: errors,
  };
}

// ─── Graph Traversal ──────────────────────────────────────────────────────────

/** Build adjacency list (outgoing + incoming) for BFS. */
export function buildAdjacency(edges) {
  const adj = new Map();
  const reverseAdj = new Map();

  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source).push({ target: edge.target, relation: edge.relation });

    if (!reverseAdj.has(edge.target)) reverseAdj.set(edge.target, []);
    reverseAdj.get(edge.target).push({ source: edge.source, relation: edge.relation });
  }
  return { adj, reverseAdj };
}

/** BFS to find all specs transitively affected by a change to `startId`. */
export function impactBFS(startId, edges, nodes) {
  const { reverseAdj } = buildAdjacency(edges);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set();
  const queue = [startId];
  const result = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    const dependents = reverseAdj.get(current) || [];
    for (const { source, relation } of dependents) {
      if (!visited.has(source)) {
        const inverse = INVERSE_RELATIONS[relation] || `inverse(${relation})`;
        result.push({
          id: source,
          relation: inverse,
          via: current,
          node: nodeMap.get(source) || null,
        });
        queue.push(source);
      }
    }
  }
  return result;
}

/** Find specs with no inbound AND no outbound edges. */
export function findOrphans(nodes, edges) {
  const connected = new Set();
  for (const edge of edges) {
    connected.add(edge.source);
    connected.add(edge.target);
  }
  return nodes.filter((n) => !connected.has(n.id)).map((n) => n.id);
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Detect cycles using DFS with coloring (white/gray/black). */
export function detectCycles(nodes, edges) {
  const adj = new Map();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source).push(edge.target);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(nodes.map((n) => [n.id, WHITE]));
  const parent = new Map();
  const cycles = [];

  function dfs(node) {
    color.set(node, GRAY);
    for (const neighbor of (adj.get(node) || [])) {
      if (color.get(neighbor) === GRAY) {
        const cycle = [neighbor, node];
        let cur = node;
        while (parent.has(cur) && parent.get(cur) !== neighbor) {
          cur = parent.get(cur);
          cycle.push(cur);
        }
        cycle.reverse();
        cycles.push(cycle);
      } else if (color.get(neighbor) === WHITE || color.get(neighbor) === undefined) {
        parent.set(neighbor, node);
        dfs(neighbor);
      }
    }
    color.set(node, BLACK);
  }

  for (const node of nodes) {
    if (color.get(node.id) === WHITE) {
      dfs(node.id);
    }
  }

  return cycles;
}

/** Validate integrity: broken refs, duplicate IDs, confidence inconsistencies. */
export function validateGraph(graph) {
  const issues = [];
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const idCounts = new Map();

  for (const node of graph.nodes) {
    idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({ severity: 'error', type: 'duplicate-id', id, message: `ID "${id}" appears ${count} times` });
    }
  }

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.target)) {
      issues.push({
        severity: 'error',
        type: 'broken-ref',
        source: edge.source,
        target: edge.target,
        message: `"${edge.source}" references "${edge.target}" which does not exist`,
      });
    }
  }

  const deprecatedIds = new Set(graph.nodes.filter((n) => n.status === 'deprecated').map((n) => n.id));
  for (const edge of graph.edges) {
    if (deprecatedIds.has(edge.target)) {
      issues.push({
        severity: 'warning',
        type: 'deprecated-ref',
        source: edge.source,
        target: edge.target,
        message: `"${edge.source}" depends on deprecated spec "${edge.target}"`,
      });
    }
  }

  const cycles = detectCycles(graph.nodes, graph.edges);
  for (const cycle of cycles) {
    issues.push({
      severity: 'warning',
      type: 'cycle',
      path: cycle,
      message: `Dependency cycle detected: ${cycle.join(' → ')}`,
    });
  }

  // P2: Lifecycle validation — invalid statuses per axis/type
  for (const node of graph.nodes) {
    const validStatuses = getValidStatuses(node);
    if (validStatuses && !validStatuses.includes(node.status)) {
      issues.push({
        severity: 'warning',
        type: 'invalid-status',
        id: node.id,
        message: `"${node.id}" has status "${node.status}" which is invalid for ${node._axis}/${node.type}. Valid: ${validStatuses.join(', ')}`,
      });
    }
  }

  // P2: Missing parent for work hierarchy
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  for (const node of graph.nodes) {
    if (node.layer === 'work-task' || node.layer === 'work-plan') {
      const parentEdge = graph.edges.find(
        (e) => e.source === node.id && e.relation === 'depends-on' &&
        nodeMap.has(e.target) &&
        (node.layer === 'work-task' ? nodeMap.get(e.target).layer === 'work-plan' : nodeMap.get(e.target).layer === 'work-spec')
      );
      if (!parentEdge) {
        const expected = node.layer === 'work-task' ? 'work-plan' : 'work-spec';
        issues.push({
          severity: 'warning',
          type: 'missing-parent',
          id: node.id,
          message: `"${node.id}" (${node.layer}) has no parent ${expected}`,
        });
      }
    }
  }

  // P2: ID pattern validation
  for (const node of graph.nodes) {
    const pattern = ID_PATTERNS[node.layer] || (GOVERNANCE_TYPES.has(node.type) ? ID_PATTERNS[node.type] : null);
    if (pattern && !pattern.test(node.id)) {
      issues.push({
        severity: 'warning',
        type: 'id-pattern',
        id: node.id,
        message: `"${node.id}" does not match expected pattern ${pattern} for ${node.layer || node.type}`,
      });
    }
  }

  // P6: Freshness warnings for stale knowledge specs
  const now = new Date();
  const STALE_DAYS = 180;
  for (const node of graph.nodes) {
    if (node._axis === 'knowledge' && node.status === 'active' && node.updated) {
      const updatedDate = new Date(node.updated);
      if (!isNaN(updatedDate.getTime())) {
        const daysSinceUpdate = (now - updatedDate) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > STALE_DAYS) {
          issues.push({
            severity: 'warning',
            type: 'stale-spec',
            id: node.id,
            message: `"${node.id}" has not been updated in ${Math.round(daysSinceUpdate)} days (last: ${node.updated})`,
          });
        }
      }
    }
  }

  return issues;
}

// ─── Visualization ────────────────────────────────────────────────────────────

/** Check if a layer is a work artifact layer. */
function isWorkLayer(layer) {
  return layer === 'work-spec' || layer === 'work-plan' || layer === 'work-task';
}

/** Generate Mermaid diagram from graph. */
export function generateMermaid(graph) {
  const lines = ['graph TD'];

  for (const node of graph.nodes) {
    const label = `${node.id}<br/>${node.layer || 'unknown'}`;
    // Work artifacts use dashed borders (stadium shape)
    if (isWorkLayer(node.layer)) {
      lines.push(`    ${node.id}([${label}])`);
    } else {
      lines.push(`    ${node.id}[${label}]`);
    }
  }

  lines.push('');

  for (const edge of graph.edges) {
    lines.push(`    ${edge.source} -->|${edge.relation}| ${edge.target}`);
  }

  lines.push('');

  for (const node of graph.nodes) {
    const color = LAYER_COLORS[node.layer] || '#868e96';
    lines.push(`    style ${node.id} fill:${color}`);
  }

  return lines.join('\n');
}

// ─── New Query Functions (Phase 2) ────────────────────────────────────────────

/**
 * Filter specs by composable predicates (AND logic).
 * All provided criteria must match.
 */
export function filterSpecs(graph, criteria = {}) {
  return graph.nodes.filter((node) => {
    if (criteria.layer && node.layer !== criteria.layer) return false;
    if (criteria.domain && node.domain !== criteria.domain) return false;
    if (criteria.subdomain && node.subdomain !== criteria.subdomain) return false;
    if (criteria.confidence && node.confidence !== criteria.confidence) return false;
    if (criteria.status && node.status !== criteria.status) return false;
    if (criteria.tag && !(node.tags || []).includes(criteria.tag)) return false;
    if (criteria.type && node.type !== criteria.type) return false;
    if (criteria.axis && node._axis !== criteria.axis) return false;
    if (criteria.scope && node.scope !== criteria.scope) return false;
    return true;
  });
}

/**
 * Find shortest path between two specs using BFS (bidirectional edges).
 * Returns array of { id, relation, direction } or null if no path.
 */
export function findPath(sourceId, targetId, edges, nodes) {
  // Build undirected adjacency
  const adj = new Map();
  const addEdge = (from, to, relation, direction) => {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push({ neighbor: to, relation, direction });
  };

  for (const edge of edges) {
    addEdge(edge.source, edge.target, edge.relation, 'outgoing');
    const inverse = INVERSE_RELATIONS[edge.relation] || `inverse(${edge.relation})`;
    addEdge(edge.target, edge.source, inverse, 'incoming');
  }

  // BFS
  const visited = new Set([sourceId]);
  const queue = [[sourceId]];
  const parentMap = new Map(); // id -> { from, relation, direction }

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current === targetId) {
      // Reconstruct path with relations
      const result = [{ id: sourceId, relation: null, direction: null }];
      let cur = sourceId;
      for (let i = 1; i < path.length; i++) {
        const next = path[i];
        const info = parentMap.get(`${cur}->${next}`);
        result.push({
          id: next,
          relation: info ? info.relation : null,
          direction: info ? info.direction : null,
        });
        cur = next;
      }
      return result;
    }

    for (const { neighbor, relation, direction } of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(`${current}->${neighbor}`, { relation, direction });
        queue.push([...path, neighbor]);
      }
    }
  }

  return null; // No path found
}

/**
 * Build contextual activation bundle for a spec.
 * Returns the spec + its neighborhood up to `depth` hops, grouped by layer.
 */
export function buildContext(specId, graph, options = {}) {
  const { depth = 1 } = options;
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const rootNode = nodeMap.get(specId);

  if (!rootNode) return null;

  const { adj, reverseAdj } = buildAdjacency(graph.edges);

  // BFS up to depth
  const visited = new Map(); // id -> { depth, relations }
  visited.set(specId, { depth: 0, relations: [] });
  const queue = [{ id: specId, currentDepth: 0 }];

  while (queue.length > 0) {
    const { id, currentDepth } = queue.shift();
    if (currentDepth >= depth) continue;

    // Outgoing edges (dependencies)
    for (const { target, relation } of (adj.get(id) || [])) {
      if (!visited.has(target)) {
        visited.set(target, {
          depth: currentDepth + 1,
          relations: [{ from: id, relation, direction: 'dependency' }],
        });
        queue.push({ id: target, currentDepth: currentDepth + 1 });
      }
    }

    // Incoming edges (dependents)
    for (const { source, relation } of (reverseAdj.get(id) || [])) {
      if (!visited.has(source)) {
        const inverse = INVERSE_RELATIONS[relation] || `inverse(${relation})`;
        visited.set(source, {
          depth: currentDepth + 1,
          relations: [{ from: id, relation: inverse, direction: 'dependent' }],
        });
        queue.push({ id: source, currentDepth: currentDepth + 1 });
      }
    }
  }

  // Group by layer
  const grouped = {};
  for (const [id, info] of visited) {
    const node = nodeMap.get(id);
    if (!node) continue;
    const layer = node.layer || 'unspecified';
    if (!grouped[layer]) grouped[layer] = [];
    grouped[layer].push({
      ...node,
      _contextDepth: info.depth,
      _contextRelations: info.relations,
    });
  }

  return {
    root: specId,
    depth,
    totalSpecs: visited.size,
    byLayer: grouped,
  };
}

/**
 * Analyze the impact of upgraded dependency specs on work artifacts.
 *
 * @param {Array<{id: string, change: 'added'|'removed'|'modified'}>} changedSpecs
 * @param {object} graph - Full graph from buildGraph()
 * @param {object} [options]
 * @param {'work'|'all'} [options.scope='work'] - Filter affected specs by axis
 * @returns {{ changes: Array, affected: Array, summary: object }}
 */
export function upgradeImpact(changedSpecs, graph, options = {}) {
  const { scope = 'work' } = options;
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const { reverseAdj } = buildAdjacency(graph.edges);

  const HIGH_RELATIONS = new Set(['activates', 'implements']);
  const MEDIUM_RELATIONS = new Set(['depends-on', 'constrained-by', 'uses-data-from', 'extends']);

  const affected = new Map(); // id -> { node, severity, reason, via, depth }

  for (const changed of changedSpecs) {
    // BFS reverse to find all dependents
    const visited = new Set([changed.id]);
    const queue = [{ id: changed.id, depth: 0 }];

    while (queue.length > 0) {
      const { id: current, depth } = queue.shift();
      const dependents = reverseAdj.get(current) || [];

      for (const { source, relation } of dependents) {
        if (visited.has(source)) continue;
        visited.add(source);

        const node = nodeMap.get(source);
        if (!node) continue;

        // Filter by scope
        if (scope === 'work' && node._axis !== 'work') {
          // Still traverse through non-work nodes to find transitive work dependents
          queue.push({ id: source, depth: depth + 1 });
          continue;
        }

        // Determine severity
        let severity;
        if (depth === 0 && HIGH_RELATIONS.has(relation)) {
          severity = 'high';
        } else if (depth === 0 && MEDIUM_RELATIONS.has(relation)) {
          severity = 'medium';
        } else {
          severity = 'low';
        }

        const existing = affected.get(source);
        const severityRank = { high: 3, medium: 2, low: 1 };
        if (!existing || severityRank[severity] > severityRank[existing.severity]) {
          affected.set(source, {
            id: source,
            node,
            severity,
            relation,
            changedSpec: changed.id,
            change: changed.change,
            via: depth === 0 ? changed.id : current,
            depth: depth + 1,
          });
        }

        queue.push({ id: source, depth: depth + 1 });
      }
    }
  }

  const affectedList = [...affected.values()].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  const summary = {
    changedCount: changedSpecs.length,
    affectedCount: affectedList.length,
    high: affectedList.filter((a) => a.severity === 'high').length,
    medium: affectedList.filter((a) => a.severity === 'medium').length,
    low: affectedList.filter((a) => a.severity === 'low').length,
  };

  return { changes: changedSpecs, affected: affectedList, summary };
}

/**
 * Build activation context for a work artifact with tiered output.
 * Tier 1: explicitly activated specs + depth-1 neighbors
 * Tier 2: depth-2 neighbors
 * Tier 3: depth-3+ (reference only)
 */
export function buildActivationContext(specId, graph, options = {}) {
  const { depth = 3 } = options;
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const rootNode = nodeMap.get(specId);

  if (!rootNode) return null;

  // Collect explicitly activated spec IDs
  const activatedIds = new Set();
  for (const edge of graph.edges) {
    if (edge.source === specId && edge.relation === 'activates') {
      activatedIds.add(edge.target);
    }
  }

  const { adj, reverseAdj } = buildAdjacency(graph.edges);

  // BFS from root up to depth
  const visited = new Map(); // id -> { depth, via }
  visited.set(specId, { depth: 0, via: null });
  const queue = [{ id: specId, currentDepth: 0 }];

  while (queue.length > 0) {
    const { id, currentDepth } = queue.shift();
    if (currentDepth >= depth) continue;

    for (const { target, relation } of (adj.get(id) || [])) {
      if (!visited.has(target)) {
        visited.set(target, { depth: currentDepth + 1, via: id, relation });
        queue.push({ id: target, currentDepth: currentDepth + 1 });
      }
    }

    for (const { source, relation } of (reverseAdj.get(id) || [])) {
      if (!visited.has(source)) {
        const inverse = INVERSE_RELATIONS[relation] || `inverse(${relation})`;
        visited.set(source, { depth: currentDepth + 1, via: id, relation: inverse });
        queue.push({ id: source, currentDepth: currentDepth + 1 });
      }
    }
  }

  // Classify into tiers
  const tiers = { 1: [], 2: [], 3: [] };

  for (const [id, info] of visited) {
    if (id === specId) continue;
    const node = nodeMap.get(id);
    if (!node) continue;

    let tier;
    if (activatedIds.has(id) || info.depth <= 1) {
      tier = 1;
    } else if (info.depth === 2) {
      tier = 2;
    } else {
      tier = 3;
    }

    tiers[tier].push({
      ...node,
      _tier: tier,
      _depth: info.depth,
      _via: info.via,
      _relation: info.relation || null,
      _explicit: activatedIds.has(id),
    });
  }

  return {
    root: specId,
    rootNode,
    depth,
    totalSpecs: visited.size - 1,
    activatedCount: activatedIds.size,
    byTier: tiers,
  };
}
