"use client";

import {
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";

export type SidebarConnectorPoint = {
  center: number;
  bottom: number;
};

export function useSidebarConnectorPoints(
  listRef: RefObject<HTMLDivElement | null>,
  childCount: number,
) {
  const [points, setPoints] = useState<SidebarConnectorPoint[]>([]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const listTop = list.getBoundingClientRect().top;
      const nextPoints = Array.from(
        list.querySelectorAll<HTMLElement>(
          ":scope > [data-sidebar-child]",
        ),
      ).flatMap((child) => {
        const row = child.querySelector<HTMLElement>(
          ":scope > [data-sidebar-row], :scope > details > [data-sidebar-row]",
        );
        if (!row) return [];
        const rect = row.getBoundingClientRect();
        return [
          {
            center: rect.top - listTop + rect.height / 2,
            bottom: rect.bottom - listTop,
          },
        ];
      });

      setPoints((currentPoints) => {
        const unchanged =
          currentPoints.length === nextPoints.length &&
          currentPoints.every(
            (point, index) =>
              point.center === nextPoints[index]?.center &&
              point.bottom === nextPoints[index]?.bottom,
          );
        return unchanged ? currentPoints : nextPoints;
      });
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    list
      .querySelectorAll<HTMLElement>(
        ":scope > [data-sidebar-child]",
      )
      .forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [childCount, listRef]);

  return points;
}

export function SidebarNestedConnector({
  points,
  activeIndex,
  activeContinues,
  branchDepth,
}: {
  points: SidebarConnectorPoint[];
  activeIndex: number;
  activeContinues: boolean;
  branchDepth: number;
}) {
  const activePoint = points[activeIndex];
  if (!activePoint) return null;

  const branchEnd = 26.5 + branchDepth * 20;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-20 overflow-visible"
      data-slot="sidebar-nested-connector"
      width={27 + branchDepth * 20}
      height="100%"
      fill="none"
    >
      {activeContinues ? (
        <path
          data-slot="sidebar-active-continuation"
          d={`M15.5 0V${activePoint.bottom}`}
          className="stroke-sidebar-connector"
        />
      ) : (
        <path
          data-slot="sidebar-active-connector"
          d={`M15.5 0V${activePoint.center - 5}L20.5 ${activePoint.center}H${branchEnd}`}
          className="stroke-sidebar-connector"
        />
      )}
    </svg>
  );
}

/**
 * Dashed hover twin of the active connector, rendered once per child row and
 * revealed purely by CSS (the `[data-sidebar-child]` `:has()` rules in
 * globals.css) — no JS hover tracking. The svg is absolutely positioned
 * against the list (its nearest positioned ancestor), so the paths share the
 * active connector's coordinate space.
 */
export function SidebarHoverConnector({
  point,
  branchDepth,
  elbow,
  continuation,
}: {
  point: SidebarConnectorPoint;
  branchDepth: number;
  /** Omitted for the active row — its elbow is already drawn solid. */
  elbow: boolean;
  /** Only rows with children can host a hover deeper than the row itself. */
  continuation: boolean;
}) {
  if (!elbow && !continuation) return null;

  const branchEnd = 26.5 + branchDepth * 20;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-20 overflow-visible"
      data-slot="sidebar-hover-connector-root"
      width={27 + branchDepth * 20}
      height="100%"
      fill="none"
    >
      {elbow && (
        <path
          data-slot="sidebar-hover-connector"
          d={`M15.5 0V${point.center - 5}L20.5 ${point.center}H${branchEnd}`}
          className="stroke-sidebar-connector"
          strokeDasharray="4 4"
        />
      )}
      {continuation && (
        <path
          data-slot="sidebar-hover-continuation"
          d={`M15.5 0V${point.bottom}`}
          className="stroke-sidebar-connector"
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
}
