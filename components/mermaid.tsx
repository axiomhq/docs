'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

// Diagrams are themed from the Axiom semantic tokens rather than mermaid's
// stock palettes, read off :root at render time so they follow data-theme.
function axiomThemeVariables(dark: boolean) {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return {
    fontFamily: token('--font-mono'),
    fontSize: '12.5px',
    background: token('--bg-canvas'),
    // Node boxes.
    primaryColor: token('--bg-emph-tertiary'),
    primaryBorderColor: token('--border-strong'),
    primaryTextColor: token('--text-primary'),
    mainBkg: token('--bg-emph-tertiary'),
    nodeBorder: token('--border-strong'),
    // Subgraph containers sit one step quieter than nodes so the boxes read
    // as grouping, not as more nodes. No token this faint; keep it literal.
    clusterBkg: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    clusterBorder: token('--border-primary'),
    titleColor: token('--text-quaternary'),
    // Edges and labels. Edges keep one literal grey across themes; it reads as
    // chrome on both canvases and matches the reviewed diagram style.
    lineColor: '#575757',
    textColor: token('--text-secondary'),
    edgeLabelBackground: token('--bg-canvas'),
    // Secondary/tertiary shapes fall back to quiet surfaces.
    secondaryColor: token('--bg-inert'),
    secondaryBorderColor: token('--border-primary'),
    tertiaryColor: token('--bg-inert'),
    tertiaryBorderColor: token('--border-primary'),
  };
}

// Injected into the rendered SVG. The SVG is inline in the page, so CSS
// variables resolve and flip with data-theme like everything else. Light
// canvases wash the brand tints out, so they get a stronger mix than dark.
function themeCss(dark: boolean) {
  const fill = dark ? '8%' : '15%';
  const stroke = dark ? '62%' : '80%';
  return `
  .node rect, .cluster rect { rx: 4px; ry: 4px; }
  /* Horizontal-only: vertical space comes from flowchart.padding alone so the
     boxes stay shallow. */
  .nodeLabel { font-weight: 450; letter-spacing: -.01em; padding: 0 7px; line-height: 1.35; }
  /* Mermaid wraps html labels as span > p inside a line-height 1.5 div. The
     block p splits the inline span into empty line fragments above and below,
     so every label measures two extra line boxes tall and the node grows to
     match. Inlining the p and pinning the wrapper's line-height (inline style,
     hence !important) removes the phantom height at measure time. */
  .nodeLabel p, .edgeLabel p, .cluster-label p { display: inline; margin: 0; }
  foreignObject > div { line-height: 1.35 !important; }
  .cluster-label span, .cluster-label .nodeLabel, .cluster-label text {
    text-transform: uppercase; font-size: 10px; font-weight: 600; letter-spacing: .09em;
  }
  .edgePaths path { stroke-width: 1.25px; stroke-linecap: round; }
  .marker { stroke-width: 1px; }
  .node[data-axiom-brand] rect, .node[data-axiom-brand] path,
  .node.axiom rect, .node.axiom path {
    stroke: color-mix(in srgb, var(--color-accent) ${stroke}, transparent);
    fill: color-mix(in srgb, var(--color-accent) ${fill}, transparent);
  }
  /* Mermaid inlines colours on the nested label elements, so descendants and
     !important are both needed for the brand label to win. */
  .node[data-axiom-brand] .nodeLabel, .node[data-axiom-brand] .nodeLabel *,
  .node.axiom .nodeLabel, .node.axiom .nodeLabel * {
    color: var(--color-accent-text) !important; font-weight: 600;
  }
  /* Charts opt nodes into product colours with :::axiom / :::splunk. The green
     scale flips with data-theme, so both modes stay readable. */
  .node.splunk rect, .node.splunk path {
    stroke: color-mix(in srgb, var(--green-9) ${stroke}, transparent);
    fill: color-mix(in srgb, var(--green-9) ${fill}, transparent);
  }
  .node.splunk .nodeLabel, .node.splunk .nodeLabel * {
    color: var(--green-11) !important; font-weight: 600;
  }
  /* Sequence-diagram actors, tagged by name in tagBrandNodes. Mermaid styles
     actors through id-scoped selectors, so !important is needed to win. */
  g[data-brand="axiom"] rect.actor {
    stroke: color-mix(in srgb, var(--color-accent) ${stroke}, transparent) !important;
    fill: color-mix(in srgb, var(--color-accent) ${fill}, transparent) !important;
  }
  g[data-brand="axiom"] text.actor, g[data-brand="axiom"] text.actor tspan {
    fill: var(--color-accent-text) !important; font-weight: 600;
  }
  g[data-brand="splunk"] rect.actor {
    stroke: color-mix(in srgb, var(--green-9) ${stroke}, transparent) !important;
    fill: color-mix(in srgb, var(--green-9) ${fill}, transparent) !important;
  }
  g[data-brand="splunk"] text.actor, g[data-brand="splunk"] text.actor tspan {
    fill: var(--green-11) !important; font-weight: 600;
  }
`;
}

