# Risk Token Detection

`onchainos security token-scan` — batch token risk and honeypot detection across all supported chains.

## 3-Path Decision Tree

### Path 1 — Agentic Wallet (loggedIn: true), scanning own wallet

Two-step flow — always fetch balance first, then scan:

**Step 1**: Fetch authenticated wallet holdings:
```bash
onchainos wallet balance          # all chains
onchainos wallet balance --chain <chain>   # specific chain
```

**Step 2**: Extract non-native ERC-20 / SPL tokens from the response (skip native tokens like ETH/SOL/OKB — they have no contract address). Then scan:
```bash
onchainos security token-scan --tokens "<chainIndex>:<contractAddress>,..."
```

- **Single token by name**: Search with `onchainos token search <name>`, confirm address, then use `--tokens`.
- Fall through to Path 3 if user provides an explicit address directly.

### Path 1b — Agentic Wallet (loggedIn: true), scanning a DIFFERENT address

The target address is not the user's own wallet — use public portfolio query instead:

**Step 1**: Fetch holdings of the target address via `portfolio all-balances`:
```bash
# EVM address
onchainos portfolio all-balances --address <target_evm_addr> --chains "1,56,137,42161,8453,196,43114,10" --filter 1

# Solana address (if applicable)
onchainos portfolio all-balances --address <target_sol_addr> --chains "501" --filter 1
```

Display a summary table of holdings to the user before scanning.

**Step 2**: Extract non-native ERC-20 / SPL tokens, then scan:
```bash
onchainos security token-scan --tokens "<chainIndex>:<contractAddress>,..."
```

### Path 2 — No Agentic Wallet (not logged in), user provides wallet address

Two-step flow — fetch public address balance first, then scan:

**Step 1**: Fetch public address holdings. Query EVM and Solana addresses separately:
```bash
# EVM address (all supported chains)
onchainos portfolio all-balances --address <evm_addr> --chains "1,56,137,42161,8453,196,43114,10" --filter 1

# Solana address (if user has one)
onchainos portfolio all-balances --address <sol_addr> --chains "501" --filter 1
```

Display a summary table of holdings to the user before scanning.

**Step 2**: Extract non-native ERC-20 / SPL tokens, then scan:
```bash
onchainos security token-scan --tokens "<chainIndex>:<contractAddress>,..."
```

If the user wants to create an Agentic Wallet instead, guide through login then use Path 1.

### Path 3 — Explicit chainId:contractAddress

```bash
onchainos security token-scan --tokens "<chainId>:<contractAddress>[,...]"
```

If user provides name/symbol instead, search first with `onchainos token search`, confirm, then use `--tokens`.

## Parameters (explicit `--tokens` mode)

| Param | Required | Description |
|---|---|---|
| `--tokens` | Yes | Comma-separated `chainId:contractAddress` pairs (max 50). Chain can be name or ID (e.g. `ethereum:0x...` or `1:0x...`) |

> **Internal mechanism**: All three modes ultimately call the same `/api/v6/security/token-scan` endpoint with `{tokenList: [{chainId, contractAddress}]}`. The `--address` and no-flags modes first query the balance API to obtain the contract address list, then batch-scan (max 50 per batch, concurrent execution). The `--tokens` mode passes contract addresses directly, skipping the query step. **Native tokens (ETH/BNB/SOL/OKB etc.) are skipped in all modes** because their `tokenContractAddress` is empty.

## Scan Modes

| Mode | When to use | Command |
|------|-------------|---------|
| `--tokens` | **Primary mode** — used after fetching balance in Path 1 / 2 | `onchainos security token-scan --tokens "<chainId>:<addr>[,...]"` |
| No flags | Agentic Wallet shortcut (skips explicit balance step) | `onchainos security token-scan [--chain <chain>]` |
| `--address` | Public address shortcut (skips explicit balance step) | `onchainos security token-scan --address <addr> [--chain <chain>]` |

