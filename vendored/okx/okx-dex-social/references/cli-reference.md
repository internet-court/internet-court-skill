# Onchain OS DEX Social — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for all 9 social commands.

All endpoints in this skill are REST (no WebSocket channels). Upstream API: `https://web3.okx.com/api/v6/dex/market/social/...`.

---

## 1. onchainos social news-latest

Latest crypto news feed across upstream news platforms (e.g. blockbeats, odaily, theblock). Optional filters by coin symbol, time range, importance, source platform, language. `sortBy` is fixed to "latest" for this endpoint.

```bash
onchainos social news-latest [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--token-symbols` | No | - | Comma-separated coin symbols, max 20 (e.g. `BTC,ETH`) |
| `--begin` | No | now − 72h | Begin timestamp (Unix milliseconds); max lookback 180d |
| `--end` | No | now | End timestamp (Unix milliseconds) |
| `--importance` | No | - | `1`=high, `2`=medium, `3`=low |
| `--platform` | No | - | Single platform identifier (e.g. `blockbeats`); see `news-platforms` |
| `--limit` | No | `10` | Page size, range `[1, 50]` |
| `--cursor` | No | - | Pagination cursor from previous response |
| `--detail-level` | No | `1` | `1`=summary only, `2`=include full `content` |
| `--language` | No | `en_US` | Locale (e.g. `en_US`, `zh_CN`, `ja_JP`) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `cursor` | String | Next-page cursor; `null` on the last page |
| `articles[]` | Array | Article list |
| `articles[].id` | String | Article id (pass to `news-detail`) |
| `articles[].title` | String | Article title |
| `articles[].summary` | String | Short summary |
| `articles[].content` | String | Full body (only when `--detail-level 2`; otherwise empty) |
| `articles[].sourceUrl` | String | Article URL on the upstream platform |
| `articles[].source` | String | First platform identifier (e.g. `blockbeats`) |
| `articles[].timestamp` | Long | Publish time (Unix milliseconds) |
| `articles[].tokenSymbols` | Array&lt;String&gt; | Mentioned coin symbols |
| `articles[].importance` | String | `high` / `medium` / `low` |
| `articles[].tokenSymbolSentiments[]` | Array | Per-coin sentiment for this article |
| `articles[].tokenSymbolSentiments[].tokenSymbol` | String | Token symbol |
| `articles[].tokenSymbolSentiments[].sentiment` | String | `bullish` / `bearish` / `neutral` |

**Examples**:

```bash
# Latest 10 articles, English summary
onchainos social news-latest

# Last 24h of BTC + ETH news, high importance, full body
onchainos social news-latest \
  --token-symbols BTC,ETH \
  --begin 1773649786000 --end 1773736186000 \
  --importance 1 \
  --detail-level 2

# Only blockbeats, Chinese
onchainos social news-latest --platform blockbeats --language zh_CN
```

---

## 2. onchainos social news-by-symbol

News filtered by one or more coin symbols. Supports sort (`1`=latest, `2`=hot), sentiment / importance / platform / time-range filters, and pagination.

```bash
onchainos social news-by-symbol --token-symbols <symbols> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--token-symbols` | Yes | - | Comma-separated coin symbols, max 20 |
| `--sort-by` | No | `1` | `1`=latest, `2`=hot |
| `--sentiment` | No | - | `1`=bullish, `2`=bearish, `3`=neutral |
| `--importance` | No | - | `1`=high, `2`=medium, `3`=low |
| `--platform` | No | - | Single platform identifier |
| `--limit` | No | `10` | Page size, range `[1, 50]` |
| `--cursor` | No | - | Pagination cursor |
| `--detail-level` | No | `1` | `1`=summary, `2`=full body |
| `--begin` | No | now − 72h | Begin timestamp (Unix ms); max lookback 180d |
| `--end` | No | now | End timestamp (Unix ms) |
| `--language` | No | `en_US` | Locale (e.g. `en_US`, `zh_CN`) |

**Return fields**: same shape as `news-latest`.

**Examples**:

```bash
# Hot ETH news this week
onchainos social news-by-symbol --token-symbols ETH --sort-by 2

# Bullish BTC headlines, high importance
onchainos social news-by-symbol --token-symbols BTC --sentiment 1 --importance 1
```

