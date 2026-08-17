// TEMPORARY route content — a stress battery for the Mermaid design in
// components/mermaid.tsx. Every chart here is chosen to push a sizing or
// styling edge: long labels vs measured boxes, brand classes, subgraphs,
// converging/bidirectional edges, blocks and notes, and the diagram types
// beyond flowchart/sequence that the theme must at least degrade gracefully
// on. Delete the whole app/mermaid-test folder once the design settles.

export type StressChart = {
  title: string;
  /** What this chart is trying to break. */
  probes: string;
  chart: string;
};

export const stressCharts: StressChart[] = [
  {
    title: 'Sequence — long actor names',
    probes:
      'Actor-box sizing from measured text: the original overflow bug, with even longer names.',
    chart: `sequenceDiagram
    participant SOC as Splunk Observability Cloud Enterprise
    participant SH as Splunk search head deployment cluster
    participant Axiom as Axiom
    SOC->>SH: Log Observer search over selected indexes (port 8089)
    SH->>Axiom: Transparent federated dispatch to the Portal
    Axiom-->>SH: Exact partial results
    SH-->>SOC: Logs, histogram, and field summaries`,
  },
  {
    title: 'Sequence — blocks, notes, activations',
    probes:
      'Note width, alt/else and loop frames, activation bars, self-messages, autonumbering, five actors.',
    chart: `sequenceDiagram
    autonumber
    participant U as User
    participant CDN as Global edge CDN point of presence
    participant API as API gateway
    participant Q as Ingestion queue
    participant DB as Axiom
    Note over U,CDN: TLS termination happens at the nearest edge
    U->>CDN: POST /v1/datasets/ingest (zstd-compressed NDJSON payload)
    activate CDN
    CDN->>API: Forward with client metadata headers
    deactivate CDN
    activate API
    API->>API: Validate token scopes and rate limits
    alt token valid
        API->>Q: Enqueue batch for the ingest pipeline
        Q-->>DB: Flush block to object storage
    else token expired
        API-->>U: 401 with rotation instructions
    end
    deactivate API
    loop every 30 seconds
        Q->>DB: Compact small blocks into larger segments
    end
    Note right of DB: Blocks are immutable once sealed`,
  },
  {
    title: 'Flowchart TD — subgraphs, brands, cylinders',
    probes:
      'Nested subgraph titles, long node labels, :::axiom and :::splunk classes, cylinder shapes, a thick link, and opposite-direction edges between the same pair.',
    chart: `flowchart TD
    subgraph edge[Edge collection tier]
        A[Application instrumented with OpenTelemetry SDK]
        B[Sidecar collector agent with local disk buffering]
        C[Kubernetes DaemonSet log tailer]
    end
    subgraph agg[Aggregation and processing tier]
        D[Horizontally scaled collector gateway pool]
        E[Stream processor for enrichment and PII redaction]
    end
    F[(Axiom)]:::axiom
    G[(Splunk Enterprise indexer cluster)]:::splunk
    H[Long-term object storage with lifecycle policies]
    A --> B
    C --> D
    B --> D
    D --> E
    E -- redacted stream --> F
    E --> G
    F --> H
    H --> F
    G ==> H`,
  },
  {
    title: 'Flowchart LR — fan-in with edge labels',
    probes:
      'Many edges converging on one node (border-anchor fan-out logic), labelled edges, a wide terminal node.',
    chart: `flowchart LR
    A[Vercel functions] -->|structured logs| X
    B[Cloudflare Workers] -->|edge events| X
    C[Fly.io machines] -->|metrics| X
    D[Kubernetes clusters] -->|traces| X
    X[(Axiom)]:::axiom --> Y[Dashboards, monitors, and saved queries for every team]`,
  },
  {
    title: 'State diagram — composite states',
    probes:
      'Nested state container sizing, transition labels longer than their states, retry cycle.',
    chart: `stateDiagram-v2
    [*] --> Queued
    Queued --> Processing: worker picks up the batch
    state Processing {
        [*] --> Validating
        Validating --> Enriching: schema checks pass
        Enriching --> Writing
        Writing --> [*]
    }
    Processing --> Failed: unrecoverable parse error
    Failed --> Queued: retry with exponential backoff
    Processing --> Stored
    Stored --> [*]`,
  },
  {
    title: 'Entity relationship',
    probes: 'Attribute tables, crow-foot markers, relationship labels.',
    chart: `erDiagram
    ORGANIZATION ||--o{ DATASET : owns
    DATASET ||--o{ FIELD : contains
    DATASET ||--o{ MONITOR : watched-by
    MONITOR ||--o{ NOTIFIER : alerts
    ORGANIZATION {
        string id
        string name
        string plan
    }
    DATASET {
        string name
        int retentionDays
        bool canTrim
    }`,
  },
  {
    title: 'Class diagram',
    probes: 'Member compartments, method signatures, relationship labels.',
    chart: `classDiagram
    class IngestPipeline {
        +String dataset
        +int batchSize
        +enqueue(events) Result
        +flush() void
    }
    class QueryEngine {
        +run(apl) ResultSet
        +explain(apl) Plan
    }
    class BlockStore {
        +get(range) Blocks
    }
    IngestPipeline --> BlockStore : writes
    QueryEngine --> BlockStore : reads`,
  },
  {
    title: 'Gantt',
    probes: 'Axis ticks, section labels, done/active bar states, task label placement.',
    chart: `gantt
    title Migration timeline for the observability platform
    dateFormat YYYY-MM-DD
    section Discovery
        Inventory data sources           :done, a1, 2026-01-05, 10d
        Map dashboards and alerts        :done, a2, after a1, 7d
    section Dual-write
        Mirror ingest to Axiom           :active, b1, 2026-01-25, 14d
        Validate query parity            :b2, after b1, 10d
    section Cutover
        Move alerting                    :c1, after b2, 5d
        Decommission legacy indexers     :c2, after c1, 7d`,
  },
  {
    title: 'Pie',
    probes: 'Legend text, slice label contrast, showData values.',
    chart: `pie showData
    title Ingest volume by source
    "Kubernetes" : 42.5
    "Serverless" : 23.1
    "Edge workers" : 18.4
    "Legacy VMs" : 16.0`,
  },
];
