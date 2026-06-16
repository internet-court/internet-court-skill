# Keyword Glossary — okx-dex-token

Users may use Chinese crypto slang or platform-specific terms. Map them to the correct commands:

| Chinese | English / Platform Terms | Maps To |
|---|---|---|
| 热门代币 / 热榜 | hot tokens, trending tokens | `token hot-tokens` |
| Trending榜 / 代币分排名 | trending score ranking | `token hot-tokens --ranking-type 4` |
| Xmentioned榜 / 推特提及 / 社媒热度 | Twitter mentions ranking, social mentions | `token hot-tokens --ranking-type 5` |
| 流动性池 / 资金池 | liquidity pools, top pools | `token liquidity` |
| 烧池子 / LP已销毁 | LP burned, burned liquidity | filter via `token hot-tokens --is-lp-burnt true` |
| 代币高级信息 / 风控 / 风险等级 | token risk, advanced info, risk level | `token advanced-info` |
| 貔貅盘 / 蜜罐检测 | honeypot, is this token safe, can I sell this | → `okx-security` (`onchainos security token-scan`) |
| 内盘 / 内盘代币 | internal token, launch platform token | `token advanced-info` (isInternal) |
| 开发者跑路 / Rug Pull | rug pull, dev rug | `token advanced-info` (devRugPullTokenCount) |
| 盈利地址 / 顶级交易员 | top traders, profit addresses | `token top-trader` |
| 聪明钱 | smart money | `token top-trader --tag-filter 3` or `token holders --tag-filter 3` |
| 巨鲸 | whale | `token top-trader --tag-filter 4` or `token holders --tag-filter 4` |
| KOL | KOL / influencer | `token top-trader --tag-filter 1` or `token holders --tag-filter 1` |
| 狙击手 | sniper | `token top-trader --tag-filter 7` or `token holders --tag-filter 7` |
| 老鼠仓 / 可疑地址 | suspicious, insider trading | `token top-trader --tag-filter 6` or `token holders --tag-filter 6` |
| 捆绑交易者 | bundle traders, bundlers | `token top-trader --tag-filter 9` or `token holders --tag-filter 9` |
| 持币分布 / 持仓分布 | holder distribution | `token holders` |
| 前十持仓 / Top10集中度 | top 10 holder concentration | `token hot-tokens --top10-hold-percent-min/max` or `token advanced-info` (top10HoldPercent) |
| 开发者持仓 | dev holding percent | `token hot-tokens --dev-hold-percent-min/max` or `token advanced-info` (devHoldingPercent) |
| 净流入 | net inflow | `token hot-tokens --inflow-min/max` |
| 社区认可 | community recognized, verified | `token search` (communityRecognized field) |
| 持仓集中度 / 聚类分析 | holder cluster concentration, cluster analysis | `token cluster-overview` |
| 前100持仓概览 / Top100 | top 100 holder overview, top 100 behavior | `token cluster-top-holders --range-filter 3` |
| 持仓集群 / 集群列表 | holder cluster list, cluster groups | `token cluster-list` |
| Rug Pull可能性 | rug pull probability, rug pull risk | `token cluster-overview` (rugPullPercent) |
| 新地址占比 | new address ratio, fresh wallet ratio | `token cluster-overview` (holderNewAddressPercent) |
| 同资金来源 | same funding source | `token cluster-overview` (holderSameFundSourcePercent) |
| 同创建时间地址占比 | same creation time address ratio | `token cluster-overview` (holderSameCreationTimePercent) |
| 支持的链 / cluster支持链 | supported chains for cluster | `token cluster-supported-chains` |