---

## 3. onchainos social news-search

Full-text search across crypto news. Supports sentiment / importance / platform / coin / time-range filters, sort, language, and pagination.

```bash
onchainos social news-search --keyword <keyword> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--keyword` | Yes | - | Search keyword |
| `--sort-by` | No | `1` | `1`=latest, `2`=hot |
| `--sentiment` | No | - | `1`=bullish, `2`=bearish, `3`=neutral |
| `--importance` | No | - | `1`=high, `2`=medium, `3`=low |
| `--platform` | No | - | Single platform identifier |
| `--token-symbols` | No | - | Comma-separated coin symbols, max 20 |
| `--begin` | No | now − 72h | Begin timestamp (Unix ms); max lookback 180d |
| `--end` | No | now | End timestamp (Unix ms) |
| `--detail-level` | No | `1` | `1`=summary, `2`=full body |
| `--limit` | No | `10` | Page size, range `[1, 50]` |
| `--cursor` | No | - | Pagination cursor |
| `--language` | No | `en_US` | Locale (e.g. `en_US`, `zh_CN`) |

**Return fields**: same shape as `news-latest`.

**Examples**:

```bash
# Search "pectra upgrade" in latest order
onchainos social news-search --keyword "pectra upgrade"

# Search "ETF" in hot order, BTC + ETH only, last 7 days
onchainos social news-search \
  --keyword ETF \
  --sort-by 2 \
  --token-symbols BTC,ETH \
  --begin 1773131386000 --end 1773736186000
```

---

## 4. onchainos social news-detail

Get the full body of a single article by id. The response always returns at most one article in `articles`. Use this when a list endpoint returned only a summary (`detail-level=1`) and you need the full body.

```bash
onchainos social news-detail --article-id <id> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--article-id` | Yes | - | Article id (from a previous list response) |
| `--language` | No | `en_US` | Locale (e.g. `en_US`, `zh_CN`) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `articles[]` | Array | Always 1 element on success |
| `articles[].id` | String | Article id |
| `articles[].title` | String | Article title |
| `articles[].summary` | String | Short summary |
| `articles[].content` | String | Full body |
| `articles[].sourceUrl` | String | Article URL |
| `articles[].source` | String | Platform identifier |
| `articles[].timestamp` | Long | Publish time (Unix ms) |
| `articles[].tokenSymbols` | Array&lt;String&gt; | Mentioned coin symbols |
| `articles[].importance` | String | `high` / `medium` / `low` |
| `articles[].tokenSymbolSentiments[]` | Array | Per-coin sentiment |

**Examples**:

```bash
onchainos social news-detail --article-id abc123
onchainos social news-detail --article-id abc123 --language zh_CN
```

---

## 5. onchainos social news-platforms

Live list of news source platforms (domains) that can be passed to the news commands as `--platform`. No parameters.

```bash
onchainos social news-platforms
```

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `platforms[]` | Array&lt;String&gt; | Platform identifiers (e.g. `blockbeats`, `odaily`, `theblock`) |

**Example**:

```bash
onchainos social news-platforms
# -> ["bwe", "odaily", "blockbeats", "blockbeats_flash", "jinsehotarticle", ...]
```

---

## 6. onchainos social sentiment-ranking

Top coins ranked by social activity (mention count) over a configurable window. Currently only `--sort-by 1` (hot) is supported by upstream.

```bash
onchainos social sentiment-ranking [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--time-frame` | No | `1` | Statistical period: `1`=1h, `2`=4h, `3`=24h |
| `--sort-by` | No | `1` | `1`=hot (only value currently supported) |
| `--limit` | No | `10` | Page size, range `[1, 50]` |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `period` | String | Echo of resolved `timeFrame` (e.g. `"1h"`, `"4h"`, `"24h"`) |
| `ts` | String | Server snapshot timestamp (Unix milliseconds) |
| `details[]` | Array | Ranked coins (length ≤ `--limit`) |
| `details[].tokenSymbol` | String | Coin symbol |
| `details[].mentionCount` | String | Total mentions in the window |
| `details[].xMentionCount` | String | X / Twitter mentions |
| `details[].newsMentionCount` | String | News mentions |
| `details[].sentiment.bullishCnt` | String | Bullish mention count |
| `details[].sentiment.bearishCnt` | String | Bearish mention count |
| `details[].sentiment.neutralCnt` | String | Neutral mention count |
| `details[].sentiment.bullishRatio` | String | Bullish share, `0.0`–`1.0` |
| `details[].sentiment.bearishRatio` | String | Bearish share, `0.0`–`1.0` |
| `details[].sentiment.label` | String | Aggregate label: `bullish` / `bearish` / `neutral` / `mixed` |

