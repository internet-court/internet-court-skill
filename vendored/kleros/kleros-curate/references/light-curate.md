# Light Curate (LightGeneralizedTCR)

LightGeneralizedTCR (LGTCR) is the most widely deployed Curate flavor. Items enter through an optimistic challenge window: a requester posts an ETH (or xDAI on Gnosis) deposit, and if no challenger disputes within the window, the item is accepted. All deposits are in the chain's native token only.

## Minimum inputs

Collect all four before proceeding. If any is missing: stop and ask.

1. **Registry address** — ask for either:
   - Curate URL (preferred): `https://curate.kleros.io/tcr/<chainId>/<address>`
   - or chainId + contract address directly
2. **Existing list or new list?** — existing: need chainId + address; new: need factory address + all deploy params (see Deploy section)
3. **Action** — one of: `addItem`, `removeItem`, `challengeRequest`, `submitEvidence`, `fundAppeal`, `executeRequest`, `withdrawFeesAndRewards`, factory deploy
4. **Field values** — for submissions: the actual values for each schema field

**How the user finds the list address (Curate UI):**
1. Open `https://curate.kleros.io`
2. Open the target list
3. Copy the URL — the contract address is the last segment after the chainId

## Registry discovery

Verify the contract before any policy or deposit work. Given `(chainId, listAddress)`:

1. **Confirm chainId** matches user intent — Mainnet = 1, Sepolia = 11155111, Gnosis = 100
2. **Call `eth_getCode(listAddress)`** on that chain's RPC. If result is `0x`: not a contract on this chain — stop and ask for the correct chainId/address
3. **Hallmark read** — call `submissionBaseDeposit()` or `arbitrator()`. If either reverts: wrong contract type or address — stop and re-check
4. Only after steps 1–3 pass: proceed to MetaEvidence and deposit work

Forbidden: declaring "it's an EOA" without chain-scoped `eth_getCode`; guessing which chain the registry is on.

## MetaEvidence retrieval

Fetch per the shared procedure — LGTCR emits two separate MetaEvidence streams:
- `_metaEvidenceID = 0` → registration MetaEvidence (governs `addItem`)
- `_metaEvidenceID = 1` → clearing MetaEvidence (governs `removeItem`)

Use stream 0 for addItem flows; stream 1 for removeItem flows. Do not apply the wrong stream — it gives the wrong schema and violates the policy.

For full retrieval procedure (log retrieval, sort-and-take-latest, JSON parsing): `shared-metaevidence.md § LGTCR specifics`

## item.json construction

Build item.json from the `metadata.columns` array in the MetaEvidence JSON. Do not build item.json before reading the policy — the policy defines what constitutes a compliant submission.

**Schema confirmation check (LGTCR-specific):** Before first submission to a registry, confirm field order by inspecting a successfully-registered item. Query logs for a `NewItem(bytes32 _itemID, string _data, bool _addedDirectly)` event on a known-good item — the `_data` field is the item JSON. Compare its field order against `metadata.columns` to confirm the schema encoding before building your own item.json. If no `NewItem` sample exists and type encoding is ambiguous: stop and warn the user.

For construction rules (field types, encoding, column ordering): `shared-item-json.md`

## Deposit computation

LGTCR uses native token only (ETH on Mainnet/Sepolia, xDAI on Gnosis).

| Action | Formula |
|--------|---------|
| `addItem` | `submissionBaseDeposit() + arbitrationCost` |
| `removeItem` | `removalBaseDeposit() + arbitrationCost` |
| `challengeRequest` (registration request) | `submissionChallengeBaseDeposit() + arbitrationCost` |
| `challengeRequest` (removal request) | `removalChallengeBaseDeposit() + arbitrationCost` |

Never quote a cached or approximate deposit — always compute from live onchain reads. If you cannot compute live: stop.

For arbitrationCost read sequence and the never-guess rule: `shared-deposits.md § LGTCR specifics`

## Submit item

1. **Fetch MetaEvidence** — use stream ID 0 (registration). Extract `fileURI` and `metadata.columns`. → `shared-metaevidence.md § LGTCR specifics`
2. **Read policy** — fetch the `fileURI` document before building item.json. The policy defines what constitutes a compliant item.
3. **Build item.json** — derive schema from `metadata.columns`; run the schema confirmation check (NewItem event sample) if type encoding is ambiguous. → `shared-item-json.md`
4. **Upload to IPFS** — upload item.json → obtain `/ipfs/<CID>`. → `shared-ipfs-upload.md`
5. **Compute deposit live** — `submissionBaseDeposit() + arbitrationCost`. → `shared-deposits.md § LGTCR specifics`
6. **Simulate** — dry-run with identical calldata and `msg.value`; confirm no revert
7. **Submit** — call `addItem("/ipfs/<CID>")` with `msg.value = deposit`

ABI: `function addItem(string _item) external payable` — full fragment in `shared-abi-fragments.md`

## Challenge / remove item

### Remove item

1. **Fetch MetaEvidence** — use stream ID 1 (clearing). → `shared-metaevidence.md § LGTCR specifics`
2. **Read removal policy** — fetch `fileURI` document from clearing MetaEvidence
3. **Draft removal evidence JSON** — upload to IPFS → `/ipfs/<CID>`. → `shared-ipfs-upload.md`
4. **Compute removal deposit** — `removalBaseDeposit() + arbitrationCost`. → `shared-deposits.md § LGTCR specifics`
5. **Simulate** — dry-run with same calldata + `msg.value`
6. **Submit** — call `removeItem(itemID, "/ipfs/<CID>")` with `msg.value = deposit`

