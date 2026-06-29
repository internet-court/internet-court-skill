# Scout Registries (Gnosis)

> Scout IS LightGeneralizedTCR on Gnosis. This file covers Scout-specific context only.
> For all contract operations (submit item, challenge, evidence, appeal, factory deploy),
> also load `references/light-curate.md`.

## Overview

Scout is a curated data layer built on top of LightGeneralizedTCR contracts deployed on Gnosis Chain. It covers 4 registries with 700k+ entries consumed by Etherscan-style explorers, Blockscout, Ledger Live, and other ecosystem infrastructure. Verified entries surface in address labeling, token display, and domain-to-contract resolution across these platforms.

Scout IS LightGeneralizedTCR. Not a separate contract type — the same LGTCR contracts running under a specific overlay of fixed addresses and seed templates. All contract operations (submit, challenge, evidence, appeal, factory deploy) live in `references/light-curate.md`. This file adds the Scout-specific context: registry addresses, seed templates, view helper, scout-api, image requirements, and incentive framing.

**Seed-first inversion:** when submitting to Scout registries, use the embedded seed template from this file as the primary JSON source. Fetch MetaEvidence as a cross-check — not as the primary schema source. WHY: seed templates include the full `{ columns, values }` shape with field ordering, types, and required vs optional fields — safer than inferring structure from MetaEvidence interpretation alone. If seed and MetaEvidence clearly disagree on labels, ordering, or required fields: stop and escalate rather than guessing.

## The 4 registry addresses

All registries are on **Gnosis (chainId: 100)**. Native deposit token: xDAI.

| Registry | Address | Purpose |
|----------|---------|---------|
| ATQ (Address Tags Query) | `0xAe6aaed5434244be3699c56E7Ebc828194F26dc3` | Look up existing address tags by repository/commit |
| Address Tags | `0x66260C69d03837016d88c9877e61e08Ef74C59F2` | Submit address → label mappings |
| Kleros Tokens | `0xeE1502e29795Ef6C2D60F8D7120596abE3baD990` | Submit token metadata (name, symbol, logo) |
| CDN (Contract Domain Names) | `0x957A53A994860BE4750810131d9c876b2f52d6E1` | Submit domain → contract address mappings |

Entity ID format for PGTCR subgraph cross-references: `<itemID>@<registryAddress>` — useful for GraphQL lookups when cross-referencing Scout items from subgraph queries.

## Seed-first submission pattern

**Traditional flow (do NOT use for Scout):** fetch MetaEvidence → infer schema → build `item.json`.

**Seed-first flow (correct for Scout):**
1. Load the seed template for the target registry from this file.
2. Prefill field values — replace all `PLACE_VALUE_HERE` placeholders with real data.
3. Fetch MetaEvidence from the registry (see `shared-metaevidence.md § LGTCR specifics`).
4. Cross-check: confirm field labels, ordering, and required fields match between seed and MetaEvidence.
5. If they agree: proceed to upload and submit.
6. If they clearly disagree: stop and ask rather than guessing which is current.

WHY seed-first: "The embedded seed templates include the full `{columns, values}` JSON shape including field ordering, types, and required vs optional fields. MetaEvidence is the authoritative schema, but the seed is a pre-validated snapshot — using it first reduces the risk of field order mistakes or missing required fields."

Do not change column names or type strings — these must match the current MetaEvidence schema. For item.json construction rules (deep-copy rule, values population, schema confirmation): `shared-item-json.md`.

## item.json templates per registry

These are the default `item.json` shapes for each Scout registry. Use as starting point — replace `PLACE_VALUE_HERE` placeholders with actual values. Do not change column names or type strings — these must match the current MetaEvidence schema.

### ATQ (Address Tags Query)

```json
{
  "columns": [
    {
      "label": "Github Repository URL",
      "description": "The URL of the repository containing the function that returns the Contract Tags.  The repository name must be in the kebab case (hyphen-case).",
      "type": "link",
      "isIdentifier": true
    },
    {
      "label": "Commit hash",
      "description": "The hash of the specific commit for this repository to be referenced.",
      "type": "text",
      "isIdentifier": true
    },
    {
      "label": "EVM Chain ID",
      "description": "The integer EVM Chain ID of the chain of the contracts being retrieved by the function in this module.",
      "type": "number",
      "isIdentifier": true
    },
    {
      "label": "Description",
      "description": "A field used to describe the range of contracts being curated here, specifying (if applicable) the version, type and purpose of the contracts that are returned. ",
      "type": "long text",
      "isIdentifier": false
    }
  ],
  "values": {
    "Github Repository URL": "PLACE_VALUE_HERE",
    "Commit hash": "PLACE_VALUE_HERE",
    "EVM Chain ID": "PLACE_VALUE_HERE",
    "Description": "PLACE_VALUE_HERE"
  }
}
```