**Examples**:

```bash
# Top 10 coins by 1h chatter (default window)
onchainos social sentiment-ranking

# Top 20 over the last 24h
onchainos social sentiment-ranking --time-frame 3 --limit 20
```

---

## 7. onchainos social sentiment-symbol

Sentiment metrics for one or more coins over a window, with optional time-bucketed `trend` array.

```bash
onchainos social sentiment-symbol --token-symbols <symbols> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--token-symbols` | Yes | - | Comma-separated coin symbols (max 20) |
| `--time-frame` | No | `1` | Statistical period: `1`=1h, `2`=4h, `3`=24h |
| `--trend-points` | No | - | If `> 0`, include the `trend` array with this many equally-spaced buckets per coin. Max `50`. |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `period` | String | Echo of resolved `timeFrame` (e.g. `"1h"`, `"4h"`, `"24h"`) |
| `ts` | String | Server snapshot timestamp (Unix milliseconds) |
| `details[]` | Array | One entry per requested coin |
| `details[].tokenSymbol` | String | Coin symbol |
| `details[].mentionCount` | String | Total mentions in window |
| `details[].xMentionCount` | String | X / Twitter mentions |
| `details[].newsMentionCount` | String | News mentions |
| `details[].sentiment` | Object | Same shape as `sentiment-ranking` |
| `details[].trend[]` | Array | Present only when `--trend-points > 0` |
| `details[].trend[].ts` | String | Bucket timestamp (Unix milliseconds) |
| `details[].trend[].mentionCount` | String | Mentions in bucket |
| `details[].trend[].bullishRatio` | String | Bullish share in bucket |
| `details[].trend[].bearishRatio` | String | Bearish share in bucket |

**Examples**:

```bash
# Current sentiment for BTC and ETH (1h window, default)
onchainos social sentiment-symbol --token-symbols BTC,ETH

# 24-bucket hourly trend for BTC over the last 24h
onchainos social sentiment-symbol --token-symbols BTC --time-frame 3 --trend-points 24
```

---

## 8. onchainos social vibe-timeline

Token "vibe" (hotness) summary plus a time-bucketed timeline. Includes overall scores with change rates, mention / engagement / impression counts, and sample KOLs per bucket. Keyed by **chain + contract address**.

```bash
onchainos social vibe-timeline --chain <chain> --token-address <address> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--chain` | Yes | - | Chain name (resolves to `chainIndex`, e.g. `ethereum` → `1`, `solana` → `501`) |
| `--token-address` | Yes | - | Token contract address (EVM addresses lowercase) |
| `--time-frame` | No | `1` | `1`=24h, `2`=72h, `3`=7d, `4`=30d |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `summary.score` | String | Vibe hotness score, `"0"`–`"100"` |
| `summary.scoreType` | String | Always `"dex_vibe_hotness"` |
| `summary.scoreRange` | String | Always `"0-100"` |
| `summary.scoreChangeRate` | String | Percent change vs previous period |
| `summary.mentionsCount` | String | Total mentions in window |
| `summary.mentionsCountChangeRate` | String | Percent change vs previous period |
| `summary.engagement` | String | Total engagement count |
| `summary.engagementChangeRate` | String | Percent change vs previous period |
| `summary.impressions` | String | Total impressions |
| `summary.impressionsChangeRate` | String | Percent change vs previous period |
| `summary.supportFirstMentioned` | Boolean | Whether first-mention data is available |
| `timeline[]` | Array | Buckets ordered oldest → newest |
| `timeline[].ts` | Long | Bucket timestamp (Unix ms) |
| `timeline[].score` | String | Vibe score at bucket |
| `timeline[].mentionCount` | Integer | KOL count contributing to the bucket |
| `timeline[].kols[]` | Array | Sample KOLs for the bucket |
| `timeline[].kols[].handle` | String | X / Twitter handle |
| `timeline[].kols[].nickname` | String | Display name |
| `timeline[].kols[].avatar` | String | Avatar URL |
| `timeline[].kols[].followers` | String | Follower count |

