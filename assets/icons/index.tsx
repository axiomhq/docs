import type { ComponentType, SVGProps } from "react";
import { AplSearchIcon } from "./apl-search";
import { ArrowUpRightIcon } from "./arrow-up-right";
import { AiAgentsIcon } from "./ai-agents";
import {
  ApiHealthIcon,
  ApiIntroductionIcon,
  ApiLimitsIcon,
  ApiMetricsIcon,
  ApiPaginationIcon,
  ApiQueryDataIcon,
  ApiSendDataIcon,
  ApiTagsIcon,
} from "./api-reference";
import { ArchitectureIcon } from "./architecture";
import { CheckIcon } from "./check-icon";
import { ChevronIcon } from "./chevron";
import { CopyIcon } from "./copy-icon";
import { ConsoleIcon } from "./console";
import { FaqsIcon } from "./faqs";
import { FeaturesIcon } from "./features";
import { FundamentalsIcon } from "./fundamentals";
import { LegalIcon } from "./legal";
import { LlmObservabilityIcon } from "./llm-observability";
import { LlmsIcon } from "./llms";
import { MethodsIcon } from "./methods";
import { ObservabilityIcon } from "./observability";
import { ProductAnalyticsIcon } from "./product-analytics";
import { QuickStartIcon } from "./quick-start";
import {
  MplFeaturesIcon,
  QueryFeaturesIcon,
  QueryFunctionsIcon,
  QueryIntroductionIcon,
  QueryMigrateIcon,
  QueryOperatorsIcon,
  QueryOverviewIcon,
  QueryReferenceIcon,
  SampleQueriesIcon,
} from "./query-reference";
import { ReferenceArchitecturesIcon } from "./reference-architectures";
import { RoadmapIcon } from "./roadmap";
import { SecurityIcon } from "./security";
import { SparkleIcon } from "./sparkle";
import { SplunkIcon } from "./splunk";
import { WhatIsAxiomIcon } from "./what-is-axiom";

export {
  AplSearchIcon,
  ArrowUpRightIcon,
  AiAgentsIcon,
  ApiHealthIcon,
  ApiIntroductionIcon,
  ApiLimitsIcon,
  ApiMetricsIcon,
  ApiPaginationIcon,
  ApiQueryDataIcon,
  ApiSendDataIcon,
  ApiTagsIcon,
  ArchitectureIcon,
  CheckIcon,
  ChevronIcon,
  CopyIcon,
  ConsoleIcon,
  FaqsIcon,
  FeaturesIcon,
  FundamentalsIcon,
  LegalIcon,
  LlmObservabilityIcon,
  LlmsIcon,
  MethodsIcon,
  ObservabilityIcon,
  ProductAnalyticsIcon,
  QuickStartIcon,
  MplFeaturesIcon,
  QueryFeaturesIcon,
  QueryFunctionsIcon,
  QueryIntroductionIcon,
  QueryMigrateIcon,
  QueryOperatorsIcon,
  QueryOverviewIcon,
  QueryReferenceIcon,
  SampleQueriesIcon,
  ReferenceArchitecturesIcon,
  RoadmapIcon,
  SecurityIcon,
  SparkleIcon,
  SplunkIcon,
  WhatIsAxiomIcon,
};

export type SidebarIconComponent = ComponentType<
  SVGProps<SVGSVGElement>
>;

const SIDEBAR_ICON_SIZE = 14;

export type SidebarIconAsset = {
  icon: SidebarIconComponent;
  size: typeof SIDEBAR_ICON_SIZE;
};

const sidebarIcon = (
  icon: SidebarIconComponent,
): SidebarIconAsset => ({ icon, size: SIDEBAR_ICON_SIZE });

