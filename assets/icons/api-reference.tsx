import {
  Activity,
  BookOpenText,
  ChartSpline,
  Gauge,
  ListOrdered,
  SearchCode,
  Send,
  Tags,
} from "lucide-react";
import type { SVGProps } from "react";

const strokeWidth = 1.5;

export function ApiIntroductionIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <BookOpenText {...props} strokeWidth={strokeWidth} />;
}

export function ApiSendDataIcon(props: SVGProps<SVGSVGElement>) {
  return <Send {...props} strokeWidth={strokeWidth} />;
}

export function ApiQueryDataIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <SearchCode {...props} strokeWidth={strokeWidth} />;
}

export function ApiPaginationIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <ListOrdered {...props} strokeWidth={strokeWidth} />;
}

export function ApiLimitsIcon(props: SVGProps<SVGSVGElement>) {
  return <Gauge {...props} strokeWidth={strokeWidth} />;
}

export function ApiHealthIcon(props: SVGProps<SVGSVGElement>) {
  return <Activity {...props} strokeWidth={strokeWidth} />;
}

export function ApiMetricsIcon(props: SVGProps<SVGSVGElement>) {
  return <ChartSpline {...props} strokeWidth={strokeWidth} />;
}

export function ApiTagsIcon(props: SVGProps<SVGSVGElement>) {
  return <Tags {...props} strokeWidth={strokeWidth} />;
}
