# Keyword Glossary — okx-dex-social

| Chinese | English | Maps To |
|---|---|---|
| 最新新闻 / 最新加密新闻 / 头条 | latest news, headlines, news feed | `onchainos social news-latest` |
| BTC新闻 / ETH新闻 / 某币种新闻 | news for symbol, news on `<coin>` | `onchainos social news-by-symbol --token-symbols <symbols>` |
| 搜索新闻 / 搜新闻 / 全文搜索 | search news, news search, find articles about | `onchainos social news-search --keyword <kw>` |
| 文章详情 / 全文 / 看这篇 | article detail, full body, open article | `onchainos social news-detail --article-id <id>` |
| 新闻平台 / 新闻来源列表 | news platforms, news sources, source list | `onchainos social news-platforms` |
| 情绪 / 市场情绪 | sentiment, market mood | `onchainos social sentiment-symbol` (single coin) / `sentiment-ranking` (top coins) |
| 情绪排行 / 热度榜 / 讨论度榜 | sentiment ranking, mentions ranking, top coins by chatter | `onchainos social sentiment-ranking` |
| 看多 / 看涨 / 看空 / 看跌 / 中性 / 多空比 | bullish / bearish / neutral / bull-bear ratio | `onchainos social sentiment-symbol` (`bullishRatio`, `bearishRatio`, `neutralCnt`) |
| 趋势 / 走势 / 时间序列 | trend, trendline, time-bucketed | `onchainos social sentiment-symbol --trend-points <N>` (sentiment) or `social vibe-timeline` (vibe) |
| 热度 / vibe / 热度评分 | vibe, hotness score | `onchainos social vibe-timeline` |
| KOL榜 / 头部KOL / 热门KOL / 关键意见领袖 / 谁在讨论 | top KOLs, who's talking, KOL leaderboard | `onchainos social vibe-top-kols` |
| 按互动量 / 按提及次数 / 按曝光量 排序 KOL | sort KOLs by engagement / mentions / impressions | `onchainos social vibe-top-kols --sort-by 1`/`2`/`3` |
| 首发提及 / 首次提到 / 首次提及 | first mention, first to tweet | `onchainos social vibe-top-kols` (`firstMention` field) |
| 重要新闻 / 高重要度 | important / high-importance news | `--importance 1` on news commands |
| 看涨新闻 / 看跌新闻 | bullish / bearish news | `--sentiment 1` (bullish) / `--sentiment 2` (bearish) on `news-by-symbol` / `news-search` |
| 一小时 / 四小时 / 24小时 | 1h / 4h / 24h | sentiment endpoints: `--time-frame 1` / `2` / `3` |
| 24小时 / 三天 / 一周 / 一个月 | 24h / 72h / 7d / 30d | vibe endpoints: `--time-frame 1` / `2` / `3` / `4` |
| 最近 / 近期 / 近来 | recently, lately | News: omit `--begin` / `--end` (server defaults to now − 72h, max 180d lookback). Sentiment / vibe: omit `--time-frame` to use each endpoint's default window. |

## Period Code Reference

The `--time-frame` codes differ between endpoint groups — sentiment is short-window only, vibe is longer-window. The same code number means a different period depending on which command is being called.

### Sentiment endpoints (`sentiment-ranking`, `sentiment-symbol`)

| User phrasing | `--time-frame` |
|---|---|
| last hour, 1h, 一小时 | `1` (default) |
| last 4 hours, 4h, 四小时 | `2` |
| today, 24h, 24 小时, 1D | `3` |

### Vibe endpoints (`vibe-timeline`, `vibe-top-kols`)

| User phrasing | `--time-frame` |
|---|---|
| today, 24h, 24 小时, 1D | `1` (default) |
| 3 days, 三天, 72h, 3D | `2` |
| this week, 7 days, 一周, 1W | `3` |
| this month, 30 days, 一个月, 1M | `4` |

## Sentiment / Importance / Sort Code Reference

| Field | Code | Meaning |
|---|---|---|
| `--sentiment` | `1` | bullish / 看多 / 看涨 |
| `--sentiment` | `2` | bearish / 看空 / 看跌 |
| `--sentiment` | `3` | neutral / 中性 |
| `--importance` | `1` | high / 高 |
| `--importance` | `2` | medium / 中 |
| `--importance` | `3` | low / 低 |
| `news-by-symbol` / `news-search` `--sort-by` | `1` | latest / 最新 |
| `news-by-symbol` / `news-search` `--sort-by` | `2` | hot / 热门 |
| `sentiment-ranking` `--sort-by` | `1` | hot / 热门 (only value currently supported) |
| `vibe-top-kols` `--sort-by` | `1` | engagement / 互动量 |
| `vibe-top-kols` `--sort-by` | `2` | mentions / 提及次数 |
| `vibe-top-kols` `--sort-by` | `3` | impressions / 曝光量 |

> **Symbol vs contract address**: news / sentiment commands take coin **symbols** (`BTC`, `ETH`). Vibe commands take a **contract address + chain** — if the user only gave a symbol, resolve to a contract address via `okx-dex-token` `onchainos token search` first; never guess the address.
