'use client';

import { useEffect, useId, useRef, useState } from 'react';
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
    // Edges and labels.
    lineColor: token('--text-quaternary'),
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
// variables resolve and flip with data-theme like everything else.
const THEME_CSS = `
  .node rect, .cluster rect { rx: 4px; ry: 4px; }
  .nodeLabel { font-weight: 450; letter-spacing: -.01em; padding: 2px 4px; line-height: 1.35; }
  .cluster-label span, .cluster-label .nodeLabel, .cluster-label text {
    text-transform: uppercase; font-size: 10px; font-weight: 600; letter-spacing: .09em;
  }
  .edgePaths path { stroke-width: 1.25px; }
  .marker { stroke-width: 1px; }
  .node[data-axiom-brand] rect, .node[data-axiom-brand] path {
    stroke: color-mix(in srgb, var(--color-accent) 62%, transparent);
    fill: color-mix(in srgb, var(--color-accent) 8%, transparent);
  }
  /* Mermaid inlines colours on the nested label elements, so descendants and
     !important are both needed for the brand label to win. */
  .node[data-axiom-brand] .nodeLabel, .node[data-axiom-brand] .nodeLabel * {
    color: var(--color-accent-text) !important; font-weight: 600;
  }
`;

// Nodes labelled exactly "Axiom" are the product in an architecture diagram;
// pick them out in the brand accent.
function tagAxiomNodes(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, 'text/html');
  const root = doc.body.querySelector('svg');
  if (!root) return svg;
  for (const label of root.querySelectorAll('.nodeLabel')) {
    if (label.textContent?.trim() === 'Axiom') label.closest('.node')?.setAttribute('data-axiom-brand', '');
  }
  return root.outerHTML;
}

export function Mermaid({ chart }: { chart: string }) {
  const rawId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedKey = useRef<string | null>(null);
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);
  const { resolvedTheme } = useTheme();

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
          themeCSS: THEME_CSS,
          flowchart: {
            curve: 'basis',
            padding: 10,
            nodeSpacing: 36,
            rankSpacing: 42,
            // Clear the uppercase title off the first node row.
            subGraphTitleMargin: { top: 8, bottom: 16 },
          },
        });
        const rendered = await mermaid.render(id, chart.replaceAll('\\n', '\n'));
        if (cancelled) return;
        setFailed(false);
        setSvg(tagAxiomNodes(rendered.svg));
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
