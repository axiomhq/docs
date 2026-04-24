---
name: Axiom
description: Use when building data pipelines, querying event and telemetry data, creating dashboards and monitors, setting up AI engineering workflows, or managing observability infrastructure. Agents should reach for this skill when users need to ingest data, explore logs, create alerts, build visualizations, or evaluate AI systems.
metadata:
    mintlify-proj: axiom
    version: "1.0"
---

# Axiom Skill

## Product summary

Axiom is a data platform for collecting, storing, and analyzing machine data (logs, metrics, traces, events) at scale. It combines EventDB (optimized for timestamped events) and MetricsDB (for high-cardinality OpenTelemetry metrics) with an intelligent Console for exploration, visualization, and monitoring. Agents use Axiom to ingest data via REST API or CLI, query events using APL (Axiom Processing Language), query metrics using MPL (Metrics Processing Language), build dashboards, set up monitors and alerts, and evaluate AI systems. Key entry points: REST API for ingestion and queries at the edge domain (`https://AXIOM_DOMAIN/`), management API at `https://api.axiom.co/v2/`, CLI via `axiom` command, and Console at `https://app.axiom.co`. AI agents can also connect via Axiom MCP Server (`https://mcp.axiom.co/mcp`, OAuth-based) or Axiom Skills (instruction files with investigation methodology). Primary docs: https://axiom.co/docs

## When to use

Reach for this skill when:
- **Ingesting data**: User needs to send logs, events, metrics, or telemetry to Axiom (via API, CLI, or integrations)
- **Querying data**: User wants to explore, filter, or analyze data using a text-based query language like APL or MPL or the visual query builder
- **Building dashboards**: User needs to create visualizations, combine multiple queries, or share insights
- **Setting up monitoring**: User wants to create threshold, anomaly, or match monitors with alerts (Slack, email, PagerDuty, etc.)
- **AI engineering workflows**: User is building, evaluating, or observing generative AI systems
- **Managing datasets**: User needs to create datasets, manage fields, set up virtual fields, or configure map fields
- **Automating tasks**: User wants to use the CLI or REST API to programmatically manage Axiom resources
- **Setting up agent integration**: User wants to connect an AI agent to Axiom via MCP Server or Axiom Skills

## Quick reference

### CLI commands

| Command | Purpose |
|---------|---------|
| `axiom auth login` | Authenticate with Axiom |
| `axiom ingest DATASET_NAME < data.json` | Ingest data from file |
| `axiom query "DATASET \| where status == 500"` | Run APL query from CLI |
| `axiom stream DATASET_NAME` | Live stream data |
| `axiom dataset create NAME` | Create a new dataset |
| `axiom dataset list` | List all datasets |
| `axiom config set AXIOM_TOKEN <token>` | Set API token |

### API endpoints

**Edge domain endpoints** (base: `https://AXIOM_DOMAIN/`; API tokens only, PATs not supported):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/ingest/{dataset_name}` | POST | Ingest events |
| `/query/_apl?format=tabular` | POST | Query events with APL |
| `/query/_mpl` | POST | Query metrics with MPL |
| `/query/metrics/info/datasets/{dataset}/metrics` | GET | Discover available metrics |

**Management endpoints** (base: `https://api.axiom.co/v2/`):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/datasets` | GET/POST | List or create datasets |
| `/dashboards` | GET/POST | Manage dashboards |
| `/monitors` | GET/POST | Manage monitors |
| `/tokens` | GET/POST | Manage API tokens |

### Edge deployments

Every Axiom organization has a primary edge deployment that determines where event data is ingested, stored, and queried. Ingest and query endpoints use the edge deployment's base domain — this is what `AXIOM_DOMAIN` represents throughout this document.

**Available edge deployments:**

| Edge deployment | Base domain (`AXIOM_DOMAIN`) |
|-----------------|------------------------------|
| US East 1 (AWS) | `us-east-1.aws.edge.axiom.co` |
| EU Central 1 (AWS) | `eu-central-1.aws.edge.axiom.co` |

**How to resolve `AXIOM_DOMAIN` for a given dataset:**

1. In the Axiom Console, go to **Settings > General** and find the **Edge deployment** section to see your organization's default edge deployment.
2. Use the corresponding base domain from the table above.
3. In multi-edge organizations, datasets can belong to different edge deployments. Check which edge deployment a dataset belongs to before ingesting or querying — a query sent to the wrong edge returns no results.

Management operations (datasets, dashboards, monitors, tokens) always use `https://api.axiom.co/v2/` regardless of edge deployment.

