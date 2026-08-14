import {
  ArrowRightLeft,
  Binary,
  BookMarked,
  BookOpenText,
  ChartSpline,
  CodeXml,
  ListChecks,
  SquareFunction,
  SquareTerminal,
} from "lucide-react";
import type { SVGProps } from "react";

const strokeWidth = 1.5;

export function QueryOverviewIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <BookOpenText {...props} strokeWidth={strokeWidth} />;
}

export function QueryIntroductionIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <CodeXml {...props} strokeWidth={strokeWidth} />;
}

export function SampleQueriesIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <SquareTerminal {...props} strokeWidth={strokeWidth} />;
}

export function QueryFeaturesIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <ListChecks {...props} strokeWidth={strokeWidth} />;
}

export function QueryFunctionsIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <SquareFunction {...props} strokeWidth={strokeWidth} />;
}

export function QueryOperatorsIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <Binary {...props} strokeWidth={strokeWidth} />;
}

export function QueryReferenceIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <BookMarked {...props} strokeWidth={strokeWidth} />;
}

export function QueryMigrateIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <ArrowRightLeft {...props} strokeWidth={strokeWidth} />;
}

export function MplFeaturesIcon(
  props: SVGProps<SVGSVGElement>,
) {
  return <ChartSpline {...props} strokeWidth={strokeWidth} />;
}