> **Recommended: use `--tokens` mode.** First fetch holdings via `wallet balance` (logged in) or `portfolio all-balances` (not logged in) to display the portfolio to the user, then construct the `--tokens` parameter from that data. This way the user can see their holdings before scanning.
>
> **Note: Native tokens (ETH / BNB / SOL / OKB etc.) are silently skipped.** Native tokens have no contract address and cannot be scanned by token-scan. Only pass ERC-20 / SPL contract token addresses to `--tokens`. If the user explicitly wants to verify native token safety, use `dapp-scan` or `tx-scan` with the specific transaction data.

## Return Fields

| Field | Type | Description |
|---|---|---|
| `chainId` | String | Chain ID |
| `tokenAddress` | String | Token contract address |
| `isChainSupported` | Boolean | Whether the chain supports security scanning |
| `riskLevel` | String | Overall token risk level. Values: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `buyTaxes` | String\|null | Buy tax percentage (null = unknown) |
| `sellTaxes` | String\|null | Sell tax percentage (null = unknown) |
| `isHoneypot` | Boolean | Honeypot — cannot sell after buying |
| `isRubbishAirdrop` | Boolean | Garbage/spam airdrop token |
| `isAirdropScam` | Boolean | Gas-mint scam — steals gas fees |
| `isHasAssetEditAuth` | Boolean | Privileged address with asset edit authority (Solana) |
| `isLowLiquidity` | Boolean | Low liquidity |
| `isDumping` | Boolean | Dumping — large sell-off detected |
| `isLiquidityRemoval` | Boolean | Liquidity removal detected |
| `isPump` | Boolean | Pump — artificial price inflation |
| `isWash` | Boolean | Wash trading detected |
| `isFakeLiquidity` | Boolean | Fake/artificial liquidity |
| `isWash2` | Boolean | Wash trading detected (third-party vendor) |
| `isFundLinkage` | Boolean | Rugpull gang linkage detected |
| `isVeryLowLpBurn` | Boolean | Very low LP burn ratio |
| `isVeryHighLpHolderProp` | Boolean | LP holder concentration is very high |
| `isHasBlockingHis` | Boolean | Has history of freezing addresses |
| `isOverIssued` | Boolean | Token over-issued beyond stated supply |
| `isCounterfeit` | Boolean | Counterfeit — impersonates a well-known token |
| `isNotOpenSource` | Boolean | Token contract source code is not open-source |
| `isMintable` | Boolean | Token supply can be increased (mintable) |
| `isHasFrozenAuth` | Boolean | Contract has freeze authority |
| `isNotRenounced` | Boolean | Contract ownership not renounced |

## Risk Label Catalog

### Level 4 — Critical Risk (Block buy)

| # | Label | API Field | Description |
|---|---|---|---|
| 4-1 | Honeypot | `isHoneypot` | Token cannot be sold after purchase |
| 4-2 | Garbage Airdrop | `isRubbishAirdrop` | Spam/scam airdrop token |
| 4-3 | Gas Mint Scam | `isAirdropScam` | Steals gas fees via airdrop interaction |

### Level 3 — High Risk (Pause for user confirmation on buy)

