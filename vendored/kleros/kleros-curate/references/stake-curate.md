# Stake Curate (PermanentGTCR / PGTCR)

PermanentGTCR (PGTCR) is a Curate registry flavor where the submitter's ERC20 stake is permanent collateral — it is locked with the item and is not returned if the item is later removed. PGTCR differs from LGTCR in four key ways: (1) two-asset deposit model (ERC20 stake + native arbitration cost, approved and sent separately), (2) different function names (`challengeItem` not `challengeRequest`; `withdrawFeesAndRewards` takes `uint120 _challengeID`), (3) unique two-step withdrawal flow (`startWithdrawItem` → wait `withdrawingPeriod` → `withdrawItem`), and (4) a richer status model requiring GraphQL cross-referencing to derive display states. The Goldsky subgraph is the primary data source for PGTCR — it is not optional.

## Contents

- [Minimum inputs](#minimum-inputs)
- [Registry discovery (PGTCR hallmarks)](#registry-discovery-pgtcr-hallmarks)
- [MetaEvidence retrieval](#metaevidence-retrieval)
- [item.json construction](#itemjson-construction)
- [Deposit and stake computation](#deposit-and-stake-computation)
- [PGTCR status model](#pgtcr-status-model)
- [GraphQL queries](#graphql-queries)
- [Submit item (ERC20 approval + stake)](#submit-item-erc20-approval--stake)
- [Challenge item](#challenge-item)
- [Submit evidence](#submit-evidence)
- [Fund appeal](#fund-appeal)
- [Withdrawal flow](#withdrawal-flow)
- [Withdraw fees and rewards](#withdraw-fees-and-rewards)
- [Admin actions](#admin-actions)
- [Deploy a new registry (factory)](#deploy-a-new-registry-factory)
- [Onchain fallbacks](#onchain-fallbacks)

---

## Minimum inputs

Ask the user for these three things before proceeding:

1. **Existing list or create new list?**
   - Existing list → `(chainId, registryAddress)` or a Curate UI URL containing the chain and address.
   - New list → `(chainId, factoryAddress)` + deploy params (see [Deploy a new registry](#deploy-a-new-registry-factory)).

2. **Goldsky access** — public endpoints work without any token (use `/api/public/` URLs below).
   A Goldsky API token unlocks private endpoints (replace `/api/public/` with `/api/private/`
   and add `Authorization: Bearer <GOLDSKY_TOKEN>` header). Create a free token on the
   Goldsky dashboard → Project Settings → API Tokens.

3. **Action** — submit, challenge, evidence, appeal funding, withdraw, admin action, etc.

Test Goldsky connectivity:
```bash
ENDPOINT="<paste endpoint here>"
curl -sS "$ENDPOINT" \
  -H 'content-type: application/json' \
  --data '{"query":"{ __typename }"}'
```

---

## Registry discovery (PGTCR hallmarks)

Given `(chainId, registryAddress)`:

1. **Confirm it is a contract**: call `eth_getCode(registryAddress)` on the target chain.
   If result is `0x`, stop — wrong chain or wrong address.

2. **Confirm it is PGTCR** (hallmark reads):
   - `token()` → returns an ERC20 token address (LGTCR has no `token()` function)
   - `submissionMinDeposit()` → returns uint256 (LGTCR uses `submissionBaseDeposit()`, not this name)

3. **GraphQL existence test** (fast sanity check):
```graphql
query RegistryExistence($id: String!) {
  registry(id: $id) { id }
}
```
Variables: `{ "id": "<registryAddress_lowercase>" }`

If GraphQL returns null but onchain code exists: assume indexing lag and proceed with onchain reads.
If `token()` reverts or does not exist: the contract may be LGTCR — load light-curate.md instead.

---

## MetaEvidence retrieval

**Primary path: Goldsky subgraph.** Hardcoded public endpoints:

- **Mainnet:** `https://api.goldsky.com/api/public/project_cmgx9all3003atlp2bqha1zif/subgraphs/pgtcr-mainnet/v0.0.1/gn`
- **Gnosis:** `https://api.goldsky.com/api/public/project_cmgx9all3003atlp2bqha1zif/subgraphs/pgtcr-gnosis/v0.0.1/gn`
- **Sepolia:** `https://api.goldsky.com/api/public/project_cmgx9all3003atlp2bqha1zif/subgraphs/pgtcr-sepolia/v0.0.2/gn`

Replace `/api/public/` with `/api/private/` and add `Authorization: Bearer <GOLDSKY_TOKEN>` header when using a token.

Query `registry.arbitrationSettings[0].metaEvidenceURI` from GraphQL query 4A below. Fetch the returned
URI from the IPFS gateway (typically `https://cdn.kleros.link/ipfs/<CID>/metaEvidence.json`).

For the full retrieval and fallback procedure: `shared-metaevidence.md § PGTCR specifics`.

Note: PGTCR uses a single MetaEvidence URI — there is no registration/clearing split. The LGTCR two-stream
model does not apply.

**Fallback:** onchain `eth_getLogs` — see `shared-metaevidence.md § PGTCR specifics` for procedure.

---

## item.json construction

Build `item.json` from the `metadata.columns` array in the MetaEvidence JSON.
For construction rules (deep-copy rule, output protocol, field-value types): `shared-item-json.md`.

Note: PGTCR does not require the schema confirmation check — that is an LGTCR-specific step.

---

## Deposit and stake computation

PGTCR uses two separate assets. **Why:** the ERC20 permanent stake is collateral locked with the item
(stays in the contract even if the item is removed later); the native token covers the arbitrator fee.
These are separate assets flowing to separate destinations — they cannot be combined into one `msg.value`.

| Asset | Amount | What |
|-------|--------|------|
| ERC20 stake (approve first) | `>= submissionMinDeposit()` | Locked collateral |
| Native `msg.value` (on `addItem` call) | `arbitrator.arbitrationCost(extraData)` | Arbitrator fee |

**Get arbitratorExtraData:** call `arbitrationParamsChanges(0)` (or the latest active index) to get
`(timestamp, arbitratorExtraData)`. PGTCR does NOT have an `arbitratorExtraData()` function — use
`arbitrationParamsChanges(index)` instead. Then call `arbitrator.arbitrationCost(arbitratorExtraData)` live.

For the challenge stake formula: `shared-deposits.md § PGTCR specifics`.
For the appeal funding formula: `shared-deposits.md § Appeal funding (shared)`.

---

## PGTCR status model

The contract-level `status` enum alone is not sufficient for display. **Why:** the states ACCEPTED,
PENDING, CROWDFUNDING, and WAITING_ARBITRATOR require cross-referencing timestamps and dispute round
data available in GraphQL — the enum only tells you the raw contract state.

**Onchain status enum:**
- `Absent` — item not present (rejected or removed)
- `Submitted` — item submitted, within submission period
- `Reincluded` — item reincluded after challenge, within reinclusion period
- `Disputed` — item has an active dispute

**Derived-status algorithm** (evaluate in this order — evaluation order matters):

```text
if item.status == Absent:
  # distinguish rejected vs removed using includedAt+submissionPeriod when available
  if includedAt > 0 and submissionPeriod > 0 and includedAt + submissionPeriod < now:
    return REMOVED
  else:
    return REJECTED

if item.status in {Submitted, Reincluded}:
  if withdrawingTimestamp > 0 and withdrawingTimestamp + withdrawingPeriod < now:
    return PENDING_WITHDRAWAL

if item.status == Submitted:
  return (includedAt + submissionPeriod < now) ? ACCEPTED : PENDING

if item.status == Reincluded:
  return (includedAt + reinclusionPeriod < now) ? ACCEPTED : PENDING

if item.status == Disputed:
  round = latest_round
  if round.rulingTime == 0:
    return DISPUTED
  if round.appealPeriodEnd <= now:
    return WAITING_ARBITRATOR

  half = (round.appealPeriodStart + round.appealPeriodEnd) / 2
  if now < half:
    return CROWDFUNDING

  loser = (round.ruling == ACCEPT) ? CHALLENGER : REQUESTER
  if loser_hasPaid:
    return CROWDFUNDING_WINNER
  else:
    return WAITING_ARBITRATOR
```

Check withdrawal state first (before status-based classification) — a `PENDING_WITHDRAWAL` item may
otherwise be misclassified as `PENDING` or `ACCEPTED`.

GraphQL query 4B and 4C below provide `withdrawingTimestamp`, `includedAt`, `hasPaidRequester`,
`hasPaidChallenger`, `appealPeriodStart`, `appealPeriodEnd`, `ruling`, and `rulingTime` — the fields
that feed this algorithm.

---

## GraphQL queries

Use these queries with the Goldsky endpoints above. Queries are coupled to the status model — field
selections map directly to derived-status algorithm variables.

### Query 4A: Registry params + latest metaEvidenceURI

```graphql
query PermanentRegistry($id: String!) {
  registry(id: $id) {
    id
    token
    arbitrator { id }
    arbitrationSettings(orderBy: timestamp, orderDirection: desc) {
      timestamp
      arbitratorExtraData
      metaEvidenceURI
      metadata {
        title
        description
        itemName
        itemNamePlural
        policyURI
        logoURI
        requireRemovalEvidence
      }
    }
    submissionMinDeposit
    submissionPeriod
    reinclusionPeriod
    withdrawingPeriod
    arbitrationParamsCooldown
    challengeStakeMultiplier
    winnerStakeMultiplier
    loserStakeMultiplier
    sharedStakeMultiplier
  }
}
```

Variables: `{ "id": "<registryAddress_lowercase>" }`

### Query 4B: Paginated items list (for search/browse)

```graphql
query PermanentItems($skip: Int, $first: Int, $where: Item_filter) {
  items(
    skip: $skip
    first: $first
    orderDirection: desc
    orderBy: includedAt
    where: $where
  ) {
    itemID
    status
    data
    createdAt
    includedAt
    stake
    arbitrationDeposit
    withdrawingTimestamp
    metadata {
      props { value type label description isIdentifier }
    }
    submissions(first: 1, orderBy: createdAt, orderDirection: desc) { submitter }
    challenges(first: 1, orderBy: createdAt, orderDirection: desc) {
      disputeID
      createdAt
      resolutionTime
      challenger
      challengerStake
      disputeOutcome
      rounds(first: 1, orderBy: creationTime, orderDirection: desc) {
        appealPeriodStart
        appealPeriodEnd
        ruling
        rulingTime
        hasPaidRequester
        hasPaidChallenger
        amountPaidRequester
        amountPaidChallenger
      }
    }
  }
}
```

### Query 4C: Single item details (disputes, appeals, evidence)

Item entity IDs are typically: `<itemID>@<registryAddress>`.

```graphql
query PermanentItemDetails($id: String!) {
  item(id: $id) {
    itemID
    data
    status
    stake
    submitter
    includedAt
    arbitrationDeposit
    withdrawingTimestamp

    submissions(orderBy: createdAt, orderDirection: desc) {
      id
      createdAt
      creationTx
      finishedAt
      withdrawingTimestamp
      withdrawingTx
      submitter
      initialStake
      arbitrationDeposit
    }

    challenges(orderBy: createdAt, orderDirection: desc) {
      id
      disputeID
      createdAt
      creationTx
      resolutionTime
      resolutionTx
      challenger
      challengerStake
      disputeOutcome
      arbitrationSetting { arbitratorExtraData index }
      rounds(orderBy: creationTime, orderDirection: desc) {
        appealPeriodStart
        appealPeriodEnd
        ruling
        rulingTime
        hasPaidRequester
        hasPaidChallenger
        amountPaidRequester
        amountPaidChallenger
      }
    }

    evidences(orderBy: number, orderDirection: desc) {
      party
      URI
      number
      timestamp
      txHash
      metadata { name title description fileURI fileTypeExtension }
    }

    registry {
      id
      token
      arbitrator { id }
      arbitrationSettings(orderBy: timestamp, orderDirection: desc) {
        timestamp
        arbitratorExtraData
        metaEvidenceURI
        metadata { title itemName policyURI requireRemovalEvidence }
      }
      submissionMinDeposit
      submissionPeriod
      reinclusionPeriod
      withdrawingPeriod
      arbitrationParamsCooldown
      challengeStakeMultiplier
      winnerStakeMultiplier
      loserStakeMultiplier
      sharedStakeMultiplier
    }
  }
}
```

---

## Submit item (ERC20 approval + stake)

PGTCR uses two separate assets — approve ERC20 first, then send native `msg.value` for arbitration.
**Why:** the ERC20 stake flows to the registry as collateral; the native token flows to the arbitrator.
This two-step flow differs fundamentally from LGTCR which uses only native token.

1. **Query registry via GraphQL (query 4A)** → get `token`, `submissionMinDeposit`,
   `arbitrationSettings[0].metaEvidenceURI`, and `arbitrationSettings[0].arbitratorExtraData`.

2. **Fetch MetaEvidence** — fetch the URI from `arbitrationSettings[0].metaEvidenceURI` via
   IPFS gateway. Read policy document (`fileURI`) and extract `metadata.columns[]`.
   For full retrieval procedure: `shared-metaevidence.md § PGTCR specifics`.

3. **Build item.json and upload to IPFS** → get `/ipfs/<CID>`.
   See `shared-item-json.md` for construction rules and `shared-ipfs-upload.md` for upload options.

4. **Decide stake amount**: `depositStake >= submissionMinDeposit()` (read live).
   Submitters may stake more than the minimum — a higher stake signals confidence and makes spam
   less attractive. Confirm the user understands the stake is locked until withdrawal.

5. **Approve ERC20 stake:**
   ```text
   ERC20(token).approve(registryAddress, depositStake)
   ```
   The contract will pull `depositStake` from the sender during `addItem`.

6. **Get arbitratorExtraData and compute arbitrationCost:**
   Call `arbitrationParamsChanges(0)` (or the latest active index) → `(timestamp, arbitratorExtraData)`.
   Then: `arbitrationCost = arbitrator.arbitrationCost(arbitratorExtraData)` (read live from arbitrator).

7. **Simulate then call:**
   ```text
   addItem("/ipfs/<CID>", depositStake)
   msg.value = arbitrationCost
   ```
   ABI: `function addItem(string _item, uint256 _deposit) external payable`
   See `shared-abi-fragments.md` for the full PGTCR write function list.

---

## Challenge item

1. **Fetch item details via GraphQL (query 4C)** → get `stake`, registry `challengeStakeMultiplier`,
   and `MULTIPLIER_DIVISOR`.

2. **Compute challenge ERC20 stake:**
   ```text
   challengeStake = item.stake × challengeStakeMultiplier / MULTIPLIER_DIVISOR
   ```
   Read all three values live (from subgraph + cross-check against onchain reads).
   For the full formula: `shared-deposits.md § PGTCR specifics`.

3. **Approve ERC20 challenge stake:**
   ```text
   ERC20(token).approve(registryAddress, challengeStake)
   ```

4. **Build/upload evidence JSON** (ERC-1497 format) to IPFS → `/ipfs/<CID>`.
   See `shared-ipfs-upload.md`.

5. **Get arbitratorExtraData and compute arbitrationCost** (same as step 6 of Submit item above).

6. **Simulate then call:**
   ```text
   challengeItem(itemID, "/ipfs/<evidenceCID>")
   msg.value = arbitrationCost
   ```
   ABI: `function challengeItem(bytes32 _itemID, string _evidence) external payable`

   Note: PGTCR uses `challengeItem`, not `challengeRequest` (that is the LGTCR function name).
   Using the wrong name causes a revert.

---

## Submit evidence

1. Build evidence JSON (ERC-1497 format) and upload to IPFS → `/ipfs/<CID>`.
   See `shared-ipfs-upload.md`.

2. Call: `submitEvidence(itemID, "/ipfs/<CID>")`
   ABI: `function submitEvidence(bytes32 _itemID, string _evidence) external`

---

## Fund appeal

PGTCR disputes require referencing the arbitratorExtraData that was active when the dispute was created
— not a top-level registry call. **Why:** arbitration params may have changed since the dispute was
opened; using stale extraData causes `appealCost` to return the wrong value.

Retrieve the active `arbitratorExtraData` from GraphQL query 4C:
`challenge.arbitrationSetting.arbitratorExtraData` (from the challenge's `arbitrationSetting.index`).
This is the extraData scoped to the specific challenge, not the current registry setting.

For the appeal funding formula and multiplier selection: `shared-deposits.md § Appeal funding (shared)`.

Round state (`amountPaidRequester`, `amountPaidChallenger`, `hasPaidRequester`, `hasPaidChallenger`) is
available via GraphQL query 4C (item → challenges → rounds) as an alternative to direct contract reads.

Call: `fundAppeal(itemID, side)` with `msg.value = remaining`. Simulate first.
Party enum: 0 = None, 1 = Requester, 2 = Challenger. Never fund None.

---

## Withdrawal flow

PGTCR uses a mandatory two-step withdrawal. **Why:** the withdrawal period allows challengers to dispute
removal requests during the window — this prevents stake recovery while an item is still contestable.

1. **Start withdrawal:** call `startWithdrawItem(itemID)`.
   This sets `withdrawingTimestamp` on the item to the current block timestamp.

2. **Read `withdrawingPeriod`** from the registry (onchain read or GraphQL query 4A).

3. **Wait:** `block.timestamp >= withdrawingTimestamp + withdrawingPeriod`.
   Do not call `withdrawItem` before the period elapses — it will revert.

4. **Finalize withdrawal:** call `withdrawItem(itemID)`.
   This recovers the ERC20 stake to the submitter.

ABIs:
```solidity
function startWithdrawItem(bytes32 _itemID) external payable
function withdrawItem(bytes32 _itemID) external payable
```

During the `withdrawingPeriod`, the item shows as `PENDING_WITHDRAWAL` in the derived-status model
(see [PGTCR status model](#pgtcr-status-model)).

---

## Withdraw fees and rewards

Call after a resolved dispute to collect appeal contributions and fee refunds.

```text
withdrawFeesAndRewards(beneficiary, itemID, challengeID, roundID)
```

ABI: `function withdrawFeesAndRewards(address _beneficiary, bytes32 _itemID, uint120 _challengeID, uint256 _roundID) external`

Note: PGTCR uses `uint120 _challengeID` — not `uint256 _requestID` (that is the LGTCR signature).
Using the wrong type causes an ABI encoding mismatch. See `shared-abi-fragments.md`.

Determine `(challengeID, roundID)` from GraphQL query 4C (item → challenges → rounds).

---

## Admin actions

GOVERNOR-ONLY — always simulate and confirm with the governor before executing any admin action.
These calls change registry rules that affect all submitters. Never execute without explicit governor approval.

### Update arbitration params and MetaEvidence (policy or schema upgrade)
```text
changeArbitrationParams(arbitratorExtraData, metaEvidenceURI)
```
Upload the new MetaEvidence JSON to IPFS first → get `/ipfs/<CID>` → pass as `metaEvidenceURI`.
Subject to `arbitrationParamsCooldown` — cannot change more frequently than the cooldown period.
Do not assume immediate effect; the new params activate after the cooldown.

### Update economic parameters (governor-only)
```text
changeSubmissionMinDeposit(uint256)
changeChallengeStakeMultiplier(uint256)
changeWinnerStakeMultiplier(uint256)
changeLoserStakeMultiplier(uint256)
changeSharedStakeMultiplier(uint256)
```

### Update period parameters (governor-only)
```text
changeSubmissionPeriod(uint256)
changeReinclusionPeriod(uint256)
changeWithdrawingPeriod(uint256)
changeArbitrationParamsCooldown(uint256)
```

### Transfer governance
```text
changeGovernor(address)
```
Simulation required. Transferring governance is irreversible if the new address is wrong.

---

## Deploy a new registry (factory)

PGTCR factory differs from LGTCR in: single MetaEvidence (no registration/clearing split),
4-element periods array, 4-element stake multipliers array.

Factory ABI:
```text
deploy(
  IArbitrator _arbitrator,
  bytes _arbitratorExtraData,
  string _metaEvidence,
  address _governor,
  IERC20 _token,
  uint256 _submissionMinDeposit,
  uint256[4] _periods,
  uint256[4] _stakeMultipliers
) returns (address instance)
```

Steps:
1. **Confirm factory address** for the target chain — do not guess; accept an explorer link.

2. **Prepare MetaEvidence JSON** (policy document + `metadata.columns` schema).
   Upload to IPFS → `/ipfs/<CID>`. See `shared-ipfs-upload.md` and `shared-metaevidence.md`.

3. **Confirm all params with the user:**
   - `_token` — ERC20 stake token address
   - `_submissionMinDeposit` — minimum ERC20 stake per submission
   - `_periods[4]` — `[submissionPeriod, reinclusionPeriod, withdrawingPeriod, arbitrationParamsCooldown]`
   - `_stakeMultipliers[4]` — `[challengeStakeMultiplier, winnerStakeMultiplier, loserStakeMultiplier, sharedStakeMultiplier]`
   - `_arbitrator`, `_arbitratorExtraData`, `_governor`

4. **Simulate** the `deploy` call with the confirmed params.

5. **Send transaction** — capture the emitted `NewGTCR(address instance)` event to get the registry address.

6. **Verify** — query the new registry via GraphQL (once indexed) and cross-check with onchain reads.

---

## Onchain fallbacks

Use these when the Goldsky subgraph is unavailable or lagging.

### Fallback A: MetaEvidence via eth_getLogs

Call `eth_getLogs` with the registry address and topic0:
```text
topic0 = keccak256("MetaEvidence(uint256,string)")
       = 0x61606860eb6c87306811e2695215385101daab53bd6ab4e9f9049aead9363c7d
```
Take the latest log by `blockNumber` descending, then `logIndex` descending.
For the full retrieval procedure: `shared-metaevidence.md § PGTCR specifics`.

### Fallback B: arbitrationParamsChanges index logic

When GraphQL is unavailable and you need the active `arbitratorExtraData`:

1. Call `arbitrationParamsChanges(0)` → get `(timestamp0, extraData0)`.
2. Increment the index and call again. Repeat until the call reverts.
3. The highest valid index that does not revert is the latest entry.
4. Apply the `arbitrationParamsCooldown` to determine which entry is currently active:
   the active entry is the latest one whose `timestamp <= now - arbitrationParamsCooldown`.
5. Use that entry's `arbitratorExtraData` for cost computations.

### Fallback C: getRoundAmountPaid (appeal contributions)

When GraphQL round data is unavailable:
```text
getRoundAmountPaid(itemID, challengeID, roundID) → uint256[3] amountPaid
```
Returns `amountPaid` indexed by party (0 = None, 1 = Requester, 2 = Challenger).