### Address Tags

```json
{
  "columns": [
    {
      "label": "Contract Address",
      "description": "The address of the smart contract being tagged. Will be store in CAIP-10 format if the chain is properly selected in the UI.",
      "type": "rich address",
      "isIdentifier": true
    },
    {
      "label": "Public Name Tag",
      "description": "The Public Name tag of a contract address indicates a commonly-used name of the smart contract and clearly identifies it to avoid potential confusion. (e.g. Eth2 Deposit Contract).",
      "type": "text",
      "isIdentifier": true
    },
    {
      "label": "Project Name",
      "description": "The name of the project that the contract belongs to. Can be omitted only for contracts which do not belong to a project",
      "type": "text",
      "isIdentifier": true
    },
    {
      "label": "UI/Website Link",
      "description": "The URL of the most popular user interface used to interact with the contract tagged or the URL of the official website of the contract deployer (e.g. https://launchpad.ethereum.org/en/).",
      "type": "link",
      "isIdentifier": true
    },
    {
      "label": "Public Note",
      "description": "The Public Note is a short, mandatory comment field used to add a comment/information about the contract that could not fit in the public name tag (e.g. Official Ethereum 2.0 Beacon Chain deposit contact address).",
      "type": "text"
    }
  ],
  "values": {
    "Contract Address": "PLACE_VALUE_HERE",
    "Public Name Tag": "PLACE_VALUE_HERE",
    "Project Name": "PLACE_VALUE_HERE",
    "UI/Website Link": "PLACE_VALUE_HERE",
    "Public Note": "PLACE_VALUE_HERE"
  }
}
```

### Kleros Tokens

```json
{
  "columns": [
    {
      "label": "Address",
      "description": "The address of the smart contract being tagged. Will be store in CAIP-10 format if the chain is properly selected in the UI.",
      "type": "rich address",
      "isIdentifier": true
    },
    {
      "label": "Name",
      "description": "The name of the token",
      "type": "text",
      "isIdentifier": true
    },
    {
      "label": "Symbol",
      "description": "The symbol/ticker of the token",
      "type": "text",
      "isIdentifier": true
    },
    {
      "label": "Decimals",
      "description": "The number of decimals applicable for this token",
      "type": "number"
    },
    {
      "label": "Logo",
      "description": "The PNG logo of the token (at least 128px X 128px in size",
      "type": "image",
      "isIdentifier": false
    },
    {
      "label": "Website",
      "description": "The URL of the token project's official website. Its primary source for documentation, token specifications, and team information (e.g. https://chain.link).",
      "type": "link",
      "isIdentifier": true
    }
  ],
  "values": {
    "Address": "PLACE_VALUE_HERE",
    "Name": "PLACE_VALUE_HERE",
    "Symbol": "PLACE_VALUE_HERE",
    "Decimals": "PLACE_VALUE_HERE",
    "Logo": "PLACE_IPFS_IMAGE_URI_HERE",
    "Website": "PLACE_VALUE_HERE"
  }
}
```

### CDN (Contract Domain Names)

```json
{
  "columns": [
    {
      "label": "Contract address",
      "description": "The address of the contract in question. Case-sensitive only if required by the blockchain that the address pertains to (e.g. Solana). ",
      "type": "rich address",
      "isIdentifier": true
    },
    {
      "label": "Domain name",
      "description": "The specific (sub)domain name of the dApp where this contract is meant to be accessed from.  Wildcards (*) are acceptable as part of this field if proof can be shown that the contract is intended to be used across multiple domains.",
      "type": "text",
      "isIdentifier": true
    },
    {
      "label": "Visual proof",
      "description": "If the domain is a specific root or subdomain, this must be a screenshot of the exact page and setup where this particular address can be interacted from.",
      "type": "image",
      "isIdentifier": false
    }
  ],
  "values": {
    "Contract address": "PLACE_VALUE_HERE",
    "Domain name": "PLACE_VALUE_HERE",
    "Visual proof": "PLACE_IPFS_IMAGE_URI_HERE"
  }
}
```

## LightGeneralizedTCRView helper

Address: `0xB32e38B08FcC7b7610490f764b0F9bFd754dCE53` (deployed on Gnosis, chainId 100 — hardcoded, immutable deployment).