export const documentationSidebarPageIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  "/docs/introduction": sidebarIcon(WhatIsAxiomIcon),
  "/docs/getting-started": sidebarIcon(QuickStartIcon),
  "/docs/platform-overview/architecture":
    sidebarIcon(ArchitectureIcon),
  "/docs/platform-overview/features": sidebarIcon(FeaturesIcon),
  "/docs/platform-overview/security": sidebarIcon(SecurityIcon),
  "/docs/platform-overview/roadmap": sidebarIcon(RoadmapIcon),
  "/docs/send-data/reference-architectures": sidebarIcon(
    ReferenceArchitecturesIcon,
  ),
  "/docs/send-data/methods": sidebarIcon(MethodsIcon),
  "/docs/getting-started-guide/observability":
    sidebarIcon(ObservabilityIcon),
  "/docs/getting-started-guide/product-analytics": sidebarIcon(
    ProductAnalyticsIcon,
  ),
  "/docs/get-help/faq": sidebarIcon(FaqsIcon),
};

export const documentationSidebarGroupIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  Fundamentals: sidebarIcon(FundamentalsIcon),
  Console: sidebarIcon(ConsoleIcon),
  "AI agents": sidebarIcon(AiAgentsIcon),
  Splunk: sidebarIcon(SplunkIcon),
  "LLM observability": sidebarIcon(LlmObservabilityIcon),
  LLMs: sidebarIcon(LlmsIcon),
  Legal: sidebarIcon(LegalIcon),
};

export const querySidebarPageIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  "/docs/apl/overview": sidebarIcon(QueryOverviewIcon),
  "/docs/apl/introduction": sidebarIcon(QueryIntroductionIcon),
  "/docs/apl/tutorial": sidebarIcon(SampleQueriesIcon),
  "/docs/apl/apl-features": sidebarIcon(QueryFeaturesIcon),
  "/docs/mpl/introduction": sidebarIcon(MplFeaturesIcon),
  "/docs/mpl/sample-queries": sidebarIcon(SampleQueriesIcon),
  "/docs/mpl/migrate-metrics": sidebarIcon(QueryMigrateIcon),
};

export const querySidebarGroupIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  Functions: sidebarIcon(QueryFunctionsIcon),
  Operators: sidebarIcon(QueryOperatorsIcon),
  Reference: sidebarIcon(QueryReferenceIcon),
  Migrate: sidebarIcon(QueryMigrateIcon),
};

export const apiSidebarPageIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  "/docs/restapi/introduction": sidebarIcon(ApiIntroductionIcon),
  "/docs/restapi/ingest": sidebarIcon(ApiSendDataIcon),
  "/docs/restapi/query": sidebarIcon(ApiQueryDataIcon),
  "/docs/restapi/pagination": sidebarIcon(ApiPaginationIcon),
  "/docs/restapi/api-limits": sidebarIcon(ApiLimitsIcon),
  "/docs/restapi/endpoints/ingestToDataset":
    sidebarIcon(ApiSendDataIcon),
  "/docs/restapi/endpoints/ingestHecEvent":
    sidebarIcon(ApiSendDataIcon),
  "/docs/restapi/endpoints/ingestHecRaw":
    sidebarIcon(ApiSendDataIcon),
  "/docs/restapi/endpoints/getHecHealth": sidebarIcon(ApiHealthIcon),
  "/docs/restapi/endpoints/queryEdge": sidebarIcon(ApiQueryDataIcon),
  "/docs/restapi/endpoints/queryBatch": sidebarIcon(ApiQueryDataIcon),
  "/docs/restapi/endpoints/queryMetrics":
    sidebarIcon(ApiQueryDataIcon),
  "/docs/restapi/endpoints/getDatasetMetrics":
    sidebarIcon(ApiMetricsIcon),
  "/docs/restapi/endpoints/getDatasetMetricTags":
    sidebarIcon(ApiTagsIcon),
  "/docs/restapi/endpoints/getDatasetMetricTagValues":
    sidebarIcon(ApiTagsIcon),
  "/docs/restapi/endpoints/getDatasetTags": sidebarIcon(ApiTagsIcon),
  "/docs/restapi/endpoints/getDatasetTagValues":
    sidebarIcon(ApiTagsIcon),
};
