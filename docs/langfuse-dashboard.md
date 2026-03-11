# Langfuse Dashboard Setup

Configuration guide for the LLMOps observability dashboard.

## Widgets

### 1. Volume Over Time
- **Type:** Time series
- **Metric:** Trace count
- **Group by:** Tag `lang` (es/en)
- **Period:** Last 30 days

### 2. Quality Trend
- **Type:** Time series
- **Metric:** Average score `quality` (from online scoring)
- **Period:** Last 30 days
- **Alert:** Set threshold at 0.7

### 3. Cost Per Conversation
- **Type:** Time series
- **Metric:** Average `metadata.cost.total`
- **Period:** Last 30 days
- **Note:** Cost is in USD, tracked per-span

### 4. RAG Hit Rate
- **Type:** Gauge / Percentage
- **Metric:** % of traces with tag `rag:yes`
- **Period:** Last 7 days

### 5. Latency P50/P95
- **Type:** Time series
- **Metric:** `metadata.latencyBreakdown.totalMs`
- **Percentiles:** P50, P95
- **Period:** Last 7 days

### 6. Safety Alerts
- **Type:** Table
- **Filter:** Score `safety` < 0.7
- **Columns:** Trace ID, User message, Safety score, Timestamp
- **Period:** Last 24 hours

### 7. Prompt Version Comparison
- **Type:** Bar chart
- **Metric:** Average `quality` score
- **Group by:** `metadata.promptVersion`
- **Period:** Last 30 days
- **Purpose:** Compare quality across prompt versions

### 8. Intent Distribution
- **Type:** Pie chart
- **Metric:** Score `intent_category` distribution
- **Period:** Last 7 days

### 9. Faithfulness (RAG)
- **Type:** Gauge
- **Metric:** Average score `faithfulness`
- **Filter:** Tag `rag:yes`
- **Period:** Last 7 days

## Score Names Reference

| Score | Source | Scale | Description |
|-------|--------|-------|-------------|
| `quality` | Online (Haiku) | 0-1 | Response helpfulness + tone |
| `safety` | Online (Haiku) | 0-1 | Private info protection |
| `faithfulness` | Online (Haiku) | 0-1 | RAG accuracy (only when RAG used) |
| `response_quality` | Batch (cron) | 0-1 | Detailed quality assessment |
| `safety_score` | Batch (cron) | 0-1 | Detailed safety assessment |
| `intent_category` | Batch (cron) | string | User intent classification |
| `jailbreak_attempt` | Batch (cron) | 0/1 | Jailbreak flag |

## Metadata Fields

| Field | Location | Description |
|-------|----------|-------------|
| `cost.total` | `metadata.cost` | Total USD cost of the conversation |
| `cost.toolDecision` | `metadata.cost` | Cost of tool decision span |
| `cost.embedding` | `metadata.cost` | Cost of embedding span |
| `cost.reranking` | `metadata.cost` | Cost of reranking span |
| `promptVersion` | `metadata` | Langfuse prompt version or "file" |
| `latencyBreakdown.totalMs` | `metadata` | Total end-to-end latency |

## Setup Steps

1. Go to [Langfuse Dashboard](https://cloud.langfuse.com) → your project
2. Navigate to **Dashboards** → **Create New**
3. Add each widget above using the configuration specified
4. Set up alerts for Safety < 0.7 via **Settings** → **Alerts**
