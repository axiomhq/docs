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
import { ChevronIcon } from "./chevron";
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
  ChevronIcon,
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
  SplunkIcon,
  WhatIsAxiomIcon,
};

export type SidebarIconComponent = ComponentType<
  SVGProps<SVGSVGElement>
>;

export type SidebarIconAsset = {
  icon: SidebarIconComponent;
  size: 14;
};

export const documentationSidebarPageIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  "/docs/introduction": { icon: WhatIsAxiomIcon, size: 14 },
  "/docs/getting-started": { icon: QuickStartIcon, size: 14 },
  "/docs/platform-overview/architecture": {
    icon: ArchitectureIcon,
    size: 14,
  },
  "/docs/platform-overview/features": {
    icon: FeaturesIcon,
    size: 14,
  },
  "/docs/platform-overview/security": {
    icon: SecurityIcon,
    size: 14,
  },
  "/docs/platform-overview/roadmap": {
    icon: RoadmapIcon,
    size: 14,
  },
  "/docs/send-data/reference-architectures": {
    icon: ReferenceArchitecturesIcon,
    size: 14,
  },
  "/docs/send-data/methods": { icon: MethodsIcon, size: 14 },
  "/docs/getting-started-guide/observability": {
    icon: ObservabilityIcon,
    size: 14,
  },
  "/docs/getting-started-guide/product-analytics": {
    icon: ProductAnalyticsIcon,
    size: 14,
  },
  "/docs/get-help/faq": { icon: FaqsIcon, size: 14 },
};

export const documentationSidebarGroupIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  Fundamentals: { icon: FundamentalsIcon, size: 14 },
  Console: { icon: ConsoleIcon, size: 14 },
  "AI agents": { icon: AiAgentsIcon, size: 14 },
  Splunk: { icon: SplunkIcon, size: 14 },
  "LLM observability": { icon: LlmObservabilityIcon, size: 14 },
  LLMs: { icon: LlmsIcon, size: 14 },
  Legal: { icon: LegalIcon, size: 14 },
};

export const querySidebarPageIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  "/docs/apl/overview": { icon: QueryOverviewIcon, size: 14 },
  "/docs/apl/introduction": {
    icon: QueryIntroductionIcon,
    size: 14,
  },
  "/docs/apl/tutorial": { icon: SampleQueriesIcon, size: 14 },
  "/docs/apl/apl-features": { icon: QueryFeaturesIcon, size: 14 },
  "/docs/mpl/introduction": { icon: MplFeaturesIcon, size: 14 },
  "/docs/mpl/sample-queries": {
    icon: SampleQueriesIcon,
    size: 14,
  },
  "/docs/mpl/migrate-metrics": {
    icon: QueryMigrateIcon,
    size: 14,
  },
};

export const querySidebarGroupIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  Functions: { icon: QueryFunctionsIcon, size: 14 },
  Operators: { icon: QueryOperatorsIcon, size: 14 },
  Reference: { icon: QueryReferenceIcon, size: 14 },
  Migrate: { icon: QueryMigrateIcon, size: 14 },
};

export const apiSidebarPageIcons: Readonly<
  Record<string, SidebarIconAsset>
> = {
  "/docs/restapi/introduction": {
    icon: ApiIntroductionIcon,
    size: 14,
  },
  "/docs/restapi/ingest": { icon: ApiSendDataIcon, size: 14 },
  "/docs/restapi/query": { icon: ApiQueryDataIcon, size: 14 },
  "/docs/restapi/pagination": {
    icon: ApiPaginationIcon,
    size: 14,
  },
  "/docs/restapi/api-limits": { icon: ApiLimitsIcon, size: 14 },
  "/docs/restapi/endpoints/ingestToDataset": {
    icon: ApiSendDataIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/ingestHecEvent": {
    icon: ApiSendDataIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/ingestHecRaw": {
    icon: ApiSendDataIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/getHecHealth": {
    icon: ApiHealthIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/queryEdge": {
    icon: ApiQueryDataIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/queryBatch": {
    icon: ApiQueryDataIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/queryMetrics": {
    icon: ApiQueryDataIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/getDatasetMetrics": {
    icon: ApiMetricsIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/getDatasetMetricTags": {
    icon: ApiTagsIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/getDatasetMetricTagValues": {
    icon: ApiTagsIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/getDatasetTags": {
    icon: ApiTagsIcon,
    size: 14,
  },
  "/docs/restapi/endpoints/getDatasetTagValues": {
    icon: ApiTagsIcon,
    size: 14,
  },
};
