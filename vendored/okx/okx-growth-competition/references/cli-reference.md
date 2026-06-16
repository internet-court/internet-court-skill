# competition CLI Reference

All commands: `onchainos competition <subcommand> [flags]`

## competition list

List Agentic Wallet exclusive trading competitions.

```
onchainos competition list [--status <0|1|2>] [--page-size <n>] [--page-num <n>]
```

**API**: `GET /priapi/v1/dapp/agentic/competition/list`

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--status` | int | — | 0=active, 1=ended, 2=all; omit for all |
| `--page-size` | int | 10 | Results per page |
| `--page-num` | int | 1 | Page number (1-based) |

**Output:**
```json
{
  "availableCompetitions": [
    {
      "id": 100,
      "shortName": "hippo",
      "name": "HIPPO Trading Competition",
      "rewards": "50000 HIPPO",
      "startTime": 1742913600,
      "endTime": 1743432000,
      "startTimeFormatted": "2025-03-26 02:13:20 (UTC+8)",
      "endTimeFormatted": "2025-04-01 02:13:20 (UTC+8)",
      "timeRangeFormatted": "2025-03-26 ~ 2025-04-01",
      "chainId": 196,
      "chainName": "X Layer",
      "status": 3
    }
  ],
  "totalCount": 2
}
```

**`*Formatted` rule (whole file)**: any `*Formatted` sibling is a CLI-computed UTC+8 string with the ` (UTC+8)` suffix included — render verbatim, never recompute from the raw Unix value.

**Note**: Response `status` field uses different values from the query param:
- Query param: `0`=active, `1`=ended, `2`=all
- Response field: `3`=active, `4`=ended

Activity URL: `https://web3.okx.com/boost/trading-competition/<shortName>`

---

## competition detail

Get competition rules, prize pool, and timeline.

```
onchainos competition detail --activity-id <id>
```

**API**: `GET /priapi/v1/dapp/agentic/competition/detail`

| Flag | Required | Description |
|------|----------|-------------|
| `--activity-id` | Yes | Activity ID from `competition list` |

**Output:** Competition object. Key fields:
- `chainId` / `chainName`: the activity's **claim / reward chain ONLY** — the reward contract and activity address live on this chain. NOT a trading chain unless it also appears in `participateChainIds`.
- `participateChainIds`: the **trading-chain set** — only trades on chains in this array count toward the competition standing. Returned by **both `list` and `detail`** endpoints. Trading-eligibility = `participateChainIds`. Claim path = `chainId`.
- `startTime` / `endTime`: raw Unix seconds (do not display; use the `*Formatted` siblings).
- `tabConfigs[]`: per-leaderboard config. `rankFieldConfig[].title` / `.key` / `.sortValueMap.descend` drive the rank tool. `prizePoolDistribution[].rules[]` (`interval`, `reward`) + `rewardUnit` / `totalReward` / `rewardType` (`5`=volume, `7`=PnL, `8`=boost) populate the details template. May be empty on pre-prod.

---

## competition rank

Get leaderboard and current user ranking.

```
onchainos competition rank --activity-id <id> [--wallet <addr>] --sort-type <type> [--limit <n>]
```

**API**: `GET /priapi/v1/dapp/agentic/competition/rank`

