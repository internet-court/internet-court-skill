---
name: kleros-curate
description: "Interact with Kleros Curate registries — the decentralized token-curated list protocol for token lists, address tags, and policy-driven curation. Use this skill when the user mentions Curate, Light Curate, LightGeneralizedTCR, LGTCR, LightCurate, Stake Curate, PermanentGTCR, PGTCR, Scout, token-curated registry, TCR, curated list, decentralized registry, registry, token list, address tags, CDN tags, Goldsky, or Solidity functions addItem, removeItem, challengeItem, challengeRequest. Covers all three flavors — Light Curate (LGTCR, optimistic challenge window), Stake Curate (PGTCR, permanent ERC20 stake), and Scout (Gnosis registries for contract/token tagging). Also trigger when the user wants to submit an item to a registry, challenge a submission, remove an item, appeal a dispute on a registry item, deploy a new Curate registry, curate a list, browse registry entries, check whether an address is tagged, add a token to a token list, query a curated list, or fund an appeal round. Even if Curate is not mentioned, trigger when the user describes registry operations — adding entries to a list, checking item status, browsing items, querying a decentralized list — combined with Kleros context signals (Kleros, arbitrator, dispute, juror, PNK). Do NOT trigger for non-Kleros registries or generic IPFS uploads without Curate context — IPFS uploads belong to kleros-ipfs-upload. Exception: if the user explicitly names the kleros-curate skill or asks to test this skill, trigger regardless of context."
---

# Kleros Curate

Kleros Curate is a decentralized verification system for exclusive, policy-driven registries. Registries are
governed by a policy document stored on IPFS — every submission is judged against that policy, and jurors
consult it if a dispute arises.

**The deposit/challenge/arbitration cycle:**

1. A submitter proposes an item and locks a submission deposit as a pledge that the item complies with the
   registry policy.
2. The item enters a challenge window (configurable per registry, typically days to weeks). Anyone can review
   submissions during this window.
3. If nobody challenges within the window, the item is accepted and the submitter's deposit is returned in
   full — compliant submissions carry no permanent inclusion cost.
4. If a challenger believes the submission violates the policy, they lock a challenge deposit and open a
   Kleros dispute. Impartial Kleros jurors read the policy and render a verdict.
5. The winner captures the loser's deposit as a bounty. The two-sided stake mechanism rewards accuracy and
   discourages frivolous challenges in both directions.

**Why onchain-first matters:**

Deposit amounts, arbitration costs, MetaEvidence URIs, and challenge windows are all live onchain state —
they change when registry governors update parameters. Any cached or estimated value is a liability: an agent
that submits the wrong deposit amount will have its transaction revert. Always read live values before acting.

**Three contract flavors:**

- **Light Curate (LGTCR)** — `LightGeneralizedTCR`: optimistic challenge window, ETH deposits, the most
  widely deployed flavor. Used by the majority of Curate registries across Ethereum and Gnosis.
- **Stake Curate (PGTCR)** — `PermanentGTCR`: permanent ERC20 stake (not returned on item removal),
  Goldsky subgraph as primary data source, different status model (Submitted / Reincluded / Disputed / Absent
  + withdrawal flow). Identified by PGTCR-specific hallmark read calls (see `references/stake-curate.md`).
- **Scout** — LGTCR contracts on Gnosis, specialized for 4 well-known registries (contract address tags,
  token lists, address tags, CDN mappings). Scout IS an overlay on LGTCR — it is not a separate contract
  type. Working with Scout always requires both `references/scout-registries.md` (Scout-specific context)
  and `references/light-curate.md` (LGTCR contract operations).

## Non-negotiables

These rules apply across all Curate flavors. They are always in context; reference files may not repeat them.

- **Never guess / invent / approximate** amounts, addresses, schemas, or parameters.
- **Onchain state + onchain logs are the source of truth** for deposits, arbitration cost, challenge deposits, appeal status, and MetaEvidence URI.
- **Never assume a "standard token schema"** — only the current MetaEvidence for that registry is authoritative.
- **Never rewrite the schema**: `item.json.columns` must be copied verbatim from MetaEvidence; only `values` is dynamic.
- **Never include "typical ranges" or estimates** for deposits or fees — only report live-read values.
- **`eth_getCode` before declaring any address is or isn't a contract.**

## Which Curate flavor are you using?

**Step 1 — Keyword scan (zero cost)**

- Mentions "Scout", "token list", "address tags", "CDN"
  → **Scout** (overlay on Light Curate — LGTCR contracts on Gnosis)
  → Read `references/scout-registries.md` AND `references/light-curate.md` (both required; Scout adds context on top of LGTCR operations)

- Mentions "PGTCR", "Stake Curate", "PermanentGTCR", "Goldsky"
  → **Stake Curate (PGTCR)**
  → Read `references/stake-curate.md`

- Mentions "Curate", "LGTCR", "LightGeneralizedTCR", "Light Curate", "addItem", "registry", or no flavor hint
  → **Light Curate (LGTCR)** (also the default)
  → Read `references/light-curate.md`

**Step 2 — Ambiguous ("Curate" with no flavor hint)**

- **Interactive session**: ask one question — "Which Curate flavor? Light Curate (optimistic challenge window, ETH deposits), Stake Curate (permanent ERC20 stake, Goldsky subgraph), or Scout (4 Gnosis registries for contract/token tagging)?"

- **One-shot / non-interactive**: default to Light Curate, then progressively correct:
  - If user provides a contract address: check if it matches one of the 4 known Scout registry addresses → load Scout overlay (read `references/scout-registries.md` AND `references/light-curate.md`)
  - If contract introspection reveals PGTCR hallmarks → pivot to Stake Curate (read `references/stake-curate.md` for hallmark calls)
  - Otherwise: proceed as Light Curate

