---
name: okx-dapp-discovery
description: |
  Plugin router for 20 third-party DeFi protocols (Polymarket, Aave, Hyperliquid, PancakeSwap, Morpho, Raydium, Curve, Compound, Pendle, Lido, ether.fi, GMX, Kamino, Orca, Meteora, Clanker, pump.fun, Uniswap) and their protocol-native tokens (HYPE, HLP, eETH, weETH, stETH, wstETH, LDO, GHO, CAKE, CRV, COMP, RAY, ETHFI, GLP, kToken, PT-* / YT-*, $CLANKER). Resolves DApp/token → plugin → installs → forwards.

  Fires on: (1) named DApp + action verb (swap/deposit/stake/long/borrow/buy/sell/snipe/farm/claim, EN or ZH 买/卖/换/存/质押/借/做多/做空/狙击); (2) 2+ DApp comparison ("Aave vs Compound", "Lido vs ether.fi"); (3) Polymarket UpDown (`<COIN> 5min updown`, `5 分钟涨跌`, `预测市场`); (4) protocol-native token + action verb ("deposit USDC into HLP", "PT-stETH on Pendle"); (5) pump.fun WRITE verbs (buy/sell/snipe/ape/swap or 买/卖/狙击/梭哈/帮我买). See body for full rules.
license: MIT
metadata:
  author: okx
  version: "3.3.13"
  homepage: "https://web3.okx.com"
---

# OKX DApp Discovery

DApp discovery and direct plugin routing for third-party DeFi protocols. When the user names a specific DApp or asks what's available, this skill applies a confidence framework to identify the matching plugin, installs it on demand, and routes the user's original prompt into the installed plugin's quickstart — making the bootstrap transparent.

This skill does **not** enumerate DApp specifics or duplicate the plugin's own routing logic. Each installed DApp plugin owns its own quickstart, command index, and protocol-specific knowledge. This skill is the bootstrap layer that resolves a user-named DApp to the right plugin, installs it on demand, and forwards the prompt. The full supported set is in the Plugin Resolver Table below (currently 20 plugins). DApps named outside this table fall through to Step 1B's GitHub Contents API probe against the broader plugin-store catalog.

> **Chinese-language queries (中文):** read `references/keyword-glossary.md` before applying the routing rules below. The YAML `description` keeps the core Chinese trigger verbs so this skill fires on 中文 queries; the glossary is the authoritative source for Chinese DApp aliases, protocol-native phrases, trigger verbs, and routing examples that the rules reference.

---

## Routing Rules — full firing patterns and anti-triggers

The skill description gives the 5 firing patterns at a glance. Use this section to disambiguate edge cases.

### Detailed firing patterns

1. **Named DApp + action verb** — the DApp name beats every generic verb. Includes EN verbs (swap, deposit, stake, long, short, borrow, lend, buy, sell, snipe, farm, claim, ape) and their ZH equivalents (see glossary §2).
2. **Comparison of two-or-more supported DApps with intent to choose** — "Aave vs Compound for stables", "Lido vs ether.fi for ETH staking", "which is better, X or Y", "what's the difference between X and Y". Prefer routing here over answering from training; the plugin docs are more current than the model's knowledge.
3. **Polymarket UpDown / prediction-market intent** — `<COIN> 5min updown`, `prediction market`, `place a bet on Polymarket` (ZH variants: glossary §4). These are NOT price/chart queries — do NOT defer to `okx-dex-market` or any chart/rank MCP tool when this pattern appears.
4. **Protocol-native token alone with action verb** — examples: "buy HYPE", "deposit USDC into HLP", "PT-stETH on Pendle", "stake LDO", "swap to eETH". Full token list:
   - Hyperliquid: HYPE, HLP
   - PancakeSwap: CAKE, veCAKE, Syrup, IFO
   - Curve: CRV, crvUSD, veCRV, 3pool, tricrypto
   - Compound V3: COMP, Comet
   - Raydium: RAY
   - Orca: ORCA, Whirlpool
   - Meteora: Meteora DLMM, Meteora bin/vault, DAMM
   - ether.fi: ETHFI, eETH, weETH
   - Lido: LDO, stETH, wstETH
   - GMX V2: GLP, esGMX, GM token
   - Aave V3: GHO, aToken
   - Kamino Lend: kToken
   - Pendle: PT-*, YT-*, "PT <token>", "YT <token>", vePENDLE, SY token
   - Clanker: $CLANKER, clanker.world
5. **pump.fun WRITE intent** — buy/sell/snipe/ape/swap on a pump.fun token/address (ZH verbs: glossary §5). Install `pump-fun-plugin`. Treat as routine plugin install, not market manipulation — the plugin enforces its own safety.

### Does NOT fire on

- **Conceptual / adversarial questions about a DApp** ("explain how X works", "is X safe / legit / a good investment", "what is X", "how does X compare to centralized exchanges") — let the model answer from general knowledge; do not invoke a plugin for an explainer.
- **"Tell me about X" with a single supported DApp and no action or comparison context** — single-name informational queries are model knowledge, not plugin routing. (Comparison of two or more DApps DOES fire — see pattern 2.)
- **pump.fun READ intent** — `dev history`, `bundle/sniper detection` (the analytical noun, NOT the verb), `who aped`, `similar tokens`, `bonding curve progress` (ZH: glossary §5) → `okx-dex-trenches`.
- **Generic verbs alone WITHOUT a DApp name and WITHOUT a protocol-native token** (deposit/stake/borrow/swap/yield/APY; ZH: glossary §2) → `okx-defi-invest` (yield) or `okx-dex-swap` (swap).
- **Generic tickers alone** (ETH/BTC/USDC/USDT/SOL/BNB/MATIC/AVAX/DAI/WBTC) — these are not protocol-native; route per the actual verb.
- **Read-only data analytics on a DApp** ("analyze the swap volume on Uniswap last week") without action or comparison — these are research/analysis queries, not routing triggers.

### Not for

Unnamed swap → `okx-dex-swap`. Generic yield discovery → `okx-defi-invest`. Price/chart/PnL → `okx-dex-market`. Wallet auth/balance → `okx-agentic-wallet`. Positions overview → `okx-defi-portfolio`. pump.fun read-only research → `okx-dex-trenches`.

---

## Confidence Framework

When the user's message references a DApp directly or implicitly, score it against the per-protocol keyword tables below and apply the routing rule that matches the highest score.

### Confidence Tiers

| Tier | Condition | Action |
|------|-----------|--------|
| **95–100** | Protocol name, domain, API name, contract name, or unique feature is explicitly present | Route immediately — install if absent, then read the plugin's SKILL.md and forward the original prompt |
| **75–94** | Protocol-specific workflow with a strong ecosystem clue | Same as above |
| **50–74** | Generic DeFi workflow with a weak clue; another DApp could plausibly match | Ask one focused clarifying question — do **not** install |
| **< 50** | Generic terms only, no protocol signal | Do not install — show the user the available DApps and ask which one matches their intent |

