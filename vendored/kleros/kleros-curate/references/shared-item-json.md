# Shared: item.json Construction
<!-- Sources: curate-v1/curate-light-skill.md §3, curate-v1/pgtcr-stake-curate-skill.md §5C, curate-v1-scout/scout-skills.md §8 -->

Fetch MetaEvidence before starting. Do not ask users for schema fields until you have `metadata.columns`
from the current MetaEvidence. (Fetch MetaEvidence: `shared-metaevidence.md`)

---

## Output shape

Every item.json submitted to any Curate registry must contain both parts:

```json
{
  "columns": [ /* full column objects, verbatim from MetaEvidence.metadata.columns */ ],
  "values":  { "<col.label>": "<user value>", ... }
}
```

**WHY:** The Curate UI and subgraph indexers parse this exact envelope. Submitting only a `values`
object, or omitting `columns`, causes display errors and indexing failures.

---

## columns deep-copy rule

Set `item.columns = MetaEvidence.metadata.columns` by **deep copy** — same objects, same key/value
pairs (`label`, `description`, `type`, `isIdentifier`), same order. Do not edit any field.

**WHY:** The `columns` array is the schema contract. Any edit — even correcting a typo in a
`description` — means the submitted columns no longer match the on-chain schema that jurors use to
evaluate compliance. The columns you submit are what gets stored; jurors read them directly.

---

## Output protocol

When producing an item.json, follow this sequence:

1. Print **`Fetched columns (verbatim):`** and display the columns array exactly as obtained from
   MetaEvidence (verbatim JSON).
2. Then print the final `item.json` where `columns` is a copy/paste of step 1 and only `values`
   is filled dynamically.

If you did not fetch MetaEvidence, do **not** output an item.json — ask for the registry address,
chain, and MetaEvidence URI first.

**WHY:** LLMs tend to paraphrase field names and descriptions. The explicit print step creates an
auditable record that makes the verbatim requirement enforceable and gives the user a chance to catch
any rewriting before submission.

---

## values construction

For each `col` in `columns` **in order**:

- Key = `col.label`, **exact string match** — including spaces, punctuation, and case.
- Value = user input for that field, typed per `col.type` (see field-value types below).

No extra keys. No renamed labels. No reordering. No empty required fields unless the registry policy
explicitly permits omission.

---

## Field-value types

| Type | Value format |
|------|-------------|
| `text` | Plain string |
| `longText` | Plain string (multi-line allowed) |
| `link` | URL string |
| `address` | `0x`-prefixed Ethereum address |
| `richAddress` | CAIP-10 format: `eip155:<chainId>:0xAddress` |
| `image` | `/ipfs/<CID>` path — never a gateway URL |
| `number` | String or number — observe from NewItem sampling (see below) |

**CAIP-10 (richAddress) — WHY:** CAIP-10 makes the chain explicit. A bare address on the wrong chain
resolves to a different account and will fail compliance checks. Ask the user for the chain when a
`richAddress` field is required; do not guess from context.

**Image path — WHY:** Gateway URLs are mutable and host-specific. On-chain storage must be
content-addressed. Use `/ipfs/<CID>` so the reference is permanent and chain-independent.

---

## Placeholder rule

While drafting with the user, you may use these placeholders (then replace before submitting):

- `PLACE_VALUE_HERE`
- `PLACE_IPFS_URI_HERE` (must become `/ipfs/<CID>`)

Never submit a transaction with placeholder values.

---

## Schema confirmation via NewItem event sampling

Perform this check once per MetaEvidence version, before the first submission:

1. Find the block of the latest MetaEvidence update (`B_meta`).
2. Find any `NewItem` event emitted **after** `B_meta` for this registry.
3. Fetch the `_data` field from that event (typically an `/ipfs/<CID>` URI pointing to a prior item.json).
4. Fetch that item JSON from IPFS.
5. Confirm `item.columns` matches `MetaEvidence.metadata.columns` (same labels, same order, same types).
6. Observe how `item.values` encodes each type — particularly `number` fields (strings vs numbers).

If the sample uses strings for `number` fields (very common in Curate), you must match that.
If there is any mismatch between the sample and MetaEvidence, stop and ask — do not improvise.

**WHY:** MetaEvidence describes column types in human terms (`"address"`, `"number"`) but not
serialization details. Past submissions reveal the actual encoding the contract expects — this
information is only observable onchain, not derivable from the schema alone.

---

## Programmatic checklist

Before uploading item.json to IPFS, verify all five conditions:

1. `item.columns` deep-equals `MetaEvidence.metadata.columns` — same objects, same order, same strings
2. `Object.keys(item.values)` equals exactly `columns.map(c => c.label)` — no missing keys, no extras
3. Every value is non-empty unless the registry policy explicitly permits omission
4. Any `image`-type value is an `/ipfs/<CID>` path, not a gateway URL
5. Any `richAddress`-type value is in CAIP-10 format (`eip155:<chainId>:0xAddress`)

If any item fails, fix the construction before uploading. Do not submit a broken item.json.

## Common failure modes

Avoid these construction mistakes:

- **Renaming labels** — `"Name"` → `"Token Name"` breaks the schema contract; values won't map
- **Reordering columns** — contracts may parse positionally; order must match MetaEvidence exactly
- **Rewriting descriptions** — even correcting grammar invalidates the verbatim copy requirement
- **Changing `isIdentifier` flags** — alters which fields the subgraph uses as identity keys
- **Building schema from UI or policy text** — only valid source is `MetaEvidence.metadata.columns`
  fetched from the contract; never reconstruct from screenshots, memory, or policy PDFs
