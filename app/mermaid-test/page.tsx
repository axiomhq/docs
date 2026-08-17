import type { Metadata } from 'next';
import { Mermaid } from '@/components/mermaid';
import { stressCharts } from './charts';
import { OverflowAudit } from './overflow-audit';

// TEMPORARY battle-test gallery for the Mermaid design — not linked from any
// navigation and excluded from indexing. Renders one of every diagram type
// with sizing-hostile content, plus a live audit that flags labels escaping
// their shapes (the failure mode behind the sequence-actor overflow bug).
// Delete this folder once the design settles.

export const metadata: Metadata = {
  title: 'Mermaid stress test',
  robots: { index: false, follow: false },
};

export default function MermaidTestPage() {
  return (
    <div className="mx-auto w-[min(920px,100%)] px-6 pt-10 pb-20 max-sm:px-4">
      <h1 className="m-0! mb-2! font-sans! text-[28px]! leading-9! font-medium! tracking-[-.02em]! text-(--text-primary)!">
        Mermaid stress test
      </h1>
      <p className="m-0 mb-6 font-sans text-[14px] leading-[22px] text-(--text-tertiary)">
        Temporary gallery of sizing-hostile diagrams for battle-testing the
        docs Mermaid design. The audit below re-checks every rendered label
        against its shape.
      </p>
      <OverflowAudit expected={stressCharts.length} />
      {stressCharts.map(({ title, probes, chart }) => (
        <section className="mb-12" key={title}>
          <h2 className="m-0! mb-1! font-sans! text-[18px]! leading-6! font-medium! tracking-[-.01em]! text-(--text-primary)!">
            {title}
          </h2>
          <p className="m-0 font-sans text-[13px] leading-5 text-(--text-quaternary)">
            {probes}
          </p>
          <Mermaid chart={chart} />
        </section>
      ))}
    </div>
  );
}