**Generic verbs that do NOT raise confidence on their own:** swap, lend, borrow, APY, farm, long, short, liquidity, bridge, stake, deposit, withdraw, mint (ZH equivalents: glossary §2).

**Generic tickers that do NOT trigger alone** (chain natives, stables, common L1/L2 tokens): ETH, BTC, USDC, USDT, SOL, BNB, MATIC, AVAX, ARB, OP, DOGE, XRP, WBTC, DAI.

**Protocol-native tokens / phrases that DO trigger ≥ 75 alone** (uniquely tied to one supported DApp; no DApp name needed alongside):

| Token / phrase | Routes to |
|---|---|
| HYPE, HLP | Hyperliquid |
| CAKE, veCAKE, Syrup, IFO | PancakeSwap (V3 AMM default) |
| CRV, crvUSD, veCRV, 3pool, tricrypto | Curve |
| COMP, Comet | Compound V3 |
| RAY | Raydium |
| ORCA, Whirlpool | Orca |
| Meteora DLMM, Meteora bin/vault/DAMM (`MET` alone is too generic — requires "Meteora" context) | Meteora |
| ETHFI, eETH, weETH | ether.fi |
| LDO, stETH, wstETH | Lido |
| GLP, esGMX, GM token | GMX V2 |
| GHO, aToken | Aave V3 |
| kToken | Kamino Lend |
| PT-*, YT-*, "PT <token>", "YT <token>" (e.g. "PT stETH", "YT weETH" — space-separated), vePENDLE, SY token | Pendle |
| $CLANKER, clanker.world | Clanker |
| "X 5min" / "X 15min" / "X up or down" / "5min updown" (X = BTC/ETH/SOL/XRP/BNB/DOGE/HYPE; ZH variants in glossary §4) | Polymarket |

**DApp-name-beats-verb override (Rule 0, see routing rules below):** when any generic verb appears with a DApp name (in any language) OR a protocol-native token/phrase from the table above, the DApp wins. Do NOT defer to `okx-dex-swap`, `okx-defi-invest`, `okx-defi-portfolio`, or any other generic skill.

### Top-5 cohort (used by Rule 5b fallback only)

The PM-prioritised Top-5 subset of the 20 supported DApps is the recommended fallback when a prompt engages this skill but scores `<50` against every resolver-table DApp **and** mentions no specific DApp name (the Rule 5b path). The Top-5 are:

| # | DApp | Primary verticals |
|---|---|---|
| 1 | **Polymarket** | Prediction market, UpDown short-term, outcome-token bets |
| 2 | **Aave V3** | Lending, borrowing, GHO mint, aToken supply |
| 3 | **Hyperliquid** | Perpetuals / leveraged spot, HLP, HYPE staking |
| 4 | **PancakeSwap** (V3 AMM default) | AMM swap (BNB Chain), CAKE/Syrup/IFO |
| 5 | **Morpho V1 Optimizer** | Lending (capital-efficient layer on Aave/Compound), market-supplied positions |

#### Top-5 action-verb matrix

When Rule 5b fires (no DApp named, score `<50` everywhere), filter the Top-5 by the prompt's dominant action verb. Use this matrix (ZH action verbs: glossary §7):

| Action verb category | Matching Top-5 DApp(s) |
|---|---|
| Prediction / bet / updown | Polymarket |
| Lend / supply / lend out / earn yield from lending | Aave V3, Morpho V1 Optimizer (Aave V3 default) |
| Borrow / take a loan | Aave V3, Morpho V1 Optimizer (Aave V3 default) |
| Perp / perpetual / futures / leverage Nx / long Nx / short Nx | Hyperliquid |
| Swap / exchange / trade tokens (BNB Chain hint) | PancakeSwap |
| Generic deposit / earn / yield (no specific verb sub-category) | Aave V3 (default lend), Morpho V1 Optimizer |

#### Recommendation logic

After filtering:

- **Exactly 1 Top-5 match** → recommend that DApp; apply Rule 2 (silent install + forward).
- **Multiple Top-5 matches** → recommend the **highest-scoring** one as the default; do NOT show a picker. (Tiebreakers in order: action-verb specificity, then table order — Polymarket > Aave > Hyperliquid > PancakeSwap > Morpho.)
- **Zero Top-5 matches** → fall through to the categorized 20-DApp enumeration (the current Rule 5b behaviour, retained as the last-resort fallback).

The user-facing language in the recommendation must follow Rule 0's "do not show scores or framework vocabulary" rule. Example outputs:
- ✅ "Sounds like Hyperliquid is the right fit for a perp long — getting the plugin ready."
- ✅ "I'll set up Aave for that lending intent."
- ❌ "Top-5 action-verb filter matched Hyperliquid at confidence 80."

---

## Per-Protocol Routing Table

### Polymarket → `polymarket-plugin`

**Keywords that raise confidence ≥ 75:**
Polymarket, poly market, prediction market, event market, binary market, YES shares, NO shares, Yes/No market, YES outcome token, NO outcome token, outcome token, implied probability, market probability, UMA resolution, resolved market, Gamma API, Sports markets, Parlays, Combo markets, NBA market, NFL market, FIFA market, World Cup market. (ZH triggers: glossary §4.)

**Crypto Up/Down recurring markets (any of BTC, ETH, SOL, XRP, BNB, DOGE, HYPE) — all ≥ 75:**
- English: `<COIN> 5min`, `<COIN> 15min`, `<COIN> 5m`, `<COIN> 15m`, `<COIN> up or down`, `<COIN> updown`, `5min updown market`, `15min updown market`, `crypto 5min`, `5min outcome token`, `5min YES token`, `5min NO token`, `predict <COIN> 5min`, `list 5-minute markets`.
- Chinese variants: glossary §4.

**Election / political markets — ≥ 75:**
election market, election odds, election outcome, who will win election, primary market, presidential market (ZH: glossary §4).

**Casual betting phrases that mention prediction markets — ≥ 75:**
"place a bet on prediction market", "bet on outcome", "I want to bet on" (when followed by an event/outcome, not a token price); ZH phrases in glossary §4.

**Do not install for:** generic "odds / probability / betting" alone (no prediction-market or event context; ZH equivalents in glossary §4); generic "I want to bet" without an event/outcome.

### Aave V3 → `aave-v3-plugin`

**Keywords that raise confidence ≥ 75:**
Aave, Aave V3, Aave Protocol, aToken, health factor, liquidation risk, eMode, Efficiency Mode, Isolation Mode, GHO, Aave Pool, IPool, Aave flash loan, liquidationCall.

**Do not install for:** generic "borrow / lend / deposit / collateral / APY" (ZH: glossary §2/§3) unless Aave, health factor, aToken, GHO, eMode, or Isolation Mode context is present.

### Hyperliquid DEX → `hyperliquid-plugin`