> The backend takes either `accountId` (self-query) or `walletAddress` (cross-user query) — never both. Omit `--wallet` to query your own rank; the command loads `accountId` from the active wallet session. Pass `--wallet` only to query someone else's rank; the address chain (EVM `0x...` else Solana) must match the activity chain or the command errors out (no silent wrong-chain query).

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--activity-id` | Yes | — | Activity ID |
| `--wallet` | No | (uses active account's `accountId` instead) | Optional wallet address — pass to query someone else's rank (chain-validated against the activity). |
| `--sort-type` | Yes | 1 | Currently observed: 1=PnL%, 7=PnL. Future activities may add more — discover via `competition detail` → `tabConfigs[].rankFieldConfig[].sortValueMap.descend`. |
| `--limit` | No | 20 | Max entries in `allRankInfos` (max 100; applied client-side) |

**Output:**
```json
{
  "myRankInfo": {
    "currentRank": 42,
    "nickName": "Agentic...abcd",
    "userTotal": "1250.5",
    "expectedRewards": "100",
    "format": 1,
    "rewardUnit": "HIPPO"
  },
  "allRankInfos": [ ... ],
  "rankUpdateTime": 1774359000638,
  "rankUpdateTimeFormatted": "2026-03-24 18:50:00 (UTC+8)",
  "agenticActivity": true,
  "totalRewardToken": "1000000",
  "rewardTokenSymbol": "HIPPO"
}
```

`format`: `1`=number, `2`=percentage, `3`=token amount with unit. `userTotal` semantics come from `tabConfigs[].rankFieldConfig[].title` / `.key`.

---

## competition user-status

Get user's participation and reward status.

```
onchainos competition user-status [--activity-id <id>]
```

**API**:
- Single activity (`--activity-id` provided) → `GET /priapi/v1/dapp/agentic/competition/userStatus`
- All activities (`--activity-id` omitted) → `GET /priapi/v1/dapp/agentic/competition/batchUserStatus` (chunked at 20 ids per call, results merged transparently)

> The CLI sends `accountId` (loaded from the local wallet session) as the API identity, NOT a wallet address. One `accountId` covers every chain in the competition's `participateChainIds` — no chain picking, no wallet args. The batch endpoint replaces per-activity loops with a single (chunked) round-trip.

| Flag | Required | Description |
|------|----------|-------------|
| `--activity-id` | No | Activity ID; omit to check **all** activities (active + ended) |

Per-activity payload from `batchUserStatus` also carries `joinedAddress`, `winnerDownUrl`, `needContact` — fields absent from the single-activity response.

**Output (single activity):**
```json
{
  "joinStatus": 1,
  "joinTime": 1742920000,
  "joinTimeFormatted": "2025-03-26 03:46:40 (UTC+8)",
  "rewardStatus": 1,
  "claimTime": null,
  "claimTimeFormatted": null,
  "rewardAmount": "10000",
  "rewardUnit": "HIPPO",
  "winnerDownUrl": "https://..."
}
```

`joinTime` / `claimTime`: raw Unix seconds (`null` if no event yet). `*Formatted` siblings are `null` when the source is `null`/`0`.

**Output (all activities — no --activity-id):**
```json
[
  {
    "activityId": 106,
    "activityName": "XXX Trading Competition",
    "shortName": "xxx",
    "chainName": "Solana",
    "activityStatus": 4,
    "userStatus": { "joinStatus": 1, "rewardStatus": 1, "rewardAmount": "45", ... }
  }
]
```

| Field | Values |
|-------|--------|
| `joinStatus` | 0=not joined, 1=joined |
| `rewardStatus` | 0=not won, 1=won (unclaimed), 2=claimed, 3=expired, 4=pending draw (winners not yet announced) |

`rewardAmount`, `rewardUnit`, `winnerDownUrl` only present when `rewardStatus=1` or `2` (a winner has been determined).

---

## competition join

Register for a competition. **Requires wallet login.**

```
onchainos competition join --activity-id <id> --evm-wallet <evm_addr> --sol-wallet <sol_addr> --chain-index <chain_id>
```

**API**: `POST /priapi/v5/wallet/agentic/competition/join`

**Extra header**: `OK-ACCESS-PROJECT: 4d156bf0c61130f2692d097ecb68dbe4`

| Flag | Required | Description |
|------|----------|-------------|
| `--activity-id` | Yes | Activity ID |
| `--evm-wallet` | Yes | EVM wallet address (XLayer) |
| `--sol-wallet` | Yes | Solana wallet address |
| `--chain-index` | Yes | Competition chain id (e.g. `"1"` Ethereum, `"196"` X Layer). Read from `competition_detail` → `chainIndex`. |

Body is built automatically: `accountId` is loaded from `wallet_store` (active session); other fields come from the flags verbatim. CLI wraps the bare `{ "code": 0 }` API response into a confirmation object:
```json
{ "joined": true, "activityId": "100", "evmAddress": "0x...", "solAddress": "...", "chainIndex": "1" }
```

**Errors:**
- `not logged in` → run `onchainos wallet login`
- `address limit reached` → one address per user per competition
- region blocked → "service is not available in your region"

---

## competition claim

**Atomic** claim flow: pre-checks `rewardStatus`, fetches calldata, signs each entry with the TEE session, broadcasts on-chain, and returns txHash array. **Requires wallet login.**

```
onchainos competition claim --activity-id <id> --evm-wallet <evm_addr> --sol-wallet <sol_addr>
```

**API**: `POST /priapi/v5/wallet/agentic/competition/claim` (called internally; output is post-broadcast txHashes, not raw calldata)

**Extra header**: `OK-ACCESS-PROJECT: 4d156bf0c61130f2692d097ecb68dbe4`

| Flag | Required | Description |
|------|----------|-------------|
| `--activity-id` | Yes | Activity ID |
| `--evm-wallet` | Yes | EVM wallet address |
| `--sol-wallet` | Yes | Solana wallet address |

**Output:** aggregate result with reward metadata, successful txHashes, and any per-entry failures. Also surfaces `needContact` (true for top-tier winners who have not yet shared a contact method), plus the activity/account/wallet identifiers needed by the downstream `submit-contact` flow:

```json
{
  "ok": true,
  "data": {
    "rewardAmount": "460",
    "rewardUnit": "PYBOBO",
    "totalEntries": 1,
    "succeeded": [{
      "contractAddress": "7KRu...",
      "chain": "501",
      "txHash": "5abc...",
      "orderId": "..."
    }],
    "failed": [],
    "needContact": false,
    "activityId": "107",
    "accountId": "5747d742-...",
    "joinedAddress": "0x8e3f..."
  }
}
```

Pre-checks `rewardStatus` before signing — bails on 0 (not won), 2 (already claimed), 3 (expired), 4 (pending draw). Otherwise signs + broadcasts each entry atomically (Solana entries fall back to base58-encoding `tx.data` because `base58CallData` is empirically empty).

**Errors:**
- code 11002 `not eligible for reward` → user did not win
- code 11003 → activity not found / status mismatch
- code 11008 → reward already claimed or claim window expired
- code 1860402 → backend failed to assemble the transaction; retry, then escalate
- "Sui-chain reward claims are not yet supported" → user must claim from the Sui-compatible wallet UI

---

## competition submit-contact

Record a contact method for top-tier winners (Top 10 on PnL% / PnL leaderboards). Called **only** after a `competition claim` that returned `needContact: true`, and only when the user has affirmatively shared a contact value. **Requires wallet login.**

```
onchainos competition submit-contact --activity-id <id> --contact-type <type> --contact-value <text>
```

**API**: `POST /priapi/v5/wallet/agentic/competition/submitContact`

**Extra header**: `OK-ACCESS-PROJECT: 4d156bf0c61130f2692d097ecb68dbe4`

| Flag | Required | Description |
|------|----------|-------------|
| `--activity-id` | Yes | Activity ID |
| `--contact-type` | Yes | One of: `Telegram`, `WeChat`, `Email`, `Twitter` (case-sensitive — backend rejects other values) |
| `--contact-value` | Yes | The contact value (max 256 chars). e.g. `@username` for Telegram/Twitter, the WeChat ID, the email address |

**Output:**
```json
{
  "ok": true,
  "data": {
    "submitted": true,
    "activityId": "107",
    "contactType": "Telegram"
  }
}
```

**Errors:**
- `contactType must be one of: Telegram, WeChat, Email, Twitter` → caller typo; backend rejects anything else
- `contactValue exceeds 256 character limit` → trim before retry
- `not registered for activity X` → user never joined; submit-contact only makes sense post-claim
- `Refresh token expired` → re-login required