### APL query structure

```kusto
DatasetName
| where field == "value"           // Filter rows
| extend newField = field * 2      // Add computed columns
| summarize count() by field       // Aggregate data
| sort by count_ desc              // Order results
```

### MPL query structure (MetricsDB)

MPL targets OTel metrics datasets and uses a pipe-based syntax. Discover available metrics first:

```bash
GET https://AXIOM_DOMAIN/query/metrics/info/datasets/{dataset}/metrics
```

Example MPL query and request body for `POST https://AXIOM_DOMAIN/query/_mpl`:

```kusto
`my-metrics`:`http.server.request.duration`
| where `service.name` == "checkout"
| align to 5m using avg
```

```json
{
  "mpl": "`my-metrics`:`http.server.request.duration` | where `service.name` == \"checkout\" | align to 5m using avg",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-01T01:00:00Z"
}
```

### Data ingestion formats

- **JSON**: Array of objects, `Content-Type: application/json`
- **NDJSON**: One JSON object per line, `Content-Type: application/x-ndjson`
- **CSV**: Headers in first row, `Content-Type: text/csv`

### Authentication

- **API tokens**: Scoped permissions, use for specific datasets or operations. Header: `Authorization: Bearer API_TOKEN`
- **Personal Access Tokens (PATs)**: Full account access. Headers: `Authorization: Bearer PAT` + `x-axiom-org-id: ORG_ID`

In general, use properly scoped API tokens. Never use PATs for AI agent use.

### AI agent integration

| Method | Credential handling | Best for |
|--------|---------------------|----------|
| **Axiom MCP Server** (`https://mcp.axiom.co/mcp`) | OAuth, agents never see tokens | Curated read-only operations |
| **Axiom Skills** (instruction files) | Configured API tokens | Structured investigation methodology |
| **Direct REST API** | API token in Authorization header | Programmatic ingestion and automation |

Add Axiom capabilities to an agent context:

```bash
npx skills add axiomhq/skills
```

## Decision guidance

| Scenario | Use API | Use CLI | Use Console |
|----------|---------|---------|-------------|
| Automated data ingestion in production | ✓ | | |
| One-off data exploration | | | ✓ |
| Batch ingestion from local files | | ✓ | |
| Building dashboards and monitors | ✓ | | ✓ |
| Programmatic dataset management | ✓ | ✓ | |
| Live-tailing a data stream | | ✓ | |
| Complex queries with visualizations | | | ✓ |
| CI/CD pipeline integration | ✓ | ✓ | |

| Query approach | When to use |
|---|---|
| **APL (raw)** | Complex filtering, aggregations, or transformations on event data; reusable queries |
| **MPL** | Querying OTel metrics (rates, histograms, gauges) from MetricsDB |
| **Visual builder** | Simple filters and counts; users unfamiliar with query syntax |
| **AI generation** | Quick exploration; natural language description of desired output |

| Monitor type | When to use |
|---|---|
| **Threshold** | Alert when metric crosses a fixed value (for example, error count > 100) |
| **Anomaly** | Alert when behavior deviates from historical baseline |
| **Match** | Alert on specific events matching a filter (for example, critical errors) |

## Workflow

### Typical task: Ingest data and query it

1. **Create a dataset** (if needed)
   - Console: Datasets tab → Create dataset
   - CLI: `axiom dataset create my-logs`
   - API: POST `/datasets` with name and description

2. **Generate or obtain an API token**
   - Console: Settings → Tokens → Create token
   - Scope token to dataset if using API tokens (not PATs)
   - Store securely in environment variable: `export AXIOM_TOKEN=...`

3. **Ingest data**
   - CLI: `cat logs.json | axiom ingest my-logs`
   - API: `curl -X POST https://AXIOM_DOMAIN/v1/ingest/my-logs -H "Authorization: Bearer $AXIOM_TOKEN" -H "Content-Type: application/json" -d @data.json`
   - Verify ingestion in Console: Datasets tab → dataset → check event count

4. **Query the data**
   - Console: Query tab → write APL or use visual builder
   - CLI: `axiom query "['my-logs'] | where status == 500 | summarize count()"`
   - API: `POST https://AXIOM_DOMAIN/query/_apl?format=tabular` with body `{"apl": "['my-logs'] | where status == 500"}`

5. **Visualize and save**
   - Console: Add visualizations, save query, or add to dashboard
   - CLI: Results display in terminal; export with `--output json` or `--output csv`

### Typical task: Create a monitor and alert