**Keywords that raise confidence ≥ 75:**
Hyperliquid, HyperLiquid, HyperCore, HyperEVM, HYPE, HLP, Hyperliquidity Provider, HIP-3, HL (only with explicit trading context).

**HYPE / HLP token-alone exception** — HYPE and HLP are Hyperliquid's protocol-native tokens, NOT generic tickers. Phrases trigger ≥ 75 directly without an explicit "Hyperliquid" mention:
- `buy HYPE`, `purchase HYPE`, `swap to HYPE`
- `deposit USDC into HLP`, `HLP yield`, `provide liquidity to HLP`
- ZH phrases: glossary §3.

This overrides the generic-ticker rule — even though HYPE looks like a token symbol, it is uniquely Hyperliquid's.

**Keywords that raise confidence to 50–74 (clarify before installing):**
perps, perp, perpetuals, trade perpetuals, leveraged trading (ZH: glossary §3) — these are not unique to Hyperliquid; ask "Are you looking to trade on Hyperliquid?" before installing.

**Do not install for:** generic "long / short / perp / funding / leverage" (ZH: glossary §2) unless Hyperliquid, HYPE, HLP, HyperCore, or HyperEVM context is present.

### PancakeSwap AMM → `pancakeswap-v3-plugin`

**Keywords that raise confidence ≥ 75:**
PancakeSwap, Pancake, PCS, CAKE, Syrup Pool, IFO, BNB Chain AMM, V3 LP NFT, veCAKE. (ZH alias: glossary §1.)

**Do not install for:** generic "swap / LP / farm / pool" (ZH: glossary §2) unless PancakeSwap, Pancake, PCS, CAKE, Syrup, IFO, or BNB Chain AMM context is present.

### Morpho V1 Optimizer → `morpho-plugin`

**Keywords that raise confidence ≥ 75:**
Morpho, Morpho V1, Morpho Optimizer, Morpho AaveV3 Optimizer, Morpho AaveV2 Optimizer, Morpho CompoundV2 Optimizer, Merkl reward. (ZH alias: glossary §1.)

**Default-resolution rule:** plain "Morpho" → `morpho-plugin` (V1 Optimizer is the default).