// Emit an M/L/Q path through the points, replacing each bend with a small
// quadratic arc so corners read as rounded rather than mitred.
function roundedPathD(pts: [number, number][], radius: number): string {
  let out = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const v1x = px - cx, v1y = py - cy, v2x = nx - cx, v2y = ny - cy;
    const l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
    if (!l1 || !l2) continue;
    // Collinear points add nothing; skip so straight runs stay one segment.
    if (Math.abs(v1x * v2y - v1y * v2x) / (l1 * l2) < 0.02) continue;
    const r = Math.min(radius, l1 / 2, l2 / 2);
    out += `L${cx + (v1x / l1) * r},${cy + (v1y / l1) * r}`;
    out += `Q${cx},${cy} ${cx + (v2x / l2) * r},${cy + (v2y / l2) * r}`;
  }
  return out + `L${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
}

type Box = { x: number; y: number; w: number; h: number };

// Flowchart node geometry keyed by graph name, read from the mounted SVG.
// getBBox needs layout, so this (and the rerouting below) runs against the
// live DOM, not the parsed string.
function nodeBoxes(root: SVGSVGElement): Map<string, Box> {
  const boxes = new Map<string, Box>();
  for (const g of root.querySelectorAll<SVGGElement>('g.node')) {
    const name = /-flowchart-(.+)-\d+$/.exec(g.id)?.[1];
    const t = /translate\(\s*(-?[\d.]+)[ ,]\s*(-?[\d.]+)/.exec(g.getAttribute('transform') ?? '');
    if (!name || !t) continue;
    try {
      const bb = g.getBBox();
      boxes.set(name, { x: bb.x + Number(t[1]), y: bb.y + Number(t[2]), w: bb.width, h: bb.height });
    } catch {
      // Not rendered; leave this node's edges on their original endpoints.
    }
  }
  return boxes;
}

// Dagre routes edges as loose diagonals. Re-route each one orthogonally:
// horizontal and vertical runs with rounded elbows, anchored on the border
// midpoints of the actual node boxes. Mermaid's own endpoints were clipped
// for the diagonal route, which puts them on box corners and cylinder rims;
// snapping to side centres is what makes the connections read as deliberate.
// The exit and entry axes come from the original first and last segments, so
// a side-exit stays a side-exit and a top-entry stays a top-entry. Endpoints
// far from their node (edges clipped at a cluster border) are kept, so a
// route never cuts back through the cluster's interior. Paths with non-line
// commands (cycles, self-loops) are left untouched.
function orthogonalizeEdges(root: SVGSVGElement, radius = 10) {
  const boxes = nodeBoxes(root);
  const nearBox = (p: [number, number], b: Box) =>
    p[0] >= b.x - 4 && p[0] <= b.x + b.w + 4 && p[1] >= b.y - 4 && p[1] <= b.y + b.h + 4;
  type Edge = {
    path: SVGPathElement;
    s: [number, number];
    e: [number, number];
    sd: 'h' | 'v';
    ed: 'h' | 'v';
    sdSign: number;
    edSign: number;
    dstBox?: Box;
  };
  const edges: Edge[] = [];
  for (const path of root.querySelectorAll<SVGPathElement>('.edgePaths path')) {
    const d = path.getAttribute('d') ?? '';
    // Absolute move/line commands only; anything else (curves, relative
    // commands) is not a plain polyline and is left as rendered.
    if (/[^ML0-9,.eE\s-]/.test(d)) continue;
    const nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/g)?.map(Number) ?? [];
    if (nums.length < 4 || nums.length % 2 !== 0) continue;
    const pts: [number, number][] = [];
    for (let i = 0; i < nums.length; i += 2) {
      const p: [number, number] = [nums[i], nums[i + 1]];
      const prev = pts[pts.length - 1];
      if (!prev || Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.5) pts.push(p);
    }
    if (pts.length < 2) continue;
    let s = pts[0];
    let e = pts[pts.length - 1];
    const axis = (a: [number, number], b: [number, number]) =>
      Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]) ? 'h' : 'v';
    const sgn = (n: number) => (n >= 0 ? 1 : -1);
    const sd = axis(pts[0], pts[1]);
    const ed = axis(pts[pts.length - 2], pts[pts.length - 1]);
    const sdSign = sd === 'h' ? sgn(pts[1][0] - pts[0][0] || e[0] - s[0]) : sgn(pts[1][1] - pts[0][1] || e[1] - s[1]);
    const edSign =
      ed === 'h'
        ? sgn(e[0] - pts[pts.length - 2][0] || e[0] - s[0])
        : sgn(e[1] - pts[pts.length - 2][1] || e[1] - s[1]);
    const ends = /-L_([^_]+)_([^_]+)_\d+$/.exec(path.id);
    const srcBox = ends ? boxes.get(ends[1]) : undefined;
    const dstBox = ends ? boxes.get(ends[2]) : undefined;
    if (srcBox && nearBox(s, srcBox)) {
      s =
        sd === 'h'
          ? [sdSign > 0 ? srcBox.x + srcBox.w : srcBox.x, srcBox.y + srcBox.h / 2]
          : [srcBox.x + srcBox.w / 2, sdSign > 0 ? srcBox.y + srcBox.h : srcBox.y];
    }
    if (dstBox && nearBox(e, dstBox)) {
      // Arriving rightward/downward means entering the left/top border.
      e =
        ed === 'h'
          ? [edSign > 0 ? dstBox.x : dstBox.x + dstBox.w, dstBox.y + dstBox.h / 2]
          : [dstBox.x + dstBox.w / 2, edSign > 0 ? dstBox.y : dstBox.y + dstBox.h];
    }
    edges.push({ path, s, e, sd, ed, sdSign, edSign, dstBox });
  }
  // Arrowheads: the marker tip extends 4px past the path end (viewBox 10 wide
  // at scale 0.8, ref point at its middle), which buries it inside the target
  // when the path ends on the border. Endpoints get pulled back by this much
  // so the tip rests just outside.
  const inset = 5;
  // Two arrows landing on the same border point melt into one and the second
  // edge looks unconnected. When a side-centre anchor is contested, an edge
  // that starts well above the target moves to the top border and one that
  // starts well below moves to the bottom, the way converging edges are drawn
  // by hand. Judged from the edge's own exit point, not its node: cluster-
  // clipped edges start at the cluster border. Near-level edges keep the
  // shared side anchor: that overlap reads as a deliberate merge junction,
  // and the vertical run a move would create is shorter than the arrow inset,
  // which degenerates into a floating arrowhead.
  const clearance = inset + 2;
  const byAnchor = new Map<string, Edge[]>();
  for (const edge of edges) {
    const key = `${edge.e[0].toFixed(0)},${edge.e[1].toFixed(0)}`;
    byAnchor.set(key, [...(byAnchor.get(key) ?? []), edge]);
  }
  for (const group of byAnchor.values()) {
    if (group.length < 2) continue;
    for (const edge of group) {
      const db = edge.dstBox;
      if (edge.ed !== 'h' || !db) continue;
      const dcx = db.x + db.w / 2;
      // Needs horizontal room to turn; otherwise leave it on the side.
      if (Math.abs(edge.s[0] - dcx) < radius) continue;
      if (edge.s[1] < db.y - clearance) {
        edge.ed = 'v';
        edge.edSign = 1;
        edge.e = [dcx, db.y];
      } else if (edge.s[1] > db.y + db.h + clearance) {
        edge.ed = 'v';
        edge.edSign = -1;
        edge.e = [dcx, db.y + db.h];
      }
    }
  }
  for (const edge of edges) {
    if (edge.path.getAttribute('marker-end')) {
      if (edge.ed === 'h') edge.e = [edge.e[0] - edge.edSign * inset, edge.e[1]];
      else edge.e = [edge.e[0], edge.e[1] - edge.edSign * inset];
    }
    if (edge.path.getAttribute('marker-start')) {
      if (edge.sd === 'h') edge.s = [edge.s[0] + edge.sdSign * inset, edge.s[1]];
      else edge.s = [edge.s[0], edge.s[1] + edge.sdSign * inset];
    }
  }
  for (const { path, s, e, sd, ed } of edges) {
    let route: [number, number][];
    if (sd === 'h' && ed === 'h') {
      const mx = (s[0] + e[0]) / 2;
      route = Math.abs(s[1] - e[1]) < 2 ? [s, e] : [s, [mx, s[1]], [mx, e[1]], e];
    } else if (sd === 'v' && ed === 'v') {
      const my = (s[1] + e[1]) / 2;
      route = Math.abs(s[0] - e[0]) < 2 ? [s, e] : [s, [s[0], my], [e[0], my], e];
    } else if (sd === 'h') {
      route = [s, [e[0], s[1]], e];
    } else {
      route = [s, [s[0], e[1]], e];
    }
    path.setAttribute('d', roundedPathD(route, radius));
  }
}

// Nodes labelled exactly "Axiom" are the product in an architecture diagram;
// pick them out in the brand accent. Sequence-diagram actors have no :::class
// syntax, so they're tagged by name instead: an actor named after either
// product gets that product's colour.
function tagBrandNodes(root: SVGElement) {
  for (const label of root.querySelectorAll('.nodeLabel')) {
    if (label.textContent?.trim() === 'Axiom') label.closest('.node')?.setAttribute('data-axiom-brand', '');
  }
  for (const actor of root.querySelectorAll('text.actor')) {
    const name = actor.textContent?.trim().toLowerCase() ?? '';
    const brand = name.includes('axiom') ? 'axiom' : name.includes('splunk') ? 'splunk' : null;
    if (brand) actor.closest('g')?.setAttribute('data-brand', brand);
  }
}

function postProcessSvg(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, 'text/html');
  const root = doc.body.querySelector('svg');
  if (!root) return svg;
  tagBrandNodes(root);
  return root.outerHTML;
}

export function Mermaid({ chart }: { chart: string }) {
  const rawId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedKey = useRef<string | null>(null);
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);
  const { resolvedTheme } = useTheme();

  // Re-route edges once the SVG is in the DOM: anchoring needs getBBox, which
  // only works on rendered elements. Layout effect so the original diagonals
  // never paint. Rewritten paths contain curve commands, which the rewriter
  // skips, so re-runs (strict mode) are no-ops.
  useLayoutEffect(() => {
    const el = containerRef.current?.querySelector('svg');
    if (svg && el) orthogonalizeEdges(el);
  }, [svg]);

  useEffect(() => {
    const key = `${resolvedTheme} ${chart}`;
    if (renderedKey.current === key) return;
    renderedKey.current = key;
    let cancelled = false;

    void (async () => {
      const { default: mermaid } = await import('mermaid');
      // useId's delimiters aren't valid in the CSS selectors mermaid builds.
      const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`;
      try {
        const dark = resolvedTheme !== 'light';
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          darkMode: dark,
          themeVariables: axiomThemeVariables(dark),
          themeCSS: themeCss(dark),
          flowchart: {
            // Plain polylines that orthogonalizeEdges can parse and re-route.
            curve: 'linear',
            // Total label-to-border padding, split across both sides; extra
            // horizontal room comes from the .nodeLabel side padding in
            // themeCss.
            padding: 14,
            nodeSpacing: 40,
            // Wide rank gap gives the orthogonal runs room to read as
            // deliberate routing rather than cramped jogs.
            rankSpacing: 64,
            // Clear the uppercase title off the first node row.
            subGraphTitleMargin: { top: 8, bottom: 16 },
          },
          // Actor boxes are sized from mermaid's own font metrics, which run
          // narrower than the mono stack; widen so names don't overflow.
          sequence: { width: 180 },
        });
        const rendered = await mermaid.render(id, chart.replaceAll('\\n', '\n'));
        if (cancelled) return;
        setFailed(false);
        setSvg(postProcessSvg(rendered.svg));
        if (containerRef.current) rendered.bindFunctions?.(containerRef.current);
      } catch (error) {
        // Leave the source readable rather than an empty frame when the chart
        // has a syntax error.
        console.error('[docs] mermaid render failed', error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, rawId, resolvedTheme]);

  if (failed) {
    return <pre className="doc-mermaid-source my-6 p-4 overflow-x-auto border border-(--border-primary) rounded-[4px] bg-(--bg-surface) text-(--text-tertiary)">{chart}</pre>;
  }

  return (
    <div
      ref={containerRef}
      className="doc-mermaid my-7 overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
      role="img"
      aria-label="Diagram"
      data-rendered={svg ? '' : undefined}
    >
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <span className="flex min-h-24 items-center justify-center text-(--text-quaternary) font-mono text-[11px] leading-4 font-[450]">Rendering diagram…</span>
      )}
    </div>
  );
}