**Examples**:

```bash
# 24h vibe for an ETH token
onchainos social vibe-timeline \
  --chain ethereum \
  --token-address 0xa0b86a33e6441c4f7c4c1b8b0d57e3e3c0e0f7c4

# 7-day vibe for a Solana token
onchainos social vibe-timeline \
  --chain solana \
  --token-address So11111111111111111111111111111111111111112 \
  --time-frame 3
```

---

## 9. onchainos social vibe-top-kols

Top KOLs discussing a token over a window, sorted by engagement / mentions / impressions. Capped at upstream `TOP50`.

```bash
onchainos social vibe-top-kols --chain <chain> --token-address <address> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--chain` | Yes | - | Chain name (resolves to `chainIndex`) |
| `--token-address` | Yes | - | Token contract address |
| `--sort-by` | No | `1` | `1`=engagement, `2`=mentions, `3`=impressions |
| `--time-frame` | No | `1` | `1`=24h, `2`=72h, `3`=7d, `4`=30d |
| `--limit` | No | `20` | Page size; capped at upstream `TOP50` |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `kols[]` | Array | Top KOLs (length ≤ `--limit`, hard cap 50) |
| `kols[].handle` | String | X / Twitter handle |
| `kols[].nickname` | String | Display name |
| `kols[].avatar` | String | Avatar URL |
| `kols[].followers` | String | Follower count |
| `kols[].engagement` | String | Engagement count in window |
| `kols[].mentions` | String | Mention count in window |
| `kols[].impressions` | String | Impression count in window |
| `kols[].firstMention` | Object \| null | First-mention info; `null` if no first mention recorded |
| `kols[].firstMention.time` | Long | First-mention time (Unix ms) |
| `kols[].firstMention.contentId` | String | Tweet id |
| `kols[].firstMention.tweetUrl` | String | `https://x.com/{handle}/status/{contentId}` |

**Examples**:

```bash
# Top 20 KOLs by engagement (24h)
onchainos social vibe-top-kols \
  --chain ethereum \
  --token-address 0xa0b86a33e6441c4f7c4c1b8b0d57e3e3c0e0f7c4

# Top 50 KOLs by mention count over 7 days
onchainos social vibe-top-kols \
  --chain solana \
  --token-address So11111111111111111111111111111111111111112 \
  --sort-by 2 --time-frame 3 --limit 50
```

---

## Input / Output Examples

**User says:** "What's the latest BTC news?"

```bash
onchainos social news-by-symbol --token-symbols BTC --sort-by 1 --limit 10
# -> Latest 10 BTC articles with title, source, importance, sentiment
```

**User says:** "Show me only the high-importance ETH news from blockbeats this week"

```bash
onchainos social news-by-symbol \
  --token-symbols ETH \
  --importance 1 \
  --platform blockbeats \
  --begin 1773131386000 --end 1773736186000
```

**User says:** "Open article abc123"

```bash
onchainos social news-detail --article-id abc123
# -> Full article body
```

**User says:** "What are the top 10 hottest coins right now?"

```bash
onchainos social sentiment-ranking --time-frame 1 --limit 10
# -> Ranked list with mention counts and bullish/bearish ratios
```

**User says:** "How bullish is BTC over the last 24h with hourly trend?"

```bash
onchainos social sentiment-symbol --token-symbols BTC --time-frame 1 --trend-points 24
# -> BTC sentiment summary + 24-bucket trend array
```

**User says:** "Who's tweeting about this Solana token?" (with contract address resolved)

```bash
onchainos social vibe-top-kols \
  --chain solana \
  --token-address <address> \
  --sort-by 1 --time-frame 1 --limit 20
# -> TOP20 KOLs by 24h engagement, with first-mention links
```

**User says:** "Show me the vibe trend for this ETH token over a week"

```bash
onchainos social vibe-timeline \
  --chain ethereum \
  --token-address <address> \
  --time-frame 3
# -> Vibe summary with change rates + 7d timeline with sample KOLs per bucket
```