1. **Write and test a query** in the Query tab
2. **Create monitor**: Click "Create new monitor" from query results
3. **Choose monitor type**: Threshold, anomaly, or match
4. **Set alert condition**: Threshold value, time window, evaluation frequency
5. **Add notifier**: Select Slack, email, PagerDuty, Discord, OpsGenie, or webhook
6. **Test notification**: Trigger monitor manually to verify alert delivery
7. **Enable monitor**: Toggle on in Monitor tab

### Typical task: Build a dashboard

1. **Create dashboard**: Dashboards tab → New dashboard → Empty or Generate with AI
2. **Add elements**: Click "Add element" → choose type (time series, table, statistic, etc.)
3. **Configure each element**: Select dataset, write APL query, set visualization options
4. **Add filters**: Dashboard-level filters apply to all elements
5. **Configure dashboard**: Set time range, sharing, refresh rate
6. **Save and share**: Share link with team or embed in external tools

## Common gotchas

- **Case sensitivity**: APL is case-sensitive for dataset names, field names, operators, and functions. `['my-dataset']` ≠ `['My-Dataset']`
- **Quoting field names**: Quote names with spaces, dots, or dashes: `['field-name']` or `['field.name']`
- **Timestamp field**: Axiom expects `_time` field for time-series operations. If your data uses a different timestamp field, specify it during ingestion with `timestamp-field` parameter
- **API domain confusion**: Ingest and query (APL and MPL) all use the edge domain (`https://AXIOM_DOMAIN/`); only management operations (datasets, dashboards, monitors, tokens) use `https://api.axiom.co/v2/`. Mixing domains causes 404 errors. Additionally, edge endpoints only accept API tokens — PATs are not supported.
- **MPL vs APL**: Event datasets use APL; OTel metrics datasets use MPL. Sending an APL query to the metrics endpoint (or vice versa) returns an error. Fetch the MPL spec first via `GET /v2/datasets/{dataset_id}/metrics/query/spec`.
- **Token scoping for agents**: API tokens can be scoped to specific datasets. Verify the token has permission for the dataset you're querying. Never use personal access tokens for AI agent use — they grant full account access. For MCP Server, use OAuth instead; agents never see tokens.
- **Monitor evaluation lag**: Monitors run on a schedule (typically every 1–5 minutes). Alerts won't trigger instantly
- **Virtual field performance**: Virtual fields run on every query. Complex expressions may slow queries; test with `| limit 1000` first
- **Null handling**: Use `isnotnull()` or `isempty()` to filter nulls; `where field == null` may not work as expected
- **APL pipe syntax**: Each operator must be on a new line or separated by `|`. Missing pipes cause parse errors
- **Dashboard time range**: Dashboard time range overrides element-level time ranges. Set at dashboard level for consistency

## Verification checklist

Before submitting work:

- [ ] **Data ingestion**: Verify event count increased in Datasets tab; check sample events for correct structure
- [ ] **Query correctness**: Run query in Console and verify results match expectations; check row count and field values
- [ ] **APL syntax**: Confirm all operators are pipe-separated; dataset and field names are quoted if needed; case matches exactly
- [ ] **Dashboard**: All elements load without errors; filters work correctly; time range is appropriate
- [ ] **Monitor**: Test alert by manually triggering monitor; verify notification reaches intended channel; check alert condition logic
- [ ] **API requests**: Verify Authorization header includes token; Content-Type matches data format; edge domain for ingest and query, `api.axiom.co` for management endpoints
- [ ] **Permissions**: Confirm API token has required scopes; user has access to shared dashboards/monitors
- [ ] **Performance**: For large queries, check query cost in Console; consider adding time range filters or limits to reduce cost

## Resources

- **Comprehensive navigation**: https://axiom.co/docs/llms.txt — Full page-by-page listing for agent reference
- **APL query reference**: https://axiom.co/docs/apl/introduction — Query language syntax, operators, and functions
- **REST API reference**: https://axiom.co/docs/restapi/introduction — Complete endpoint documentation and authentication
- **CLI reference**: https://axiom.co/docs/reference/cli — Command-line tool usage and configuration
- **Axiom MCP Server**: https://axiom.co/docs/console/intelligence/mcp-server — OAuth-based agent integration with curated tools
- **Axiom Skills**: https://axiom.co/docs/console/intelligence/skills — Structured investigation skills for AI agents
- **AI agents overview**: https://axiom.co/docs/console/intelligence/ai-agents-overview — When to use MCP Server vs Skills

---

> For additional documentation and navigation, see: https://axiom.co/docs/llms.txt