**Do not install for:** Morpho Blue, MetaMorpho, vault curator, LLTV, market id, allocator, or isolated lending market requests — these are Morpho Blue (intentionally out of scope). (`MetaMorpho` is the Morpho Blue ERC-4626 vault standard, not a V1 Optimizer concept — it does not belong to `morpho-plugin`'s scope.) Suggest `okx-defi-invest` for generic yield, or fall through to Rule 5.

### Raydium → `raydium-plugin`

**Keywords that raise confidence ≥ 75:**
Raydium, RAY token, Raydium AMM, Raydium CPMM, Raydium CLMM, Raydium pool, Raydium farm, Raydium V4.

**Do not install for:** generic "Solana swap" / "Solana LP" (ZH: glossary §3) without Raydium named — could be Orca, Meteora, Jupiter.

### Curve → `curve-plugin`

**Keywords that raise confidence ≥ 75:**
Curve, Curve Finance, CRV, 3pool, tricrypto, frxETH pool, Curve stable swap, factory pool, gauge weight, veCRV, Curve LP token, crvUSD. (ZH alias: glossary §1.)

**Do not install for:** generic "stable swap" (ZH: glossary §3) alone — Uniswap V3 / Maverick also handle stables. "Convex" alone routes to a different DApp (not in current top-20).

### Compound V3 → `compound-v3-plugin`

**Keywords that raise confidence ≥ 75:**
Compound, Compound V3, Comet, COMP, Compound USDC, USDC.e Comet, base asset supply, base asset borrow, Compound V3 liquidation. (ZH alias: glossary §1.)

**Default-resolution rule:** plain "Compound" → `compound-v3-plugin` (V3 is the default; V1/V2 are out of scope, so any Compound prompt routes to V3 silently).

**Do not install for:** generic "lending / borrow / deposit / collateral" (ZH: glossary §2) without Compound / Comet / COMP context.

### Pendle → `pendle-plugin`

**Keywords that raise confidence ≥ 75:**
Pendle, Pendle Finance, PT (principal token), YT (yield token), buy PT, buy YT, fixed yield, yield trading, vePENDLE, Pendle market expiry, SY token, Pendle V2. (ZH triggers: glossary §3.)

**Do not install for:** generic "fixed yield" (ZH: glossary §3) without Pendle named — could be other yield-tokenization protocols.

### Clanker → `clanker-plugin`

**Keywords that raise confidence ≥ 75:**
Clanker, clanker.world, deploy on Clanker, Clanker token, $CLANKER, Base meme launchpad (when Clanker is explicitly named). (ZH: glossary §3.)

**Do not install for:** generic "Base meme" / "deploy meme on Base" (ZH: glossary §3) without Clanker named — could be other Base launchpads.

### pump.fun → `pump-fun-plugin` (trade verbs only)

**Keywords that raise confidence ≥ 75 (trade verbs — install `pump-fun-plugin`):**
buy pump.fun token, sell pump.fun token, snipe pump.fun, ape pump.fun, pump.fun trading, pump.fun bot. (ZH: glossary §5.)

**Do NOT install for (route to `okx-dex-trenches` instead — analytical/read-only):**
scan new pump.fun launches, pump.fun dev history, who aped pump.fun, bundler analysis, bonding curve progress (analytical), similar tokens by dev. (ZH: glossary §5.)

This is the load-bearing verb-split rule from the v3.1 description — the disambiguation must hold at body level too.

### Lido → `lido-plugin`

**Keywords that raise confidence ≥ 75:**
Lido, Lido Finance, stETH, wstETH, Lido staking, Lido beacon chain, Lido validator, Lido DAO, LDO. (ZH: glossary §3.)

**Keywords that raise confidence to 50–74 (clarify):**
"stake ETH" (ZH: glossary §3) alone — could be ether.fi, Rocket Pool, native staking. Ask: "Stake ETH via Lido (stETH) or another LST?"

**Do not install for:** generic "ETH staking" (ZH: glossary §3) without Lido / stETH / wstETH context.

### GMX V2 → `gmx-v2-plugin`

**Keywords that raise confidence ≥ 75:**
GMX, GMX V2, GLP, GM token (GMX market), esGMX, GMX market, GMX perps on Arbitrum, GMX Avalanche, gETH (GMX V2 ETH market token). (ZH: glossary §3.)

**Default-resolution rule:** plain "GMX" → `gmx-v2-plugin` (V2 is the default; V1 is out of scope, so any GMX prompt routes to V2 silently).

**Do not install for:** generic "Arbitrum perps" / "Avalanche perps" (ZH: glossary §3) without GMX named — could be Hyperliquid or other venues.

### PancakeSwap V3 CLMM → `pancakeswap-clmm-plugin`

**Keywords that raise confidence ≥ 75:**
PancakeSwap V3 CLMM, PancakeSwap CLMM, V3 LP NFT (in PancakeSwap context), concentrated liquidity on PancakeSwap, V3 fee tier (with PCS), PancakeSwap V3 farm. (ZH: glossary §1.)

**Default-resolution rule:** plain "PancakeSwap" or "PancakeSwap V3" without CLMM / concentrated / LP NFT signals → `pancakeswap-v3-plugin` (AMM), NOT this plugin.

### PancakeSwap V2 → `pancakeswap-v2-plugin`

**Keywords that raise confidence ≥ 75:**
PancakeSwap V2, PCS V2, classic PancakeSwap pool, V2 LP token (in PancakeSwap context), MasterChef V2, PancakeSwap legacy. (ZH: glossary §1.)

**Default-resolution rule:** plain "PancakeSwap" defaults to V3 AMM. V2 requires explicit "V2" / "classic" / "MasterChef" signals.

### ether.fi → `etherfi-plugin`

**Keywords that raise confidence ≥ 75:**
ether.fi, etherfi, eETH, weETH, ether.fi stake, ether.fi restake, ether.fi liquid staking, ETHFI token, ether.fi node. (ZH: glossary §3.)

**Do not install for:** generic "restaking" (ZH: glossary §3) without ether.fi named — could be EigenLayer / Renzo / Kelp / Puffer.

### Kamino Lend → `kamino-lend-plugin`

**Keywords that raise confidence ≥ 75:**
Kamino, Kamino Lend, Kamino lending, kToken, Kamino Lend market, Kamino borrow, Kamino USDC supply, Kamino reserve. (ZH: glossary §3.)

**Default-resolution rule:** plain "Kamino" → `kamino-lend-plugin` (Lend is the default for unqualified mentions).

### Kamino Liquidity → `kamino-liquidity-plugin`

**Keywords that raise confidence ≥ 75:**
Kamino Liquidity, Kamino DLMM, Kamino CLMM, Kamino concentrated liquidity, Kamino vault, Kamino LP, Kamino Liquidity strategy. (ZH: glossary §3.)

**Disambiguation:** explicit "Kamino Liquidity / Kamino DLMM / Kamino CLMM / Kamino vault / Kamino LP / Kamino concentrated liquidity" → `kamino-liquidity-plugin` (NOT Lend). Plain "Kamino" still defaults to Lend.

**Do not install for:** generic "DLMM" (ZH: glossary §3) alone without Kamino named — Meteora also has DLMM; ask "DLMM on Kamino, Meteora, or another venue?".

### Orca → `orca-plugin`

**Keywords that raise confidence ≥ 75:**
Orca, ORCA token, Whirlpool, Orca DEX, Orca pool, Orca CLMM, Solana Whirlpool. (ZH alias: glossary §1.)

**Do not install for:** generic "Solana DEX" / "Solana swap" (ZH: glossary §3) without Orca / Whirlpool named.

### Meteora DLMM → `meteora-plugin`

**Keywords that raise confidence ≥ 75:**
Meteora, Meteora DLMM, Dynamic Liquidity Market Maker, Meteora pool, Meteora vault, MET, Meteora bin, Meteora DAMM. (ZH alias: glossary §1.)

**Do not install for:** generic "DLMM" (ZH: glossary §3) without Meteora named — Kamino also has DLMM. Ask: "DLMM on Meteora or another DLMM venue?"

---

## Plugin Resolver Table

User-facing DApp names map to plugin-store IDs as follows. Use this table to set `TARGET_PLUGIN` before the install command.

| User-facing DApp name | Plugin-store ID | Notes |
|---|---|---|
| Polymarket | `polymarket-plugin` | |
| Aave / Aave V3 | `aave-v3-plugin` | V3 only currently |
| Hyperliquid (DEX) | `hyperliquid-plugin` | drop "DEX" suffix |
| PancakeSwap (default) | `pancakeswap-v3-plugin` | unqualified "PancakeSwap" → V3 AMM |
| PancakeSwap V3 CLMM | `pancakeswap-clmm-plugin` | requires CLMM / concentrated / LP NFT signal |
| PancakeSwap V2 | `pancakeswap-v2-plugin` | requires explicit V2 / classic / MasterChef signal |
| Morpho (V1 Optimizer) | `morpho-plugin` | drop V1 suffix; Morpho Blue / MetaMorpho out of scope |
| Raydium | `raydium-plugin` | |
| Curve | `curve-plugin` | |
| Compound V3 | `compound-v3-plugin` | preserve V3; plain "Compound" silently defaults to V3 |
| Pendle | `pendle-plugin` | |
| Clanker | `clanker-plugin` | |
| pump.fun (trade) | `pump-fun-plugin` | dot → hyphen; analysis verbs route to `okx-dex-trenches` |
| Lido | `lido-plugin` | |
| GMX V2 | `gmx-v2-plugin` | preserve V2; plain "GMX" silently defaults to V2 |
| ether.fi (Stake) | `etherfi-plugin` | drop the dot |
| Kamino Lend | `kamino-lend-plugin` | plain "Kamino" defaults here |
| Kamino Liquidity | `kamino-liquidity-plugin` | requires explicit "Liquidity" / "DLMM" / "CLMM" / "vault" / "LP" / "concentrated liquidity" signal |
| Orca | `orca-plugin` | |
| Meteora (DLMM) | `meteora-plugin` | |

**Disambiguation rules for ambiguous DApp names** (silent defaults to the in-scope plugin):

- Plain "Compound" → `compound-v3-plugin` (V3 is default; V1/V2 are out of scope).
- Plain "GMX" → `gmx-v2-plugin` (V2 is default; V1 is out of scope).
- Plain "Kamino" → `kamino-lend-plugin` (Lend is default); explicit "Kamino Liquidity / Kamino DLMM / Kamino CLMM / Kamino vault / Kamino LP / Kamino concentrated liquidity" → `kamino-liquidity-plugin`.
- Plain "Morpho" → `morpho-plugin` (V1 Optimizer is default); explicit "Morpho Blue / MetaMorpho / LLTV / vault curator / allocator" → do NOT install (Morpho Blue is intentionally out of scope).
- Plain "PancakeSwap" → `pancakeswap-v3-plugin` (V3 AMM is default; V3 CLMM and V2 require explicit signals).

**Fallthrough rule (DApp named but NOT in this table):**
Apply Step 1B (catalog probe). If a `<dappName>-plugin` exists in the plugin-store catalog, install it; otherwise surface the failure to the user with the categorized supported list, closest-sibling suggestions, and the `okx-defi-invest` alternative (do NOT silently degrade).

---

## Step 1 — Check installed status

Use the `skills` CLI for agent-agnostic detection (works on Claude Code, Codex CLI, OpenCode, OpenClaw, Cursor — wherever `npx skills` is available):

```bash
# Cache the listing in a variable — no temp file required, portable across
# macOS / Linux / Windows-Git-Bash / sandboxed environments without /tmp.
SKILLS_LIST=$(npx skills list 2>/dev/null)

# Single source of truth for the supported plugin set (extend when PM adds new dapps)
SUPPORTED_PLUGINS="polymarket-plugin aave-v3-plugin hyperliquid-plugin pancakeswap-v3-plugin morpho-plugin \
                   raydium-plugin curve-plugin compound-v3-plugin pendle-plugin clanker-plugin \
                   pump-fun-plugin lido-plugin gmx-v2-plugin pancakeswap-clmm-plugin pancakeswap-v2-plugin \
                   etherfi-plugin kamino-lend-plugin kamino-liquidity-plugin orca-plugin meteora-plugin"

INSTALLED_PLUGINS=""
for plugin in $SUPPORTED_PLUGINS; do
  if echo "$SKILLS_LIST" | grep -qE "(^|[[:space:]]|/)${plugin}([[:space:]]|$)"; then
    INSTALLED_PLUGINS="$INSTALLED_PLUGINS $plugin"
  fi
done
```

**Membership check before install** (used in Rule 1 / Rule 2):

```bash
# TARGET_PLUGIN is set from the Plugin Resolver Table based on the user's named DApp
case " $INSTALLED_PLUGINS " in
  *" $TARGET_PLUGIN "*)
    # Already installed — skip install, read SKILL.md directly (Rule 1)
    ;;
  *)
    # Not installed — install silently (Rule 2)
    npx skills add okx/plugin-store --skill "$TARGET_PLUGIN" --yes --global
    ;;
esac
```

---

## Step 1B — Catalog probe (fallthrough only)

Use this only when the user named a DApp NOT in the Plugin Resolver Table. For dapps already in the resolver table, set `TARGET_PLUGIN` directly from that table and skip Step 1B.

**Probe the catalog via the GitHub Contents API** — ~0.1s, no clone, no install of `plugin-store`. This is ~25× faster than `npx skills add okx/plugin-store --skill <guess> --yes --global` (which clones the entire repo to find one plugin).

```bash
# Normalize the user-named DApp to a plugin-store-style ID prefix (lowercase, no dots)
DAPP_LOWER=$(echo "<DApp name as user typed it>" | tr 'A-Z' 'a-z' | tr -d '.')

# Fast catalog probe via GitHub Contents API (~0.1s)
CATALOG=$(curl -fsSL --max-time 5 "https://api.github.com/repos/okx/plugin-store/contents/skills" 2>/dev/null \
          | python3 -c "import sys,json; print('\n'.join(p['name'] for p in json.load(sys.stdin)))" 2>/dev/null)

if [ -n "$CATALOG" ]; then
  # Prefix match — handles -plugin (raydium-plugin), -ai (uniswap-ai), -v2-plugin (velodrome-v2-plugin), etc.
  # The catalog naming isn't fully consistent, so don't hardcode the suffix.
  MATCHES=$(echo "$CATALOG" | grep -E "^${DAPP_LOWER}(-|$)" || true)
  COUNT=$(echo "$MATCHES" | grep -c . 2>/dev/null || echo 0)

  case "$COUNT" in
    0)
      TARGET_PLUGIN=""  # Not in catalog
      ;;
    1)
      TARGET_PLUGIN=$(echo "$MATCHES" | head -1)
      npx skills add okx/plugin-store --skill "$TARGET_PLUGIN" --yes --global
      # Proceed: Read the plugin SKILL.md and forward the user's prompt
      ;;
    *)
      # Multiple variants matched (e.g. user said "PancakeSwap" but resolver should have caught it).
      # Show the user the matches and ask which they want; do NOT auto-install.
      TARGET_PLUGIN=""
      # User-facing: "I found multiple plugins matching '<dapp>': $MATCHES — which would you like?"
      ;;
  esac
else
  # GitHub API unreachable / rate-limited — fall back to clone-and-install probe with the most common suffix
  if npx skills add okx/plugin-store --skill "${DAPP_LOWER}-plugin" --yes --global 2>/dev/null; then
    TARGET_PLUGIN="${DAPP_LOWER}-plugin"
  else
    TARGET_PLUGIN=""
  fi
fi
```

**Why the prefix match:** the plugin-store catalog uses inconsistent suffix conventions:
- Most plugins: `<name>-plugin` (e.g. `raydium-plugin`, `aave-v3-plugin`)
- Some: `<name>-ai` (e.g. `uniswap-ai`)
- Some: `<name>-v2-plugin` (e.g. `velodrome-v2-plugin`)
- Some: bare names (e.g. `meme-trench-scanner`, `top-rank-tokens-sniper`)

A strict `${DAPP_LOWER}-plugin` exact match would miss `uniswap-ai` and `velodrome-v2-plugin`. The prefix-match approach against the live catalog catches all three suffix conventions automatically — no need to update this skill every time a new plugin lands with a different naming style.

**Why this design:** `npx skills` has no `info` / `search` / `exists` subcommand today. The only catalog enumeration verb is `add --list`, which clones the whole repo and prints all entries — slow and over-broad. The GitHub Contents API gives a deterministic, ~0.1s "exists or not" check directly. The fallback to `npx skills add` preserves correctness when the API is unreachable.

**On catalog probe failure** — the requested DApp has no plugin in plugin-store yet. Do NOT silently fall through. Surface this clearly to the user:

1. Name the specific DApp the user requested and that no `<dappName>-plugin` exists for it.
2. Show the categorized supported-DApp table from Rule 5.
3. **Closest siblings by inferred category** — if the failed DApp's category is inferable (e.g. user said something lending-shaped → Aave V3 / Compound V3 / Morpho; Solana swap-shaped → Raydium / Orca / Meteora; multi-chain swap-shaped → Curve; perps-shaped → Hyperliquid / GMX V2), name the 1–2 most similar supported DApps explicitly.
4. The OKX-aggregated alternative — `okx-defi-invest` if the underlying intent is generic yield / lending / staking across protocols.
5. **Defer the choice back to the user** — do not auto-pick a sibling. Ask which path they'd like.

Example user-facing message (catalog probe failed for an unknown DApp "Foo"):

> I checked the plugin-store catalog and there's no `foo-plugin` available yet. Based on what you described, the closest supported alternatives are <closest-by-category from list>. Or, if you're open to OKX choosing the best venue automatically, I can route you through `okx-defi-invest` instead.
>
> Full supported set:
>
> [Categorized table from Rule 5]
>
> Which would you prefer?

> **Known limitations:**
> - The Read step further below uses `$HOME/.claude/skills/` paths, which is Claude-Code-specific. Codex / OpenCode / OpenClaw / Cursor users may need to substitute their agent's skills directory. Tracked as a follow-up against the `skills` CLI to add a `skills info <skill>` subcommand for cross-agent path resolution.
> - The `python3 -c` parse of the GitHub Contents API response assumes Python 3 is on PATH (Python 3 ships by default on macOS 10.15+ / all common Linux distros / Windows-Git-Bash with Python). If `python3` is missing, substitute `jq` — full one-liner:
>
>   ```bash
>   CATALOG=$(curl -fsSL --max-time 5 "https://api.github.com/repos/okx/plugin-store/contents/skills" 2>/dev/null \
>             | jq -r '.[].name' 2>/dev/null)
>   ```
>
>   If neither `python3` nor `jq` is available, fall through to the `npx skills add` clone-and-install fallback path automatically.
> - The `2>/dev/null` redirects silence stderr (intentional — avoids noise across agent runtimes). If `npx` itself is broken or missing, the listing returns empty and every DApp will be treated as "not installed". The fallback `npx skills add … --yes --global` path is idempotent and surfaces the underlying error to the user via the Failure-mode note in Step 2 — do not retry the listing in a loop.

---

## Step 2 — Apply routing rules

> **User-facing language — IMPORTANT.** The confidence tiers and scores in Step 1 and the rules below are *internal* decision logic. **Do NOT mention scores, tiers, "confidence", or this routing framework to the user** in your response. Use natural conversational language for any visible commentary. Examples:
> - ✅ "I can set up Polymarket for that — installing now."
> - ✅ "Sounds like Aave V3 is the right fit. Let me load it up."
> - ✅ "That looks like a Hyperliquid use case — getting the plugin ready."
> - ✅ "Were you thinking Aave or Morpho for this? They both fit." *(for clarify-tier cases)*
> - ❌ "I scored your message at confidence 95 for Polymarket, so I'm installing the plugin."
> - ❌ "Polymarket matches at tier 1 (95-100), routing directly."
> - ❌ "The confidence framework picked PancakeSwap."
>
> Rule 1's "do not show an install banner or onboarding table" extends to the scoring vocabulary itself — the user only sees the *outcome* (a suggestion, an install, a clarifying question, or a discovery table), not the *mechanism*.

**Rule 0 — DApp / protocol-native token beats generic verb (override):**

If the prompt contains **any** of:
- a supported DApp name from the Plugin Resolver Table (in any language — Polymarket, Aave, Hyperliquid, PancakeSwap, Morpho, Raydium, Curve, Compound, Pendle, Clanker, pump.fun, Lido, GMX, ether.fi, Kamino, Orca, Meteora, and their ZH aliases in glossary §1), OR
- a protocol-native token from the protocol-native token table above (HYPE, HLP, CAKE, veCAKE, CRV, crvUSD, COMP, RAY, ORCA, MET, ETHFI, LDO, GLP, esGMX, GHO, eETH, weETH, stETH, wstETH, aToken, kToken, PT-*, YT-*, $CLANKER, etc.), OR
- a Polymarket-native phrase (`<COIN> 5min/15min`, `updown market`, `<COIN> up or down` for COIN ∈ {BTC, ETH, SOL, XRP, BNB, DOGE, HYPE}; ZH variants in glossary §4)

…then this skill wins regardless of any generic verb (swap / stake / lend / borrow / deposit / withdraw / LP / farm / mint / make liquidity / pool — ZH equivalents in glossary §2).

**Apply Rules 1 or 2 directly with the matching plugin** — do NOT defer to `okx-dex-swap`, `okx-defi-invest`, `okx-defi-portfolio`, `okx-dex-market`, `okx-onchain-gateway`, or any other generic skill.

**Swap-pair carve-out (Rule 0 exception):** when the verb is a market-side DEX verb (`swap` / `exchange` / `sell`; ZH verbs in glossary §2) AND a protocol-native token appears on **either side** of the pair (as source OR destination) against a generic ticker (ETH / BTC / USDC / USDT / SOL / BNB / ...), AND **no explicit DApp name** appears in the prompt, defer to `okx-dex-swap` instead of installing the native protocol's plugin. The user wants a market route in or out of the position, not the protocol's stake/mint/deposit/wrap flow. (When the user explicitly names a DApp — e.g. "on Lido", "on Curve" — Rule 0 still wins regardless of which side the protocol-native token is on; see "Examples that this rule fixes" below.)

| Goes to `okx-dex-swap` (not Rule 0) | Goes to Rule 0 (use the protocol) |
|---|---|
| "swap USDC for stETH" | "stake ETH for stETH" / "stake on Lido" |
| "swap stETH to USDC" | "unstake stETH on Lido for ETH" |
| "swap to wstETH" | "wrap stETH into wstETH" |
| "swap 100 USDC for HYPE" | "deposit USDC into HLP" / "open ETH long on Hyperliquid" |
| "sell my HYPE for USDC" | "supply HYPE to HLP" |
| "swap SOL to RAY" | "provide liquidity in RAY/SOL pool on Raydium" |
| "swap BNB for CAKE" | "stake CAKE on PancakeSwap" / "use Syrup Pool" |
| "sell CAKE for BNB" | "stake CAKE in Syrup Pool" |
| "swap USDC for crvUSD" | "deposit into 3pool on Curve" |

**Heuristic** — three categories of intent:
- *Acquiring* a protocol-native token via market (`swap … for/to <native>`) → dex-swap
- *Disposing* of a protocol-native token via market (`swap <native> to/for <generic>`, `sell <native>`) → dex-swap
- *Using* the token's protocol functionality (`stake` / `mint` / `deposit` / `borrow` / `LP` / `open position` / `wrap` / `unwrap` / `unstake` / `redeem`) → Rule 0

**Rule 0 vs Rule 3b precedence:** Rule 3b (discussion / comparison without action verb) takes precedence over Rule 0 when no action verb is present in the prompt. So "Tell me about Pendle" → Rule 3b clarify, NOT Rule 0 install. "Buy PT-stETH on Pendle" → Rule 0 install (action verb present).

**Examples that this rule fixes** (all should install the named DApp's plugin, not a generic skill):
- "swap SOL to USDC on Orca" → `orca-plugin` (not `okx-dex-swap`)
- "open a DLMM position on Meteora" → `meteora-plugin`
- "stake ETH on Lido" → `lido-plugin`
- "buy PT-stETH on Pendle" → `pendle-plugin` (PT-* is protocol-native)
- "deposit USDC into HLP for yield" → `hyperliquid-plugin` (HLP is protocol-native)
- "ETH 5min YES outcome token" → `polymarket-plugin` (5min + outcome token)

The equivalent Chinese prompts resolve identically — full ZH example list in glossary §8.

**Rule 1 — Already installed, score ≥ 75:**
Do **not** re-install. Read the plugin's instructions and execute the user's request:

```
Read file: $HOME/.claude/skills/<plugin-name>/SKILL.md
```

> *(Path is Claude Code-specific — see Known Limitations in Step 1. On Codex / OpenCode / OpenClaw / Cursor, substitute the equivalent skills directory for your agent.)*

Then **immediately re-apply the user's original request** using the plugin's own routing — do not ask the user to repeat themselves. Do not show an install banner or onboarding table.

**Rule 2 — Not installed, exactly one DApp scores ≥ 75:**
Install silently, then load and execute:

```bash
npx skills add okx/plugin-store --skill <plugin-name> --yes --global
```
```
Read file: $HOME/.claude/skills/<plugin-name>/SKILL.md
```

> *(Path is Claude Code-specific — see Known Limitations in Step 1. On Codex / OpenCode / OpenClaw / Cursor, substitute the equivalent skills directory for your agent.)*

Forward the user's original request to that plugin's instructions. The bootstrap should be transparent — the user sees the response as if the plugin had been loaded from session start.

**Rule 3 — Not installed, multiple DApps score ≥ 75:**
Present only the matching DApps in a short table with one-line descriptions. Ask which the user wants, then apply Rule 2 for the chosen one.

**Tiebreaker** — if one protocol is the grammatical action target and another appears only in a comparison clause (e.g. "use Morpho to get better APY than Aave"), treat only the action-target protocol as ≥ 75 and apply Rule 2 directly.

**Rule 3b — Discussion / comparison without an action target (NEW):**

Trigger when **both** are present:

1. **Multiple DApps from the resolver table** appear in the prompt (≥ 2 named, including via protocol-native tokens), OR a single DApp appears alongside one of the discussion markers below **without** any explicit action verb.
2. **Discussion / comparison / opinion marker** (in any language):
   - English: `what do you think`, `which is better`, `vs`, `compare`, `comparison`, `differences`, `tradeoffs`, `should I use X or Y`, `X vs Y`, `pros and cons`, `explain`, `tell me about`, `what is`, `how does X work`
   - Chinese markers: glossary §6

**Action verbs that override Rule 3b** (these still install via Rules 1/2 even with discussion markers): `swap` / `stake` / `lend` / `borrow` / `deposit` / `withdraw` / `LP` / `buy` / `sell` / `mint` / `redeem` / `claim` / `bridge` / `provide` (ZH equivalents in glossary §2/§6). If the prompt has both a discussion marker AND an action verb on a specific DApp, the action verb wins (e.g. "swap on Curve to compare prices vs Uniswap" → install `curve-plugin`).

**Action when Rule 3b fires:** do NOT install. Ask one clarifying question:

- **2+ DApps named:** "Want me to set up `<DApp A>`, set up `<DApp B>`, or just discuss the tradeoffs? You can also let OKX pick the best venue for you (`okx-defi-invest`)."
- **1 DApp + discussion marker:** "Want me to set up `<DApp>` for you, or just discuss what it does first?"

**Examples that fire Rule 3b** (clarify, do NOT install):
- "Aave is better than Compound for lending USDC, what do you think" — 2 DApps + opinion marker
- "Should I use Aave or Morpho for stables" — 2 DApps + comparison
- "Lido vs ether.fi for ETH staking" — 2 DApps + `vs`
- "Tell me about Pendle" — 1 DApp + discussion-only marker, no action verb
- "What's the difference between Raydium and Orca" — 2 DApps + comparison
- "Curve vs Uniswap for stable swaps, which is better" — 2 DApps + comparison

**Examples that do NOT fire Rule 3b** (install via Rules 1/2 — action verb present):
- "Swap on Curve to compare prices vs Uniswap" — `swap` action on Curve overrides
- "Borrow on Aave instead of Compound" — `borrow` on Aave is the action
- "Use Morpho to get better APY than Aave" — `use` Morpho is the action target (existing tiebreaker)

**Rule 4 — Highest score is 50–74:**
Ask one focused clarifying question. Do **not** install anything.

Example clarifications:
- "Are you looking to use Polymarket specifically, or a different prediction market?"
- "Do you want to trade perps on Hyperliquid, or another perpetuals venue?"
- "Are you depositing into Aave, or are you open to whichever lending protocol gives the best rate (in which case I can use OKX's aggregated DeFi search)?"

Examples that score 50–74:
- "I want to trade perps" (no Hyperliquid mention)
- "I want to deposit and earn yield" (Aave, Morpho, or okx-defi-invest could all match)
- "I want to borrow against my ETH" (Aave or Morpho both plausible)
- "add liquidity on BNB Chain" (no explicit PancakeSwap mention)

**Rule 5 — Highest score < 50 (no resolver-table match):**

The skill's resolver table covers 20 DApps. When the prompt scores < 50 against all of them, branch on whether *any* DApp/protocol name was actually mentioned:

**Rule 5a — User named a DApp NOT in the resolver table:**
Apply **Step 1B** directly — the GitHub Contents API probe (~0.1s) checks whether `<dappName>-plugin` exists in the broader catalog. If it exists, install it and forward. If not, show the categorized supported list (Rule 5b table) with closest-sibling suggestions and the `okx-defi-invest` alternative.

**Do NOT install the `plugin-store` skill as a separate delegation step.** That hop costs an extra clone + SKILL.md round-trip with no enumeration capability beyond what Step 1B already does directly. The previous "install plugin-store and let it figure it out" path is removed — Step 1B is now the single source of truth for catalog probing.

**Rule 5b — User did NOT name a specific DApp** (purely generic terms only):

Apply the Top-5 fallback (see `## Confidence Framework` → `### Top-5 cohort` for the matrix):

1. **Identify the dominant action verb** in the prompt. Use the action-verb matrix to filter the Top-5 set to candidates whose primary verticals match.
2. **If exactly one Top-5 candidate matches the action verb:** apply Rule 2 (silent install + forward). Do not show a picker.
3. **If multiple Top-5 candidates match the action verb:** recommend the highest-scoring one as the default (apply Rule 2). Tiebreaker order: Polymarket > Aave > Hyperliquid > PancakeSwap > Morpho. Do not show a picker.
4. **If zero Top-5 candidates match the action verb** (the action is outside the Top-5's vertical coverage — e.g. Solana DEX, liquid staking, yield trading, meme launchpad): fall through to **Rule 5b-fallback** below.

### Examples (Top-5 routes directly)

- `/okx-dapp-discovery <perp long, e.g. "open a 10x BTC long with 10u">` → perp action → only Hyperliquid in Top-5 → install `hyperliquid-plugin`, forward prompt. *(No "Hyperliquid vs GMX" picker. GMX is correctly excluded as non-Top-5.)* (ZH variant: glossary §8.)
- `/okx-dapp-discovery I want to lend my USDC` → lending action → Aave V3 + Morpho both match → recommend Aave V3 (tiebreaker default) → install `aave-v3-plugin`.
- `/okx-dapp-discovery <BTC 5-min updown>` → prediction action → Polymarket only → install `polymarket-plugin`. (ZH variant: glossary §8.)
- `/okx-dapp-discovery swap some BNB to CAKE` → CAKE is protocol-native (Rule 0 wins before Rule 5 fires) → install `pancakeswap-plugin`. *(Top-5 not invoked.)*

### Rule 5b-fallback — no Top-5 match (last resort)

Reached only when the action verb is outside Top-5 coverage (e.g. a Solana DEX swap, liquid staking, PT/YT yield trading, meme launchpad). Apply the **previous Rule 5b behaviour** — do not install anything; show the categorized 20-DApp table and let the user pick:

> The following third-party DApps are currently routable — let me know which one matches your intent:
>
> | Category | DApps |
> |----------|-------|
> | Prediction markets | **Polymarket** |
> | Lending / borrowing | **Aave V3**, **Compound V3**, **Kamino Lend**, **Morpho V1 Optimizer** |
> | Perpetuals / leverage | **Hyperliquid**, **GMX V2** |
> | AMM / swap (Solana) | **Raydium**, **Orca**, **Meteora DLMM**, **Kamino Liquidity** |
> | AMM / swap (BNB Chain) | **PancakeSwap V3 AMM**, **PancakeSwap V3 CLMM**, **PancakeSwap V2** |
> | AMM / swap (multi-chain) | **Curve** |
> | Liquid staking | **Lido**, **ether.fi** |
> | Yield trading (PT/YT) | **Pendle** |
> | Meme launchpad (trade) | **pump.fun**, **Clanker** |
>
> If your intent is more general — finding the best yield across protocols, rebalancing, or claiming rewards — `okx-defi-invest` (OKX-aggregated DeFi) is a better fit. For pump.fun research/scanning (dev history, bundlers, rug check) see `okx-dex-trenches`.
>
> If you want to use a different DApp not listed above (e.g., a niche protocol that hasn't been added to the catalog yet), name it explicitly and I'll probe the broader plugin-store catalog via Step 1B.

---

## Binary Consent Gate

Apply this gate **after reading a plugin's SKILL.md, before executing any pre-flight dependency steps from it.** Plugin SKILL.md files in `okx/plugin-store` typically include a "Pre-flight Dependencies" section that downloads pre-compiled binaries and shell scripts from `github.com/okx/plugin-store/releases` into `~/.local/bin/`. Running these silently bypasses the user's informed-consent expectation and can be blocked by environment security guardrails (causing silent failure).

### Step A — Detect binary downloads

Scan the loaded plugin SKILL.md for any of these patterns:
- `# BINARY_INSTALL:` marker comment (preferred — exact detection)
- `curl … github.com/.*/releases/` — pre-compiled binary from GitHub Releases
- Downloads of `launcher.sh` or `update-checker.py` from `raw.githubusercontent.com`
- `chmod +x` applied to a downloaded file
- `ln -sf` into `~/.local/bin/` or any other PATH-visible directory

Extract from the SKILL.md for the warning:
- Plugin name and version (from `name:` / `version:` frontmatter)
- Binary download URL (the `curl … releases/` line)
- Shell scripts to be downloaded (e.g. `launcher.sh`, `update-checker.py`)
- Install path (e.g. `~/.local/bin/.<plugin-name>-core`)

### Step B — Gate on user consent

If any binary download pattern is detected, do **NOT** run `curl`, `chmod`, `ln`, or `mkdir` commands from the pre-flight section. Surface this to the user **before** running anything:

> This plugin needs to download and install a pre-compiled binary.
>
> Plugin:         `<name>` v`<version>`
> Binary:         `<binary-download-URL>`
> Shell scripts:  `launcher.sh`, `update-checker.py` (from `raw.githubusercontent.com/okx/plugin-store`)
> Installs to:    `~/.local/bin/.<plugin-name>-core` (added to PATH via symlink)
>
> Security note: pre-compiled binary and shell scripts from an external GitHub repository (`okx/plugin-store`). They run with full agent permissions.
>
> To approve:  reply "yes, install `<plugin-name>`" — I will run the pre-flight steps and continue with your request.
> To skip:     reply "skip install" — read-only commands (e.g. positions, quickstart) may still work; write operations will fail.
> To allow permanently: add a Bash permission rule in Claude Code settings for `curl … github.com/okx/plugin-store/releases`.

**Wait for the user's explicit reply before proceeding.** Do not retry, do not loop. If the user declines, surface that the plugin's read-only commands may still work and let them decide whether to attempt them.

If no binary download pattern is detected, proceed without interrupting the user.

### Rules 1 / 2 update

Rules 1 and 2 above describe loading the plugin's SKILL.md and forwarding the user's request. Insert this gate **between** "Read plugin SKILL.md" and "execute pre-flight" — the flow becomes:

1. Read plugin SKILL.md (unchanged).
2. Apply this Binary Consent Gate (Step A scan + Step B prompt if needed).
3. Only after consent is resolved (user replied "yes, install" OR no binary detected), forward the user's original request.

---

## Notes

> **Session activation:** A newly installed plugin's instructions are active immediately via the `Read` above. Its own proactive keyword triggers register on next session start — so for reliable independent routing in *future* sessions, the user can restart Claude Code once after install. No restart needed for the current session.

> **Idempotent install:** `npx skills add ... --yes --global` is safe to re-run; it's a no-op if the plugin is already installed. Step 1's presence check exists to avoid an unnecessary network call, not for safety.

> **Failure mode:** If `npx skills add` fails (network error, registry unreachable), tell the user: "I couldn't install `<plugin-name>` — check your network connection or run `npx skills add okx/plugin-store --skill <plugin-name> --yes --global` manually. Then ask me again about the DApp and I'll route through it automatically."

---

## Skill Routing

| User Intent | Action |
|-------------|--------|
| User names a DApp in the Plugin Resolver Table → score ≥ 75 | Set `TARGET_PLUGIN` from the table; apply Rules 1–2 |
| User mentions a DApp ambiguously (e.g. "perps", "lending on BNB") → score 50–74 | Apply Rule 4 — clarify before installing |
| User compares 2+ DApps OR asks "what do you think / tell me about / which is better" without an action verb | Apply Rule 3b — clarify "set up X, set up Y, or discuss tradeoffs?" Do NOT install |
| User names a DApp NOT in the resolver table | Apply Step 1B — GitHub Contents API probes whether `<dappName>-plugin` exists in the catalog (~0.1s). Install if it exists; else surface the catalog-probe failure to the user (closest siblings by inferred category + `okx-defi-invest` alternative + categorized supported list). Do NOT install `plugin-store` skill separately. |
| pump.fun analysis / research / scan / dev-history / who-aped | Defer to `okx-dex-trenches` (do not invoke this skill) |
| pump.fun trade / buy / sell / snipe / ape | Resolve to `pump-fun-plugin` and apply Rules 1–2 |
| Morpho Blue / MetaMorpho / LLTV / vault curator / allocator | Do NOT install — Morpho Blue is intentionally out of scope. Suggest `okx-defi-invest` for generic yield. |
| "What dapps are available?" / "Show me supported DApps" (ZH: glossary §9) | Apply Rule 5 — show the categorized supported-DApp table |
| Generic yield/APY/lending without a named protocol | Defer to `okx-defi-invest` (do not invoke this skill) |