Use for read-heavy operations — batches multiple registry reads into fewer RPC calls.

| Function | Returns | Use for |
|----------|---------|---------|
| `fetchArbitrable(address _address)` | Registry params batch (submissionBaseDeposit, arbitrator, etc.) | Efficient param reads — prefer over individual reads |
| `getItem(address _address, bytes32 _itemID)` | Single item with full request data | Item state inspection |
| `getLatestRequestData(address _address, bytes32 _itemID)` | Current request info | Active request state |
| `getLatestRoundRequestData(address _address, bytes32 _itemID, uint256 _requestID)` | Round info for appeal state | Appeal eligibility |
| `availableRewards(address _address, address _contributor, bytes32 _itemID, uint256 _requestID, uint256 _roundID)` | Pending withdrawal amount | Reward withdrawal prep |

**Usage rule:** prefer the view helper for read-heavy operations — reduces RPC call count.

**Fallback:** if the helper returns stale data or reverts, fall back to direct `LightGeneralizedTCR` reads (see `light-curate.md`).

For the full view helper ABI: `shared-abi-fragments.md`.

## scout-api integration

Optional pre-submission research endpoint. Use to check for existing entries before submitting.

```
POST https://scout-api.kleros.link/api/address-tags
Body: { "address": "0x...", "chains": [1, 100, ...] }
```

**scout-api is optional and supporting — NOT canonical source.** Use only for pre-submission research to avoid duplicate submissions. Not a hard gate — if scout-api is unavailable or returns no results, submission can still proceed.

Do not treat scout-api responses as proof that an item is or is not already in the registry. The policy and live registry state remain the primary acceptance standard.

## Image guidance

Scout-specific image requirements:

**Kleros Tokens registry — token logo:**
- PNG format required
- Minimum 128×128 pixels, square aspect ratio
- Transparent background preferred
- File size: under 200KB
- WHY: explorers and wallets display token logos at small sizes — low-res or non-square images display poorly

**CDN (Contract Domain Names) registry — visual proof:**
- Screenshot of the exact domain or subdomain page with the contract address visible in context (in the URL bar or as page content)
- Must demonstrate the domain/subdomain authoritatively points to the contract address
- WHY: the CDN registry links domains to contracts — the screenshot is the proof of that link
- Wildcards (`*`) in domain names require proof the contract is used across multiple domains

**ATQ and Address Tags registries:** no image required.

For upload mechanics (gateway selection, `/ipfs/` path format, durability): `shared-ipfs-upload.md`.

## Incentives (current campaign)

Scout participation offers three profit paths:

1. **Project visibility** — verified entries surface in Etherscan labels, Ledger Live, and Blockscout address tagging. Increases ecosystem discoverability for projects.

2. **Submitter upside** — approved submissions earn a fraction of challenge deposits when challengers fail, over time.

3. **Challenger upside** — successful challenges on non-compliant submissions earn the submitter's deposit.

For current campaign terms, reward amounts, and active incentive programs: check [blog.kleros.io](https://blog.kleros.io/).

WHY no amounts here: incentive figures change with governance votes. A specific number here becomes misleading the day the campaign changes — the blog post is always current.

## Submission checklist

Run through this before submitting to any Scout registry:

- [ ] Target registry confirmed — one of the 4 fixed addresses above (Gnosis chainId 100)
- [ ] Seed template loaded for the correct target registry from this file
- [ ] All `PLACE_VALUE_HERE` and `PLACE_IPFS_IMAGE_URI_HERE` replaced with real values
- [ ] JSON syntax valid (balanced braces, correct commas, all strings quoted)
- [ ] Type strings unchanged from seed — do not normalize or rename (e.g., keep `"long text"`, `"rich address"`, `"image"` verbatim)
- [ ] Latest MetaEvidence fetched and cross-checked against seed — labels and order agree
- [ ] Policy document read — item complies with registry policy
- [ ] Image uploaded to IPFS if required (Kleros Tokens logo or CDN visual proof) — `/ipfs/<CID>` in field
- [ ] Deposit computed live from fresh onchain reads — do not use cached values
- [ ] Submission total deposit = `submissionBaseDeposit()` + `arbitrationCost()` (see `shared-deposits.md § LGTCR specifics`)
- [ ] Simulation passed with same calldata and `msg.value` as the real transaction
- [ ] No unresolved stop signal from policy review or MetaEvidence cross-check
- [ ] No duplicate entry visible in the registry for the same item