ABI: `function removeItem(bytes32 _itemID, string _evidence) external payable`

### Challenge item

1. **Determine request type** — check whether the active request is a registration request (submission) or a removal request. This determines which deposit formula to use: registration requests use `submissionChallengeBaseDeposit()`; removal requests use `removalChallengeBaseDeposit()`.
2. **Read the applicable policy** — registration policy (stream ID 0) if challenging a registration; clearing policy (stream ID 1) if challenging a removal
3. **Draft challenge evidence JSON** — upload to IPFS → `/ipfs/<CID>`. → `shared-ipfs-upload.md`
4. **Compute challenge deposit**:
   - Registration request: `submissionChallengeBaseDeposit() + arbitrationCost`
   - Removal request: `removalChallengeBaseDeposit() + arbitrationCost`
   → `shared-deposits.md § LGTCR specifics`
5. **Simulate** — dry-run with same calldata + `msg.value`
6. **Submit** — call `challengeRequest(itemID, "/ipfs/<CID>")` with `msg.value = deposit`

ABI: `function challengeRequest(bytes32 _itemID, string _evidence) external payable`

## Submit evidence

1. **Draft evidence JSON** — upload to IPFS → `/ipfs/<CID>`. → `shared-ipfs-upload.md`
2. **Submit** — call `submitEvidence(itemID, "/ipfs/<CID>")` with `msg.value = 0`

Evidence can be submitted by any party while a request is active. ABI: `function submitEvidence(bytes32 _itemID, string _evidence) external`

## Fund an appeal

For the appeal funding formula: `shared-deposits.md § Appeal funding (shared)`

**Do NOT attempt to fund if:** no active dispute (`disputed == false`), loser has passed the half-time deadline (`now >= (start + end) / 2`), side is already fully funded (`hasPaid[side] == true`), or simulation fails.

**Step-by-step algorithm:**

1. Call `getItemInfo(itemID)` → get `numberOfRequests`. Set `requestID = numberOfRequests - 1`.
2. Call `getRequestInfo(itemID, requestID)` → get `disputed`, `disputeID`, `numberOfRounds`, `ruling`, `requestArbitrator`, `requestArbitratorExtraData`. If `disputed == false`: no appeal to fund — stop.
3. Set `roundID = numberOfRounds - 1`.
4. Call `getRoundInfo(itemID, requestID, roundID)` → get `amountPaid[3]`, `hasPaid[3]`.
5. From `requestArbitrator` (use the arbitrator from `getRequestInfo` — NOT the registry-level `arbitrator()` return value, which may differ): call `appealCost(disputeID, requestArbitratorExtraData)`. Optionally call `currentRuling(disputeID)` and `appealPeriod(disputeID)` → `(start, end)`.
6. Compute `totalRequired` per the formula in `shared-deposits.md § Appeal funding (shared)`.
7. Compute `remaining`: if `hasPaid[side]` is true → `remaining = 0`; else → `remaining = max(totalRequired - amountPaid[side], 0)`.
8. Simulate then call `fundAppeal(itemID, side)` with `msg.value = remaining`.

Party enum: `0 = None`, `1 = Requester`, `2 = Challenger`. Never fund side 0 (None).

Loser half-time rule: the losing side must fund before `(start + end) / 2` — if `now >= midpoint`, the loser can no longer fund.

ABI: `function fundAppeal(bytes32 _itemID, uint8 _side) external payable`

## Execute / Withdraw

After the challenge window expires with no challenge, finalize the request: call `executeRequest(itemID)`.

To withdraw crowdfunded appeal fees and rewards after a resolved dispute: call `withdrawFeesAndRewards(beneficiary, itemID, requestID, roundID)`.

ABI: `function executeRequest(bytes32 _itemID) external` and `function withdrawFeesAndRewards(address _beneficiary, bytes32 _itemID, uint256 _requestID, uint256 _roundID) external` — full fragments in `shared-abi-fragments.md`

## Deploy a new registry (factory)

1. **Identify factory address** — obtain from Kleros GitHub (`kleros/gtcr` repo) or by inspecting a known registry deployment tx on the target chain's explorer. Do NOT hardcode a factory address without verifying it on the target chain — factory addresses vary by chain and version.
2. **Prepare registration MetaEvidence JSON** — include `title`, `description`, `fileURI` (policy PDF on IPFS), and `metadata.columns` schema. Upload to IPFS → `/ipfs/<CID>`. → `shared-metaevidence.md` for JSON structure, `shared-ipfs-upload.md` for upload
3. **Prepare clearing MetaEvidence JSON** — separate policy and schema for removal flow. Upload to IPFS → `/ipfs/<CID>`.
4. **Determine all constructor params**: `arbitrator`, `arbitratorExtraData`, `registrationMetaEvidence` URI, `clearingMetaEvidence` URI, `challengePeriodDuration`, `submissionBaseDeposit`, `removalBaseDeposit`, `submissionChallengeBaseDeposit`, `removalChallengeBaseDeposit`, `winnerStakeMultiplier`, `loserStakeMultiplier`, `sharedStakeMultiplier`
5. **Confirm params with user** before proceeding — deposit amounts and multipliers are governance parameters the user must set intentionally
6. **Simulate** — dry-run the factory call with all params
7. **Send** — call the factory's deploy function (check factory ABI — function name is `addList(...)` or `createRegistry(...)` depending on factory version; do not assume the name)
8. **Listen for `NewGTCR(address _address)` event** — the emitted address is the new registry. Immediately run MetaEvidence retrieval on the new registry to confirm both streams are correct.
