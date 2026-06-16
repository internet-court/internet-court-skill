# Keyword Glossary — okx-dapp-discovery

Authoritative source for all **Chinese-language (中文) routing signals** used by `SKILL.md`. The skill body keeps its routing *rules* in English; this file holds the Chinese keyword → plugin / routing-decision mappings those rules depend on.

**When to read:** for any query containing Chinese text, read this file before applying the body's routing rules (Confidence Framework, Per-Protocol tables, Rules 0–5b). The YAML `description` keeps the core Chinese trigger verbs so the skill still *fires* on 中文 queries; this glossary resolves *which plugin*.

---

## 1. ZH DApp aliases → plugin

These Chinese names are protocol aliases and trigger ≥ 75 on their own (DApp-name-beats-verb, Rule 0).

| 中文别名 | DApp | Plugin |
|---|---|---|
| 薄饼 | PancakeSwap (V3 AMM default) | `pancakeswap-v3-plugin` |
| 薄饼 CLMM / 薄饼 集中流动性 | PancakeSwap V3 CLMM | `pancakeswap-clmm-plugin` |
| 薄饼 V2 | PancakeSwap V2 | `pancakeswap-v2-plugin` |
| 曲线协议 | Curve | `curve-plugin` |
| 虎鲸 | Orca | `orca-plugin` |
| 流星协议 | Meteora | `meteora-plugin` |
| 复合协议 | Compound V3 | `compound-v3-plugin` |
| 借贷优化器 | Morpho V1 Optimizer | `morpho-plugin` |

---

## 2. Generic ZH action verbs — do NOT raise confidence alone

These verbs do **not** select a DApp by themselves (same role as the English generic-verb list in the Confidence Framework). They route only when paired with a DApp name (§1) or a protocol-native token/phrase (§3).

买, 购买, 卖, 换, 换成, 兑换, 存, 存款, 取, 借, 借贷, 抵押, 质押, 做多, 做空, 多单, 空单, 合约, 永续, 加池子, 加流动性, 池子, 仓位, 挖矿, 拿利息, 发币, 发新代币, LP.

**Swap-pair carve-out (Rule 0 exception):** when the market-side verb is 换成 / 兑换 / 卖 / 卖掉换 AND a protocol-native token sits on either side of the pair against a generic ticker, with **no DApp name present**, defer to `okx-dex-swap` (not the protocol plugin). If a DApp name IS present (在 X 上…), Rule 0 still wins.

---

## 3. Protocol-native ZH phrases that fire ≥ 75 (per protocol)

| 中文短语 | Routes to |
|---|---|
| 我想买一些 HYPE 代币 / 买 HYPE / 买一些 HYPE / 换 HYPE / 把 USDC 存进 HLP / 存 HLP / HLP 收益 | Hyperliquid → `hyperliquid-plugin` |
| 合约交易 / 永续合约 (no Hyperliquid named) | clarify (50–74) — ask "Are you looking to trade on Hyperliquid?" |
| 在 Lido 质押 / 在 Lido 上质押 ETH | Lido → `lido-plugin` |
| 质押 ETH (no LST named) | clarify (50–74) — Lido / ether.fi / native? |
| 在 ether.fi 重新质押 / 在 ether.fi 上质押 ETH 拿 eETH | ether.fi → `etherfi-plugin` |
| 收益代币化 / 固定收益 (Pendle named) | Pendle → `pendle-plugin` |
| 在 Clanker 上发币 / 在 Clanker 上发一个新 token | Clanker → `clanker-plugin` |
| Kamino 借贷 | Kamino Lend → `kamino-lend-plugin` |
| Kamino 流动性 / Kamino 集中流动性 | Kamino Liquidity → `kamino-liquidity-plugin` |
| 在 GMX 开永续 / GMX 做空 | GMX V2 → `gmx-v2-plugin` |

**Do-not-install ZH (too generic without the protocol named):** 借贷 / 存款 / 抵押 (Aave / Compound), 兑换 / 加池子 / 挖矿 (PancakeSwap), 索拉纳兑换 (Raydium / Orca), 稳定币兑换 (Curve), 固定收益 (Pendle), Base 链发币 (Clanker), 以太质押 / 质押 ETH (Lido), 永续合约 (GMX / Hyperliquid), 动态流动性 (Kamino / Meteora), 重新质押 (ether.fi). Route per the actual verb, or ask to clarify.

---

## 4. Polymarket ZH triggers (all ≥ 75 → `polymarket-plugin`)