| # | Label | API Field | Description |
|---|---|---|---|
| 3-1 | Privileged Address (Solana only) | `isHasAssetEditAuth` | Account has asset edit authority. Only applies to Solana (`chainId: 501`). Ignore on other chains. |
| 3-2 | Low Liquidity | `isLowLiquidity` | Insufficient trading liquidity |
| 3-3 | Dumping | `isDumping` | Large sell-off / insider dumping |
| 3-4 | Liquidity Removal | `isLiquidityRemoval` | LP being removed |
| 3-5 | Pump | `isPump` | Artificial price inflation |
| 3-6 | Wash Trading | `isWash` | Fake volume via wash trading |
| 3-7 | Fake Liquidity | `isFakeLiquidity` | Artificially inflated liquidity |
| 3-8 | Wash Trading v2 | `isWash2` | Wash trading (third-party vendor detection) |
| 3-9 | Rugpull Gang | `isFundLinkage` | Linked to known rugpull addresses |
| 3-10 | Very Low LP Burn | `isVeryLowLpBurn` | Minimal LP tokens burned |
| 3-11 | Very High LP Holder Concentration | `isVeryHighLpHolderProp` | LP held by very few addresses |
| 3-12 | Has Blocking History | `isHasBlockingHis` | Contract has frozen addresses before |
| 3-13 | Over Issued | `isOverIssued` | Token supply exceeds stated amount |
| 3-14 | Counterfeit | `isCounterfeit` | Impersonates a well-known token |
| 3-15 | Not Open Source | `isNotOpenSource` | Token contract source code is not verified/open-source |

### Level 2 — Medium Risk (Info warning only)

| # | Label | API Field | Description |
|---|---|---|---|
| 2-1 | Mintable | `isMintable` | Supply can be increased |
| 2-2 | Has Freeze Authority | `isHasFrozenAuth` | Contract can freeze accounts |
| 2-3 | Not Renounced | `isNotRenounced` | Contract ownership retained |

### Tax Thresholds (Reference Only)

> The following table shows how the server incorporates tax values into `riskLevel`. The Agent should **NOT** independently compute risk levels from tax values — `riskLevel` already accounts for them. Display tax info alongside the risk result per step 3 of "How to interpret".

| Tax Value | How Server Uses This (context only) | Display |
|---|---|---|
| ≥ 50% | Contributes to CRITICAL | Show tax percentage |
| ≥ 21% and < 50% | Contributes to HIGH | Show tax percentage |
| > 0% and < 21% | Contributes to MEDIUM | Show tax percentage |
| 0% or null | No tax risk | Do not display (null = tax data unavailable) |

## Risk Level Determination

The API returns a `riskLevel` field directly on each token-scan result. The Agent uses this field as the authoritative risk level — **no client-side computation from individual labels is needed**.

| `riskLevel` value | Meaning |
|---|---|
| `CRITICAL` | Highest risk — honeypot, scam airdrop, gas-mint, or extreme tax |
| `HIGH` | Significant risk — low liquidity, dumping, rugpull linkage, counterfeit, not open-source, etc. |
| `MEDIUM` | Moderate risk — mintable, freeze authority, ownership not renounced, etc. |
| `LOW` | No risk labels triggered — safe to proceed |

### How to interpret