**Step 3 — Contract-type verification (if address provided)**

See the flavor reference file for hallmark calls — SKILL.md does not embed function signatures here (contract-type detection belongs in each flavor's reference file).

## Action index

**Submit item to a registry** → `references/light-curate.md` (LGTCR) or `references/stake-curate.md` (PGTCR)

**Challenge / remove an item** → flavor reference file

**Submit evidence** → flavor reference file

**Fund an appeal** → flavor reference file

**Deploy a new registry (factory)** → flavor reference file (factory section)

**Fetch MetaEvidence (policy + schema)** → `references/shared-metaevidence.md`

**Compute deposits** → `references/shared-deposits.md`

**Build item.json** → `references/shared-item-json.md`

**Upload to IPFS** → `references/shared-ipfs-upload.md`

**ABI / function signatures** → `references/shared-abi-fragments.md`
  grep: `grep -n "function\|event" references/shared-abi-fragments.md`

**Scout registry addresses + seed templates** → `references/scout-registries.md`
  grep: `grep -n "0x\|ATQ\|Address Tags\|Tokens\|CDN" references/scout-registries.md`

## Common workflows

**Submit an item (any flavor):**
1. `references/shared-metaevidence.md` — fetch schema (columns) and policy URI
2. `references/shared-item-json.md` — build the item.json payload
3. `references/shared-ipfs-upload.md` — upload item.json to IPFS, get CID
4. `references/shared-deposits.md` — compute exact msg.value
5. Flavor reference (`light-curate.md` or `stake-curate.md`) — send the addItem transaction

**Challenge or remove an item:**
1. `references/shared-metaevidence.md` — fetch the applicable policy (clearing policy for removal; registration policy for challenge)
2. `references/shared-ipfs-upload.md` — upload evidence JSON to IPFS
3. `references/shared-deposits.md` — compute the challenge deposit
4. Flavor reference — send the challenge or removeItem transaction

**Deploy a new registry:**
1. `references/shared-metaevidence.md` — prepare MetaEvidence JSON (policy URI + column schema)
2. `references/shared-ipfs-upload.md` — upload MetaEvidence JSON to IPFS
3. Flavor reference — call the factory deploy function

## Reference files

These 8 files are loaded on demand — only when needed for the current task. The action index above points
to the right file for each operation. Loading an unnecessary reference file wastes context.

**`references/light-curate.md`**
Light Curate (LightGeneralizedTCR) operations end-to-end: minimum inputs to ask the user, registry
discovery via `eth_getCode` and hallmark reads, MetaEvidence retrieval, item.json construction, submit
item, challenge / remove item, submit evidence, fund an appeal, deploy a new registry via factory.
Read this file for any LGTCR contract interaction — and always alongside `references/scout-registries.md`
when working on Scout.

**`references/stake-curate.md`**
Stake Curate (PermanentGTCR) operations end-to-end: PGTCR hallmark detection (distinguishes PGTCR from
LGTCR), ERC20 approval + stake deposit flow, Goldsky subgraph as primary MetaEvidence source with onchain
fallback, PGTCR status model (Submitted / Reincluded / Disputed / Absent), item withdrawal flow, deploy
factory. Read this file for any PGTCR contract interaction.

**`references/scout-registries.md`**
Scout-specific overlay for the 4 known Gnosis registries (Tokens / Address Tags / Contract Domain Names /
CDN). Contains: the 4 registry contract addresses used for address-based routing, seed-first submission
pattern (fill from existing seed template, then submit), item.json templates per registry, image guidance,
incentives information. Always read alongside `references/light-curate.md` — Scout IS LGTCR at the
contract layer; this file adds Scout-only context on top.

**`references/shared-metaevidence.md`**
Shared MetaEvidence retrieval applicable to all Curate flavors: `eth_getLogs` method with the correct
topic0, sort-and-take-latest rule, two-stream MetaEvidence classification for LGTCR (registration events
vs clearing events), Goldsky subgraph path for PGTCR, MetaEvidence JSON structure, policy URI extraction.
Read this file before fetching MetaEvidence for any registry, regardless of flavor.

**`references/shared-deposits.md`**
Shared deposit computation covering all Curate flavors: submission deposit formula for LGTCR, challenge
deposit formula for LGTCR, PGTCR stake vs arbitration deposit distinction (ERC20 stake is separate from
the native-token arbitration cost), `arbitrationCost()` read pattern, `msg.value` assembly rule.
Read this file before computing any deposit or constructing any transaction value.

**`references/shared-item-json.md`**
Shared item.json construction rules: the `columns + values` schema format, verbatim-copy rule for columns
(copy from MetaEvidence without modification — values is the only dynamic part), values population from
user-supplied input, schema confirmation via `NewItem` event sampling to verify field order before
submitting. Read this file before building any item payload for any Curate registry.

**`references/shared-abi-fragments.md`**
Shared ABI fragments for all Curate contracts: `LightGeneralizedTCR` read and write function signatures,
`PermanentGTCR` read and write function signatures, `IArbitrator` interface ABI, key event signatures
(`MetaEvidence`, `ItemStatusChange`, `RequestSubmitted`, etc.). Use `grep -n "function\|event"` to
navigate this file. Read when you need function selectors, calldata encoding, or event topic hashes.

**`references/shared-ipfs-upload.md`**
Shared IPFS upload guidance for Curate workflows: durability rationale (third-party pins can disappear
after on-chain anchoring), recommended path via the `kleros-ipfs-upload` skill (Kleros-operated pins
have strong availability incentives), `/ipfs/<CID>` format rule (avoid double-slash when building URLs),
agent autonomy note (the skill is recommended, not required — agents may use any IPFS mechanism).
Read before any IPFS upload step inside a Curate workflow.
