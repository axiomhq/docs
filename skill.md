---
name: Axiom
description: Use when building data pipelines, querying event and telemetry data, creating dashboards and monitors, setting up AI engineering workflows, or managing observability infrastructure. Agents should reach for this skill when users need to ingest data, explore logs, create alerts, build visualizations, or evaluate AI systems.
metadata:
    mintlify-proj: axiom
    version: "1.0"
---

# Axiom Skill

## Product summary

Axiom is a data platform for collecting, storing, and analyzing event and telemetry data at scale. It combines EventDB (optimized for timestamped events) and MetricsDB (for high-cardinality time-series) with an intelligent Console for exploration, visualization, and monitoring. Agents use Axiom to ingest data via REST API or CLI, query using APL (Axiom Processing Language), build dashboards, set up monitors and alerts, and evaluate AI systems. Key entry points: REST API at `https://api.axiom.co/v1/ingest/DATASET_NAME` for ingestion, CLI via `axiom` command, and Console at `https://app.axiom.co`. Primary docs: https://axiom.co/docs

## When to use

Reach for this skill when:
- **Ingesting data**: User needs to send logs, events, metrics, or telemetry to Axiom (via API, CLI, or integrations)
- **Querying data**: User wants to explore, filter, or analyze data using APL or the visual query builder
- **Building dashboards**: User needs to create visualizations, combine multiple queries, or share insights
- **Setting up monitoring**: User wants to create threshold, anomaly, or match monitors with alerts (Slack, email, PagerDuty, etc.)
- **AI engineering workflows**: User is building, evaluating, or observing generative AI systems
- **Managing datasets**: User needs to create datasets, manage fields, set up virtual fields, or configure map fields
- **Automating tasks**: User wants to use the CLI or REST API to programmatically manage Axiom resources

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

### API endpoints (base: `https://api.axiom.co/v2/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/ingest/DATASET_NAME` | POST | Ingest data (use edge domain) |
| `/datasets` | GET/POST | List or create datasets |
| `/datasets/{id}/query` | POST | Query data with APL |
| `/dashboards` | GET/POST | Manage dashboards |
| `/monitors` | GET/POST | Manage monitors |
| `/tokens` | GET/POST | Manage API tokens |

### APL query structure

```kusto
DatasetName
| where field == "value"           // Filter rows
| extend newField = field * 2      // Add computed columns
| summarize count() by field       // Aggregate data
| sort by count_ desc              // Order results
```

### Data ingestion formats

- **JSON**: Array of objects, `Content-Type: application/json`
- **NDJSON**: One JSON object per line, `Content-Type: application/x-ndjson`
- **CSV**: Headers in first row, `Content-Type: text/csv`

### Authentication

- **API tokens**: Scoped permissions, use for specific datasets or operations. Header: `Authorization: Bearer API_TOKEN`
- **Personal Access Tokens (PATs)**: Full account access. Headers: `Authorization: Bearer PAT` + `x-axiom-org-id: ORG_ID`

## Decision guidance

| Scenario | Use API | Use CLI | Use Console |
|----------|---------|---------|-------------|
| Automated data ingestion in production | ✓ | | |
| One-off data exploration | | | ✓ |
| Batch ingestion from local files | | ✓ | |
| Building dashboards and monitors | | | ✓ |
| Programmatic dataset management | ✓ | ✓ | |
| Real-time data streaming | | ✓ | |
| Complex queries with visualizations | | | ✓ |
| CI/CD pipeline integration | ✓ | ✓ | |

| Query approach | When to use |
|---|---|
| **APL (raw)** | Complex filtering, aggregations, or transformations; reusable queries |
| **Visual builder** | Simple filters and counts; users unfamiliar with query syntax |
| **AI generation** | Quick exploration; natural language description of desired output |

| Monitor type | When to use |
|---|---|
| **Threshold** | Alert when metric crosses a fixed value (e.g., error count > 100) |
| **Anomaly** | Alert when behavior deviates from historical baseline |
| **Match** | Alert on specific events matching a filter (e.g., critical errors) |

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
   - API: POST `/datasets/{id}/query` with APL query

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
- **API domain confusion**: Ingest uses edge domain (e.g., `https://AXIOM_DOMAIN/v1/ingest`); all other API calls use `https://api.axiom.co/v2/`
- **Token scoping**: API tokens can be scoped to specific datasets. Verify token has permission for the dataset you're querying
- **Monitor evaluation lag**: Monitors run on a schedule (typically every 1-5 minutes). Alerts won't trigger instantly
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
- [ ] **API requests**: Verify Authorization header includes token; Content-Type matches data format; base domain is correct for endpoint
- [ ] **Permissions**: Confirm API token has required scopes; user has access to shared dashboards/monitors
- [ ] **Performance**: For large queries, check query cost in Console; consider adding time range filters or limits to reduce cost

## Resources

- **Comprehensive navigation**: https://axiom.co/docs/llms.txt — Full page-by-page listing for agent reference
- **APL query reference**: https://axiom.co/docs/apl/introduction — Query language syntax, operators, and functions
- **REST API reference**: https://axiom.co/docs/restapi/introduction — Complete endpoint documentation and authentication
- **CLI reference**: https://axiom.co/docs/reference/cli — Command-line tool usage and configuration

---

> For additional documentation and navigation, see: https://axiom.co/docs/llms.txt
