# Keyword Glossary — okx-dex-market

| Chinese | English / Platform Terms | Maps To |
|---|---|---|
| 行情 / 价格 / 多少钱 | market data, price, "how much is X" | `price` (default), `kline` — **never `index`** |
| 指数价格 / 综合价格 / 跨所价格 | index price, aggregate price, cross-exchange composite | `index` — only when user explicitly requests it |
| 盈亏 / 收益 / PnL | PnL, profit and loss, realized/unrealized | `portfolio-overview`, `portfolio-recent-pnl`, `portfolio-token-pnl` |
| 已实现盈亏 | realized PnL, realized profit | `portfolio-token-pnl` (realizedPnlUsd) |
| 未实现盈亏 | unrealized PnL, paper profit, holding gain | `portfolio-token-pnl` (unrealizedPnlUsd) |
| 胜率 | win rate, success rate | `portfolio-overview` (winRate) |
| 历史交易 / 交易记录 / DEX记录 | DEX transaction history, trade log, own wallet DEX history | `portfolio-dex-history` |
| 清仓 | sold all, liquidated, sell off | `portfolio-recent-pnl` (unrealizedPnlUsd = "SELL_ALL") |
| 画像 / 钱包画像 / 持仓分析 | wallet profile, portfolio analysis | `portfolio-overview` |
| 近期收益 | recent PnL, latest earnings by token | `portfolio-recent-pnl` |