1. **Read `riskLevel`** from the API response. This is the overall token risk level, computed server-side from all boolean labels, tax thresholds, and additional signals (off-chain intelligence, ML models). If `riskLevel` is missing, `null`, or an unrecognized value, treat as `HIGH` (see Edge Cases table for details). When multiple tokens are scanned in one call (e.g., `--tokens "<chainId>:<addr1>,<chainId>:<addr2>"`), the response contains one result object per token, matched by `tokenAddress`. Apply the action matrix independently for each token.
2. **Collect triggered labels** for display: Iterate all boolean fields (`isHoneypot`, `isLowLiquidity`, `isNotOpenSource`, etc.). For each `true` value, include it in the triggered labels list. For `isHasAssetEditAuth`, only include when `chainId == 501` (Solana) — this condition applies to display only; the server already accounts for chain-specific context in `riskLevel`. Individual label levels are **not displayed** — only the overall `riskLevel` is shown. If `riskLevel` is non-LOW but no boolean labels are `true`, display: "Risk level: {riskLevel} — flagged by composite analysis, no specific label identified." (The server may flag risk based on off-chain signals that don't surface as individual boolean fields.)
3. **Display tax info**: If `buyTaxes` or `sellTaxes` is non-null and numeric, display alongside the risk result. If `null`, empty, or non-numeric, omit.
4. **Apply action matrix**: Use `riskLevel` + operation type (buy/sell) to determine the Agent action per the matrix below.

> **`riskLevel` is authoritative**: The server-side `riskLevel` may incorporate signals beyond the individual boolean fields (e.g., off-chain intelligence, ML models). Always trust `riskLevel` over any client-side label aggregation.

## Risk Level Action Matrix

| `riskLevel` | Buy Action | Sell Action |
|---|---|---|
| **CRITICAL** | `action: block` — Refuse to execute. Display: "This token has triggered [label names], posing critical risk. Buy blocked." | `action: warn` — Display risk labels, allow sell to continue. Display: "This token has triggered [label names], posing critical risk. Please trade with caution." |
| **HIGH** | `action: warn` + **pause** — Display risk labels, halt execution, wait for explicit user confirmation (yes/no). Display: "This token has triggered [label names], posing high risk. Continue buying? (yes/no)" | `action: warn` — Display risk labels, allow sell to continue. |
| **MEDIUM** | `action: warn` — Display risk labels as informational notice, do not pause. | `action: warn` — Display risk labels as informational notice, do not pause. |
| **LOW** | `action: ""` — Safe, proceed normally. | `action: ""` — Safe, proceed normally. |

### Determining Buy vs. Sell

- **Buy**: The target token (the token being received / `--to` in swap) is the one being scanned. User is acquiring this token.
- **Sell**: The source token (the token being spent / `--from` in swap) is the one being scanned. User is disposing of this token.
- **Standalone scan** (no swap context): Display all triggered labels with their risk levels. Do not apply buy/sell action logic — just present the risk assessment.

### Display Format

When reporting risk scan results to the user:

```
Token: <symbol or contract address> on <chain>
Risk Level: <CRITICAL|HIGH|MEDIUM|LOW>
Triggered Labels:
  - Garbage Airdrop (isRubbishAirdrop)
  - Low Liquidity (isLowLiquidity)
  - Pump activity (isPump)
Buy Tax: <value>% | Sell Tax: <value>%    <!-- Omit entirely if both null; show only non-null if one is available -->
Action: <BLOCK / WARN — requires confirmation / WARN — info only / Safe>
```

> Individual label levels are **not displayed** — only the overall `riskLevel` is shown. List triggered labels without level prefixes.
> If symbol is unknown (e.g., raw address via Path 3), display the contract address instead, or look up the symbol via `onchainos token search` first.

## Edge Cases

| Scenario | Handling |
|---|---|
| `isChainSupported: false` | Skip detection. Append warning: "This chain does not support token security scanning." Do not block the trade. |
| API timeout / request failure | **Swap context**: Append warning: "Token security scan is temporarily unavailable. Please trade with caution." Continue flow (overrides general fail-safe). **Standalone context**: Follow the general fail-safe principle — ask user whether to retry or proceed. |
| `riskLevel: "LOW"` and no labels triggered | Safe to proceed. |
| `riskLevel` missing, `null`, or unrecognized value | Treat as `HIGH` (cautious default). Display: "⚠️ Risk level unavailable or unrecognized — treating as high risk." Apply HIGH-level actions (pause buy for confirmation, warn on sell). This may indicate an API regression or version mismatch — note it in the execution log if available. |
| `buyTaxes`/`sellTaxes` is `null` | Tax data unavailable. Do not display tax info. Do not treat as risk. |

## Result Interpretation (Quick Reference)

| `riskLevel` | Agent Behavior |
|---|---|
| `CRITICAL` | Block buy. Warn on sell. |
| `HIGH` | Pause buy for confirmation. Warn on sell. |
| `MEDIUM` | Info warning. Continue. |
| `LOW` | Safe. No action needed. |

## Suggest Next Steps

| `riskLevel` | Suggest |
|---|---|
| `LOW` | 1. Swap the token 2. Check market data |
| `MEDIUM` | 1. Note risk labels 2. Swap with awareness |
| `HIGH` | 1. Review risk details 2. Decide whether to proceed |
| `CRITICAL` | Warn user. Do NOT suggest buying. If user holds the token, suggest selling. |

## Examples

**User says:** "Is PEPE safe to buy?" (token name, no address)

```
Agent workflow:
1. Search:  onchainos token search PEPE
   -> Returns multiple results across chains
2. Ask user: "I found these tokens matching 'PEPE':
   1. PEPE on Ethereum (0x6982508145454Ce325dDbE47a25d4ec3d2311933)
   2. PEPE on BSC (0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00)
   Which one do you want to check?"
3. User confirms: "The first one"
4. Scan:   onchainos security token-scan --tokens "1:0x6982508145454Ce325dDbE47a25d4ec3d2311933"
5. Display:
   Token: PEPE on Ethereum
   Risk Level: LOW
   Triggered Labels: None
   Buy Tax: 0%, Sell Tax: 0%
   Action: Safe to trade.
```

**User says:** "Is this token safe to buy?" (provides address directly)

```bash
onchainos security token-scan --tokens "1:0xdAC17F958D2ee523a2206206994597C13D831ec7"
# -> Display:
#   Token: USDT on Ethereum
#   Risk Level: LOW
#   Triggered Labels: None
#   Buy Tax: 0%, Sell Tax: 0%
#   Action: Safe to trade.
```

**Example: Multi-label risk token (from API response)**

```
API returns:
  riskLevel: "CRITICAL"
  isRubbishAirdrop: true
  isHasFrozenAuth: true
  isLowLiquidity: true
  isMintable: true
  isPump: true
  buyTaxes: null, sellTaxes: null

Display:
  Token: <address> on Solana
  Risk Level: CRITICAL
  Triggered Labels:
    - Garbage Airdrop (isRubbishAirdrop)
    - Low Liquidity (isLowLiquidity)
    - Pump activity (isPump)
    - Mintable (isMintable)
    - Has Freeze Authority (isHasFrozenAuth)
  Action: BLOCK — buy is prohibited due to critical risk labels.
```

## Cross-Skill Workflow: Token Safety -> Swap -> TX Scan -> Broadcast

> User: "Is PEPE safe? If so, swap 1 ETH for it"

```
1. (okx-dex-token) onchainos token search PEPE      -> find contract address
2. Confirm which token with user
3. onchainos security token-scan --tokens "<chainId>:<fromAddr>,<chainId>:<toAddr>"
       # If either token is native (e.g., ETH), omit it — scan only the non-native token
       -> read riskLevel for each token from API response
       -> --to token (buy side):  CRITICAL → BLOCK, HIGH → PAUSE, MEDIUM → WARN, LOW → safe
       -> --from token (sell side): CRITICAL/HIGH/MEDIUM → WARN, LOW → safe
       # Enforce most restrictive action across both tokens (BLOCK > PAUSE > WARN > Safe)
4. If safe/confirmed: (okx-dex-swap) onchainos swap quote --from ... --to ... --chain ethereum
       -> get quote (price, impact, gas)
5. (okx-dex-swap) onchainos swap approve --token <fromToken> --amount <amount> --chain ethereum
       -> get approve calldata (skip if selling native token)
6. onchainos security tx-scan --chain ethereum --from <addr> --to <token_contract_address> --data <approve_calldata>
       -> check SPENDER_ADDRESS_BLACK, approve_eoa, phishing risks on the approve calldata
       -> If action is "block", or scan fails: STOP — do NOT execute approval, show risk details, abort workflow
       -> If action is "warn": show risk details, require explicit user confirmation before continuing
7. Execute approval (only if tx-scan passed):
   Path A (user-provided wallet): user signs approve calldata externally -> onchainos gateway broadcast
   Path B (Agentic Wallet):      onchainos wallet contract-call --to <token_contract_address> --chain 1 --input-data <approve_calldata>
8. (okx-dex-swap) onchainos swap execute --from ... --to ... --amount ... --chain ethereum --wallet <addr>
```