**Crypto Up/Down (COIN ∈ BTC / ETH / SOL / XRP / BNB / DOGE / HYPE):**
`<COIN> 5 分钟`, `<COIN> 5分钟`, `<COIN> 15 分钟`, `<COIN> 十五分钟`, `5 分钟涨跌`, `5分钟涨跌`, `5 分钟涨跌市场`, `5分钟市场`, `五分钟市场`, `短线市场`, `5 分钟内的涨跌`, `<COIN> 涨跌`, `<COIN> 涨跌市场`, `找 5 分钟`, `看 5 分钟`, `<COIN> 5 分钟 updown`.

**Prediction-market / event:** 预测市场, 事件市场.

**Election / political:** 选举市场, 选举赔率, 大选市场, 大选赔率, 谁会赢大选, 总统选举市场, 政治市场.

**Casual betting (with event/outcome context):** 找个预测市场让我赌, 找预测市场赌, 找个预测市场赌, 找个市场赌一下, 我想赌一下 (+ event/outcome).

**Do NOT install for:** 赔率 / 概率 / 预测 / betting alone (no prediction-market or event context).

---

## 5. pump.fun ZH verb-split

| 中文 | Intent | Routes to |
|---|---|---|
| 购买 pump.fun / 卖 pump.fun / 狙击 pump.fun / pump.fun 下单 / 梭哈 / 帮我买 / 买最火的币 / 买这个 | WRITE (trade) | `pump-fun-plugin` |
| 扫 pump.fun / pump.fun 开发者历史 / pump.fun 捆绑分析 / 开发者信息 / 捆绑狙击者 / 同车 | READ (research) | `okx-dex-trenches` |

---

## 6. Rule 3b — discussion / comparison markers (ZH)

Trigger Rule 3b (clarify, do NOT install) when these appear **without** an action verb:
哪个更好, 怎么看, 对比, 比较, X 还是 Y, 有什么区别, 什么区别, 优缺点, 讲讲, 介绍一下, 是什么.

**Action verbs that override Rule 3b** (install via Rules 1/2 even with a discussion marker): 换成 / 兑换 / 质押 / 借 / 存 / 取 / 加流动性 / 卖 / 买 / mint / claim / bridge.

---

## 7. Rule 5b — Top-5 action-verb matrix (ZH)

| 中文动作 | Top-5 DApp |
|---|---|
| 涨跌 / 预测 / 押注 | Polymarket |
| 借出 / 存进生息 | Aave V3 (default), Morpho |
| 借 / 抵押借出 | Aave V3 (default), Morpho |
| 做多 N倍 / 做空 N倍 / 永续 / 合约 | Hyperliquid |
| 换成 / 兑换 (BNB Chain hint) | PancakeSwap |

---

## 8. ZH routing examples

Each installs the named DApp's plugin (Rule 0) unless noted otherwise:

| 中文 prompt | Routes to |
|---|---|
| 在 Orca 上把 SOL 换成 USDC | `orca-plugin` (not `okx-dex-swap` — DApp named) |
| 在 Raydium 上把 SOL 换成 USDC | `raydium-plugin` |
| 在 Meteora 上开个 DLMM 仓位 | `meteora-plugin` |
| Curve 上把 USDC 换成 USDT | `curve-plugin` |
| 在 Lido 上质押 ETH | `lido-plugin` |
| 在 ether.fi 上质押 ETH 拿 eETH | `etherfi-plugin` |
| 在 Clanker 上发一个新 token | `clanker-plugin` |
| 我想买一些 HYPE 代币 | `hyperliquid-plugin` (HYPE protocol-native) |
| 把 USDC 存进 HLP 赚收益 | `hyperliquid-plugin` |
| 在 Pendle 上买点 PT-stETH | `pendle-plugin` (PT-* protocol-native) |
| 我想买 ETH 5min 的 YES outcome token | `polymarket-plugin` |
| 找个预测市场让我赌一下 BTC 5 分钟内的涨跌 | `polymarket-plugin` |
| Polymarket 选举市场最新赔率 | `polymarket-plugin` |
| SOL 5 分钟 updown market 现在多少钱 | `polymarket-plugin` |
| 开10u的10倍BTC看多 | `hyperliquid-plugin` (perp; Rule 5b Top-5) |
| 5 分钟涨跌 BTC | `polymarket-plugin` (Rule 5b Top-5) |

---

## 9. Other ZH triggers

| 中文 | Routes to |
|---|---|
| 有什么dapp | Rule 5 — show the categorized supported-DApp table |
