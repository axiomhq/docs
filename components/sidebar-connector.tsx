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
  hoverContinues,
  hoveredIndex,
}: {
  points: SidebarConnectorPoint[];
  activeIndex: number;
  activeContinues: boolean;
  branchDepth: number;
  hoverContinues: boolean;
  hoveredIndex: number | null;
}) {
  const activePoint = points[activeIndex];
  const hoverPoint =
    hoveredIndex === null ||
    (hoveredIndex === activeIndex && !hoverContinues)
      ? undefined
      : points[hoveredIndex];

  if (!activePoint && !hoverPoint) return null;

  const branchEnd = 26.5 + branchDepth * 20;
  const connectorWidth = 27 + branchDepth * 20;
  const hoverPath = hoverPoint && !hoverContinues
    ? `M15.5 0V${hoverPoint.center - 5}L20.5 ${hoverPoint.center}H${branchEnd}`
    : undefined;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-20 overflow-visible"
      data-slot="sidebar-nested-connector"
      width={connectorWidth}
      height="100%"
      fill="none"
    >
      {hoverPath && (
        <path
          data-slot="sidebar-hover-connector"
          d={hoverPath}
          className="stroke-sidebar-connector"
          strokeDasharray="4 4"
        />
      )}
      {hoverPoint && hoverContinues && (
        <path
          data-slot="sidebar-hover-continuation"
          d={`M15.5 0V${hoverPoint.bottom}`}
          className="stroke-sidebar-connector"
          strokeDasharray="4 4"
        />
      )}
      {activePoint &&
        (activeContinues ? (
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
        ))}
    </svg>
  );
}
