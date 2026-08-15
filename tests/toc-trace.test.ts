import { describe, expect, it } from 'vitest';
import {
  buildTocTrace,
  getTocTraceX,
  pointAtTocTraceDistance,
  TOC_TRACE_BASE_X,
  TOC_TRACE_DEPTH_STEP,
  type TocTraceRow,
} from '@/lib/toc-trace';

const row = (depth: number, top: number, height = 27): TocTraceRow => ({
  depth,
  top,
  height,
});

describe('table of contents trace geometry', () => {
  it('returns an empty trace when there are no headings', () => {
    const trace = buildTocTrace([]);

    expect(trace.path).toBe('');
    expect(trace.segments).toEqual([]);
    expect(trace.itemDistances).toEqual([]);
    expect(trace.totalLength).toBe(0);
  });

  it('keeps headings at one depth on a straight vertical rail', () => {
    const trace = buildTocTrace([
      row(2, 2),
      row(2, 29),
      row(2, 56),
    ]);

    expect(trace.itemPoints.map((point) => point.x)).toEqual([
      TOC_TRACE_BASE_X,
      TOC_TRACE_BASE_X,
      TOC_TRACE_BASE_X,
    ]);
    expect(trace.segments.every(({ start, end }) => start.x === end.x)).toBe(true);
  });

  it('uses crisp 45-degree lane changes for each nested heading level', () => {
    const trace = buildTocTrace([
      row(2, 2, 24),
      row(3, 30, 30),
      row(4, 68, 22),
      row(2, 98, 34),
    ]);

    expect(trace.itemPoints.map((point) => point.x)).toEqual([
      TOC_TRACE_BASE_X,
      TOC_TRACE_BASE_X + TOC_TRACE_DEPTH_STEP,
      TOC_TRACE_BASE_X + TOC_TRACE_DEPTH_STEP * 2,
      TOC_TRACE_BASE_X,
    ]);
    expect(
      trace.segments.some(({ start, end }) => start.x !== end.x && start.y !== end.y),
    ).toBe(true);
    expect(trace.path).not.toContain(' C ');
    trace.segments
      .filter(({ start, end }) => start.x !== end.x)
      .forEach(({ start, end }) => {
        expect(Math.abs(end.x - start.x)).toBe(
          Math.abs(end.y - start.y),
        );
      });

    trace.itemDistances.forEach((distance, index) => {
      expect(pointAtTocTraceDistance(trace, distance)).toEqual(
        trace.itemPoints[index],
      );
    });
  });

  it('clamps malformed heading depths to the supported h2-h4 rail', () => {
    expect(getTocTraceX(1)).toBe(TOC_TRACE_BASE_X);
    expect(getTocTraceX(Number.NaN)).toBe(TOC_TRACE_BASE_X);
    expect(getTocTraceX(5)).toBe(
      TOC_TRACE_BASE_X + TOC_TRACE_DEPTH_STEP * 2,
    );
  });

  it('clamps cursor lookup to the trace caps', () => {
    const trace = buildTocTrace([row(2, 2)]);

    expect(pointAtTocTraceDistance(trace, -100)).toEqual(trace.start);
    expect(pointAtTocTraceDistance(trace, trace.totalLength + 100)).toEqual(
      trace.end,
    );
  });
});
