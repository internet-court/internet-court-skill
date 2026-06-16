# Keyword Glossary — okx-dex-signal

| Chinese | English / Platform Terms | Maps To |
|---|---|---|
| 聪明钱最新交易 / 追踪聪明钱 / 聪明钱在买什么 | latest smart money trades, track smart money, what are smart money buying (transaction-level) | `tracker activities --tracker-type smart_money` |
| KOL交易动态 / 追踪KOL / KOL在买什么 | KOL trade feed, track KOL activity, what are KOL buying (transaction-level) | `tracker activities --tracker-type kol` |
| 追踪地址 / 追踪钱包 / 特定地址交易 | track specific addresses, custom wallet monitoring | `tracker activities --tracker-type multi_address` |
| 卖出动态 / 追踪聪明钱卖出 | sell tracking, smart money sell feed | `tracker activities --trade-type 2` |
| 大户 / 巨鲸 (信号场景) | whale buy signal alerts (aggregated) | `signal list --wallet-type 3` |
| 聪明钱信号 / 聪明资金信号 | smart money buy signal alerts (aggregated) | `signal list --wallet-type 1` |
| KOL信号 / 网红信号 | KOL buy signal alerts (aggregated) | `signal list --wallet-type 2` |
| 信号 / 大户信号 | signal, alert, buy signal | `signal list` |
| 牛人榜 | leaderboard, top traders ranking, smart money ranking | `leaderboard list` |
| 胜率 | win rate | `leaderboard list --sort-by 2` |
| 已实现盈亏 / PnL | realized PnL | `leaderboard list --sort-by 1` |
| 交易量 | volume, tx volume | `leaderboard list --sort-by 4` |
| 交易笔数 | tx count | `leaderboard list --sort-by 3` |
| ROI / 收益率 | ROI, profit rate | `leaderboard list --sort-by 5` |
| 狙击手 | sniper | `leaderboard list --wallet-type sniper` |
| 开发者 | dev, developer | `leaderboard list --wallet-type dev` |
| 新钱包 | fresh wallet | `leaderboard list --wallet-type fresh` |
