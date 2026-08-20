export const TOC_TRACE_BASE_X = 2.5;
export const TOC_TRACE_DEPTH_STEP = 7;
export const TOC_TRACE_CAP = 5;

const MIN_TOC_DEPTH = 2;
const MAX_TOC_DEPTH = 4;

export type TocTraceRow = {
  depth: number;
  top: number;
  height: number;
};

export type TocTracePoint = {
  x: number;
  y: number;
};

export type TocTraceSegment = {
  start: TocTracePoint;
  end: TocTracePoint;
  startDistance: number;
  endDistance: number;
};

export type TocTraceGeometry = {
  path: string;
  points: TocTracePoint[];
  segments: TocTraceSegment[];
  itemDistances: number[];
  itemPoints: TocTracePoint[];
  totalLength: number;
  start: TocTracePoint;
  end: TocTracePoint;
};

const EMPTY_POINT = { x: TOC_TRACE_BASE_X, y: 0 };

const emptyGeometry = (): TocTraceGeometry => ({
  path: '',
  points: [],
  segments: [],
  itemDistances: [],
  itemPoints: [],
  totalLength: 0,
  start: EMPTY_POINT,
  end: EMPTY_POINT,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatCoordinate = (value: number) =>
  Number(value.toFixed(2)).toString();

const distanceBetween = (start: TocTracePoint, end: TocTracePoint) =>
  Math.hypot(end.x - start.x, end.y - start.y);

export function getTocTraceX(depth: number) {
  const safeDepth = Number.isFinite(depth) ? Math.round(depth) : MIN_TOC_DEPTH;
  return TOC_TRACE_BASE_X
    + (clamp(safeDepth, MIN_TOC_DEPTH, MAX_TOC_DEPTH) - MIN_TOC_DEPTH)
      * TOC_TRACE_DEPTH_STEP;
}

/**
 * Build one path shared by the neutral rail and cursor. Each hierarchy change
 * uses the same crisp 45-degree turn as the nested sidebar connectors.
 */
export function buildTocTrace(rows: TocTraceRow[]): TocTraceGeometry {
  if (rows.length === 0) return emptyGeometry();

  const itemPoints = rows.map((row) => ({
    x: getTocTraceX(row.depth),
    y: row.top + row.height / 2,
  }));
  const first = itemPoints[0];
  const last = itemPoints.at(-1)!;
  const start = { x: first.x, y: Math.max(0, first.y - TOC_TRACE_CAP) };
  const end = { x: last.x, y: last.y + TOC_TRACE_CAP };
  const points: TocTracePoint[] = [start];
  const segments: TocTraceSegment[] = [];
  const itemDistances: number[] = [];
  const pathCommands = [
    `M ${formatCoordinate(start.x)} ${formatCoordinate(start.y)}`,
  ];
  let totalLength = 0;
  let current = start;

  const appendPoint = (point: TocTracePoint) => {
    pathCommands.push(
      `L ${formatCoordinate(point.x)} ${formatCoordinate(point.y)}`,
    );
    points.push(point);

    const length = distanceBetween(current, point);
    if (length > 0) {
      segments.push({
        start: current,
        end: point,
        startDistance: totalLength,
        endDistance: totalLength + length,
      });
      totalLength += length;
    }
    current = point;
  };

  appendPoint(first);
  itemDistances.push(totalLength);

  for (let index = 1; index < itemPoints.length; index += 1) {
    const previous = itemPoints[index - 1];
    const next = itemPoints[index];

    if (previous.x !== next.x) {
      const midpoint = previous.y + (next.y - previous.y) / 2;
      const laneShift = Math.abs(next.x - previous.x);
      const halfBend = Math.min(
        laneShift / 2,
        Math.max(0, Math.abs(next.y - previous.y) / 2),
      );
      const direction = next.y >= previous.y ? 1 : -1;

      appendPoint({ x: previous.x, y: midpoint - halfBend * direction });
      appendPoint({ x: next.x, y: midpoint + halfBend * direction });
    }

    appendPoint(next);
    itemDistances.push(totalLength);
  }

  appendPoint(end);

  return {
    path: pathCommands.join(' '),
    points,
    segments,
    itemDistances,
    itemPoints,
    totalLength,
    start,
    end,
  };
}

export function pointAtTocTraceDistance(
  geometry: TocTraceGeometry,
  distance: number,
): TocTracePoint {
  if (geometry.segments.length === 0) return geometry.start;

  const safeDistance = clamp(distance, 0, geometry.totalLength);
  const segment = geometry.segments.find(
    (candidate) => safeDistance <= candidate.endDistance,
  ) ?? geometry.segments.at(-1)!;
  const segmentLength = segment.endDistance - segment.startDistance;
  const progress = segmentLength === 0
    ? 0
    : (safeDistance - segment.startDistance) / segmentLength;

  return {
    x: segment.start.x + (segment.end.x - segment.start.x) * progress,
    y: segment.start.y + (segment.end.y - segment.start.y) * progress,
  };
}
