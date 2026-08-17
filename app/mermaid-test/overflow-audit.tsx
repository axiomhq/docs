'use client';

import { useEffect, useState } from 'react';

type Audit = {
  rendered: number;
  expected: number;
  failed: number;
  overflows: string[];
};

// Scans every rendered diagram for labels escaping their shapes — the class
// of bug this route exists to catch. Same checks as the e2e guard in
// docs.spec.ts, but live, so a broken chart is flagged while you look at it.
function runAudit(expected: number): Audit {
  const overflows: string[] = [];
  const svgs = document.querySelectorAll<SVGSVGElement>('.doc-mermaid svg');

  for (const svg of svgs) {
    // Flowchart/state/class nodes: HTML label vs the node group's box.
    for (const node of svg.querySelectorAll<SVGGElement>('g.node')) {
      const label = node.querySelector<HTMLElement>('.nodeLabel');
      if (!label) continue;
      const nb = node.getBoundingClientRect();
      const lb = label.getBoundingClientRect();
      if (lb.left < nb.left - 1 || lb.right > nb.right + 1) {
        overflows.push(`node: ${label.textContent?.trim().slice(0, 40)}`);
      }
    }
    // Sequence actors: text vs its own rect.
    for (const text of svg.querySelectorAll<SVGTextElement>('text.actor')) {
      const rect = text.closest('g')?.querySelector('rect.actor');
      if (!rect) continue;
      const rb = rect.getBoundingClientRect();
      const tb = text.getBoundingClientRect();
      if (tb.left < rb.left - 1 || tb.right > rb.right + 1) {
        overflows.push(`actor: ${text.textContent?.trim().slice(0, 40)}`);
      }
    }
  }

  return {
    rendered: svgs.length,
    expected,
    failed: document.querySelectorAll('.doc-mermaid-source').length,
    overflows,
  };
}

export function OverflowAudit({ expected }: { expected: number }) {
  const [audit, setAudit] = useState<Audit | null>(null);

  // Diagrams render asynchronously (dynamic import + fonts.ready), so poll
  // until every chart has either rendered or fallen back to source, then a
  // little longer to catch late layout shifts.
  useEffect(() => {
    let ticks = 0;
    const interval = window.setInterval(() => {
      const next = runAudit(expected);
      setAudit(next);
      ticks += 1;
      const settled = next.rendered + next.failed >= expected;
      if ((settled && ticks >= 3) || ticks > 40) window.clearInterval(interval);
    }, 500);
    return () => window.clearInterval(interval);
  }, [expected]);

  const ok = audit && audit.failed === 0 && audit.overflows.length === 0 && audit.rendered === expected;

  return (
    <div
      data-slot="mermaid-audit"
      data-status={audit ? (ok ? 'pass' : 'fail') : 'pending'}
      className={
        'mb-8 rounded-md border px-4 py-3 font-mono text-[12px] leading-5 ' +
        (audit
          ? ok
            ? 'border-[color-mix(in_srgb,var(--green-9)_50%,transparent)] bg-[color-mix(in_srgb,var(--green-9)_8%,transparent)] text-(--green-11)'
            : 'border-[color-mix(in_srgb,var(--color-destructive)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-destructive)_7%,transparent)] text-(--text-primary)'
          : 'border-(--border-primary) bg-(--bg-surface) text-(--text-tertiary)')
      }
    >
      {!audit && 'Auditing rendered diagrams…'}
      {audit && ok && `All ${audit.rendered} diagrams rendered, every label inside its shape.`}
      {audit && !ok && (
        <>
          <strong className="font-semibold">
            {audit.rendered}/{audit.expected} rendered, {audit.failed} failed,{' '}
            {audit.overflows.length} label overflow{audit.overflows.length === 1 ? '' : 's'}
          </strong>
          {audit.overflows.length > 0 && (
            <ul className="m-0 mt-1 list-disc ps-5">
              {audit.overflows.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
