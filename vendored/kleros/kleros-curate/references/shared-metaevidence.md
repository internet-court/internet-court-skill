# Shared: MetaEvidence Retrieval
<!-- Sources: curate-v1/curate-light-skill.md §1–§2, curate-v1/pgtcr-stake-curate-skill.md §5A–5B -->

MetaEvidence is the onchain source of truth for two things every Curate workflow needs:
- **Policy document**: `fileURI` → link to the human-readable registry rules (usually a PDF on IPFS)
- **Item schema**: `metadata.columns[]` → field labels, types, identifiers — drives item.json construction

Do not ask users for schema fields until you have extracted `metadata.columns` from the current MetaEvidence.
Do not rely on screenshots, old docs, or memory. Fetch from contract logs on every session.

---

## RPC log retrieval (eth_getLogs)

Call `eth_getLogs` with this filter:

```json
{
  "address": "<registryAddress>",
  "topics": ["<topic0>"]
}
```

Set `fromBlock` early enough to cover the full registry history (or use `"earliest"`).

For topic0 and the full MetaEvidence event signature: see `shared-abi-fragments.md`.

The event emitted is:
```
MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence)
```

`_evidence` is typically `/ipfs/<CID>/metaEvidence.json`.

---

## Sort-and-take-latest rule

After retrieving logs:

1. Group logs by `_metaEvidenceID`.
2. Within each group, sort by `blockNumber` descending, then `logIndex` descending.
3. Take the first log per `_metaEvidenceID` — that is the current MetaEvidence for that stream.

**Why:** Governors can update registry parameters (deposit amounts, schema columns) at any time by emitting a new MetaEvidence event. An older log returns stale deposit amounts and an outdated schema. Always take the latest per stream.

---

## Fetching the MetaEvidence JSON

The `_evidence` field from the log is an IPFS path. Fetch it via a public gateway:

```
https://cdn.kleros.link/ipfs/<CID>/metaEvidence.json
https://ipfs.io/ipfs/<CID>/metaEvidence.json
```

The path format from the event is `/ipfs/<CID>/metaEvidence.json` — prepend the gateway host only (do not add a second `/ipfs/` segment).

Parse the JSON and extract:
- `fileURI` — the policy document URI (pass to the user or fetch for compliance checks)
- `metadata.columns[]` — the item schema for this registry and stream

---

### LGTCR specifics

LightGeneralizedTCR registries emit **two separate MetaEvidence streams** — one for registration actions and one for clearing/removal actions.

MetaEvidenceID mapping:
- `_metaEvidenceID = 0` → registration MetaEvidence (governs `addItem`)
- `_metaEvidenceID = 1` → clearing MetaEvidence (governs `removeItem`)

**Why:** LGTCR uses separate acceptance and removal policies. Each has its own schema and policy document. Applying the wrong stream gives the wrong schema and violates the policy.

Use the correct stream for the operation in progress:
- `addItem` flow → fetch latest MetaEvidence for ID 0
- `removeItem` flow → fetch latest MetaEvidence for ID 1

**Resolution hierarchy when ID mapping is ambiguous:**

1. Fetch the latest MetaEvidence log for each candidate `_metaEvidenceID`.
2. Fetch both MetaEvidence JSON files.
3. Classify by explicit policy language: titles, descriptions, or field names that distinguish registration from removal.
4. Cross-check against action context: `addItem` must use the registration stream; `removeItem` must use the clearing stream.
5. If still ambiguous after steps 1–4, stop and warn the user. Do not guess.

(Scout registries use these same LGTCR mechanics — see `scout-registries.md` for the 4 specific registry addresses.)

---

### PGTCR specifics

PermanentGTCR registries use a **single MetaEvidence URI** — there is no registration/clearing distinction. Do not apply the LGTCR two-stream model to PGTCR registries.

**Primary path: Goldsky subgraph**

Query `registry.arbitrationSettings[0].metaEvidenceURI` from the Goldsky subgraph for the registry.
(Specific Goldsky endpoint URLs are in `stake-curate.md` — Phase 3 scope.)

**Fallback: onchain eth_getLogs**

When the subgraph is unavailable, use the same `eth_getLogs` method described above. The same topic0 applies — PGTCR emits the same `MetaEvidence(uint256,string)` event. Take the latest log by block/logIndex.

Fetch the MetaEvidence JSON from the URI using the same gateway pattern above. Extract `metadata.columns[]` for item construction.
