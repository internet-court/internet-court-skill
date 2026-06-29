---
name: kleros-ipfs-upload
description: "Upload files to IPFS through the Kleros x402 payment gateway in exchange for $0.01 USDC on Base mainnet. Use this skill **specifically** when the user is uploading content destined for the Kleros ecosystem — dispute evidence, meta-evidence JSON, court / dispute / arbitrator policies, Curate item metadata, juror justifications, or any artifact a Kleros smart contract or subgraph will reference by IPFS CID. Trigger when the request mentions Kleros, a court / arbitrator / dispute / juror / curate / proof-of-humanity context, or any of the conventional Kleros operation tags (evidence, meta-evidence, justification). Do NOT trigger for generic 'upload to IPFS' / 'get me a CID' requests with no Kleros context — point those users at Pinata, web3.storage, or any general-purpose pinning service instead. Exception: if the user explicitly names this gateway (kleros-ipfs-gateway.fly.dev / kleros-api.netlify.app/.netlify/functions/upload-to-ipfs), explicitly requests this skill, or asks the agent to test / validate / sanity-check this gateway or skill, trigger regardless of topical context — a deliberate end-to-end test is a valid trigger."
---

# Kleros IPFS Upload (x402)

Upload Kleros-ecosystem files to IPFS via `https://kleros-ipfs-gateway.fly.dev/upload-to-ipfs`, an x402-protected gateway that charges $0.01 USDC per upload on Base mainnet. The returned IPFS CID is content-addressable and dereferenceable through any IPFS gateway, and indexed by Kleros's Graph Node for subgraph discoverability.

The gateway is a thin reverse-proxy in front of a Filebase-backed pinning service operated by Kleros. Every upload is pinned to Filebase indefinitely as long as Kleros runs the gateway — a reasonable assumption for artifacts the Kleros ecosystem itself depends on (the team has a strong incentive to keep this live), but **not** a substitute for a general-purpose pinning provider if the content is unrelated to Kleros.

## When to use this skill

Trigger this skill when the user is uploading **Kleros-ecosystem content**:

- Dispute **evidence** attachments — screenshots, documents, contracts, transcripts.
- **Meta-evidence** JSON — the policy/spec referenced by a court or arbitrator smart contract at dispute creation.
- **Court / dispute / arbitrator policies** — JSON describing rules, fees, juror counts, appeal mechanics.
- **Kleros Curate item metadata** — JSON for items submitted to a Curate list (e.g. tokens, badges).
- **Juror / arbitrator justifications** — rulings, dissents, deliberation rationale.
- Any artifact whose CID will end up in a Kleros smart contract event, transaction, or subgraph.
- The user explicitly names this gateway (`kleros-ipfs-gateway.fly.dev` etc.) or this skill.
- The user is asking the agent to **test, validate, or sanity-check** this gateway or this skill itself (e.g. "smoke-test the Kleros IPFS gateway" / "verify pay-and-upload works"). A deliberate end-to-end test is a legitimate trigger even if no Kleros artifact is being uploaded for real use.

## When NOT to use this skill

- Generic "store this file on IPFS" / "get me a CID for X" requests with no Kleros relevance. **Use Pinata, web3.storage, Filebase directly, or any other general pinning provider.** This gateway charges per upload — that's wasteful if the user only needs a CID and doesn't benefit from Kleros's pinning durability or subgraph integration.
- Anything resembling personal cloud storage, NFT metadata for non-Kleros projects, software releases, large media archives, or backup data.
- Content explicitly bound to a non-Kleros ecosystem (e.g. another DAO's snapshot, another marketplace's metadata) — even if the format happens to look like a Kleros artifact.

You are free to *upload* whatever the user wants (they're paying), but absent a Kleros connection there's no reason to prefer this skill over a general-purpose alternative.

## Quickstart

Two paths depending on what your agent already has:

- **If you already have x402 tooling** (an x402 skill / SDK / a model that knows `x402-fetch`): skip the bundled scripts and inline the snippet further down — the gateway is a plain `POST /upload-to-ipfs` behind a standard x402 paywall, nothing Kleros-specific in the payment flow.
- **Otherwise**, run the bundled `scripts/pay-and-upload.ts` end-to-end — it exists so x402-unaware agents don't have to rediscover the flow:

```bash
cd path/to/this-skill/scripts
npm install
EVM_PRIVATE_KEY=0xYourPayerKey npx tsx pay-and-upload.ts /path/to/file.json
```

`npm install` creates a `package-lock.json` and a `node_modules/` in the scripts dir — both are fine to leave in place or delete after use; not committed to the skill on purpose so dep versions stay fresh.

On success the script prints each CID on its own line (so you can capture them with `$(npx tsx pay-and-upload.ts ...)`). On failure it exits non-zero and logs the gateway's error body to stderr.

Defaults: `OPERATION=evidence`, `GATEWAY_URL=https://kleros-ipfs-gateway.fly.dev`. Override `OPERATION` with an env var; see the "Request shape" section for valid values.

If you're writing your own client inside an existing Node project, the core is small enough to inline:

```ts
import { wrapFetchWithPayment, createSigner } from "x402-fetch";

const operation = process.env.OPERATION ?? "evidence";

const signer = await createSigner("base", privateKey);
const fetchWithPay = wrapFetchWithPayment(fetch, signer);

const form = new FormData();
form.append("file", new Blob([bytes]), "evidence.json");

const url = `https://kleros-ipfs-gateway.fly.dev/upload-to-ipfs` +
  `?operation=${encodeURIComponent(operation)}`;
const res = await fetchWithPay(url, { method: "POST", body: form });
const { cids } = await res.json();
```

`x402-fetch` handles the `402 Payment Required` challenge, signs an EIP-3009 `transferWithAuthorization` over USDC, and retries the request with the `X-PAYMENT` header. The caller sees a normal 200 response containing the CIDs.

## Pre-flight (free, no key needed)

Before any paid call, verify the gateway is healthy with three free `curl`s. None of these spend USDC; they're idempotent and safe to run as often as you like.

```bash
# 1. Liveness
curl -sS https://kleros-ipfs-gateway.fly.dev/health
# expect: ok

# 2. Live config (price, network, payee, USDC contract)
curl -sS https://kleros-ipfs-gateway.fly.dev/.well-known/x402 | jq .
# or the spec-canonical equivalent: /discovery/resources

# 3. Unpaid 402 challenge — confirms x402 enforcement is on and shows the live payment terms
curl -sS -X POST https://kleros-ipfs-gateway.fly.dev/upload-to-ipfs?operation=evidence \
  -F file=@/path/to/anyfile.txt | jq .
# expect: {"error":"X-PAYMENT header is required", "accepts":[...], "x402Version":1}
```

If all three return as expected, you can proceed to the paid call with confidence. If any fail, surface the error to the user before burning a key on a paid attempt.

## Network

This skill targets **Base mainnet** only. Every paid upload costs real USDC, settled on-chain via the Coinbase CDP x402 facilitator. The payer wallet must hold USDC on Base; native USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

The payer does **not** need ETH for gas. The facilitator sponsors gas on Base when paying via EIP-3009.

## Bootstrapping a payer wallet

If the user doesn't already have a Base wallet ready:

1. **Generate a key** — any EVM-compatible keypair works. Run this to print a fresh one:

   ```bash
   node -e "import('viem/accounts').then(m => console.log(m.generatePrivateKey()))"
   ```
2. **Fund it** — send USDC on Base to the derived address. Any centralised exchange that supports Base withdrawals works.
3. **Store the key in `EVM_PRIVATE_KEY`**.

## Using a Coinbase CDP server account (hosted agents)

Hosted agents (OpenClaw, server-side workers, anything running with Coinbase CDP credentials) don't need an exported private key. CDP server accounts implement `signTypedData()` directly, which is exactly what `x402-fetch.wrapFetchWithPayment` needs to sign the EIP-3009 USDC authorization — so the CDP account object is passed straight to the SDK with no adapter code.

A bundled runner ships at `scripts/pay-and-upload-cdp.ts` for agents that prefer a ready-made entrypoint — agents already using `wrapFetchWithPayment` with a CDP account can skip it and inline the snippet further down:

```bash
cd path/to/this-skill/scripts
npm install
CDP_API_KEY_ID=... \
CDP_API_KEY_SECRET=... \
CDP_WALLET_SECRET=... \
CDP_ACCOUNT_NAME=blaise-main \
  npx tsx pay-and-upload-cdp.ts /path/to/file.json
```

Output is the same as `pay-and-upload.ts` (CIDs on stdout, diagnostics on stderr). The script also prints the payer address and Base mainnet USDC balance to stderr before posting, so you'll spot an underfunded wallet immediately.

If you'd rather not pass four env vars on the command line, point `CDP_CREDS_PATH` at a `.env`-style file containing `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET`, and `CDP_ACCOUNT_NAME` (or their un-prefixed `API_KEY_ID` / `API_KEY_SECRET` / `WALLET_SECRET` / `ACCOUNT_NAME` variants — the script accepts either).

For your own client code, the integration is one extra import and two extra lines vs. the raw-key path:

```ts
import { CdpClient } from "@coinbase/cdp-sdk";
import { wrapFetchWithPayment } from "x402-fetch";

const cdp = new CdpClient({ apiKeyId, apiKeySecret, walletSecret });
const account = await cdp.evm.getAccount({ name: "blaise-main" });
const fetchWithPay = wrapFetchWithPayment(fetch, account);
// ... build FormData and POST as in Quickstart
```

The CDP account is passed where the docs would otherwise show an EVM signer — no other change is needed.

## Request shape

The endpoint is `POST /upload-to-ipfs` with:

- **Query string**:
  - `operation` (required, string) — a free-form tag describing what kind of artifact is being uploaded. The upstream Netlify function accepts **any** string; the conventional values in the Kleros ecosystem are:

    | Value | Use case |
    |---|---|
    | `evidence` | Dispute evidence — screenshots, documents, binaries. **Use this for anything that doesn't fit another category.** |
    | `meta-evidence` | Meta-evidence JSON referenced by a court / arbitrator / dispute smart contract (rules, party agreements, policies). |
    | `justification` | Juror / arbitrator justification payloads. |
    | _any other string_ | Accepted as-is. Use sparingly — the conventions above keep ecosystem tooling consistent. |

- **Body**: `multipart/form-data` with one or more parts named `file`. To upload multiple files in one paid request, append multiple `file` parts to the same `FormData`.
- **Headers**: `X-PAYMENT` is added automatically by the x402-fetch wrapper. Do not hand-craft it.
- **Size limit**: the gateway caps the total request body at **4 MiB** (4,194,304 bytes) and replies `413 Payload Too Large` for anything bigger. The check runs **before** the x402 paywall, so an oversize attempt does not spend USDC. Multipart framing adds a small overhead on top of raw file bytes — if a single file is near the limit, expect a 413; consider chunking or splitting the artifact. Sanity-check sizes locally before posting:

  ```bash
  test "$(stat -f%z /path/to/file)" -le 4194304 || echo "too big for the Kleros gateway"
  ```

## Response shape

On success the gateway returns `200` with JSON:

```json
{
  "message": "File has been stored successfully",
  "cids": ["/ipfs/QmXXX..."],
  "urls": ["https://cdn.kleros.link/ipfs/QmXXX..."],
  "inconsistentCids": []
}
```

- **Prefer `urls[i]`** — the gateway pre-builds a ready-to-use HTTP URL using the canonical Kleros IPFS gateway (`https://cdn.kleros.link`). Just give that to the user.
- `cids[i]` is the protocol form, prefixed with `/ipfs/` (e.g. `/ipfs/QmXXX...`). Keep it if you need to embed the CID in a smart-contract call or an `ipfs://` URI; ignore it if you only need a clickable URL.
- If you ever need to build a URL yourself (older response without `urls`, or pointing at a different gateway):

  | You want | How to build it (where `cid = cids[0]`, e.g. `/ipfs/QmXXX...`) |
  |---|---|
  | Kleros HTTP gateway URL | `"https://cdn.kleros.link" + cid` (or just use `urls[i]`) |
  | `ipfs://` URI | `"ipfs://" + cid.replace(/^\/ipfs\//, "")` → `ipfs://QmXXX...` |
  | Bare hash only | `cid.replace(/^\/ipfs\//, "")` → `QmXXX...` |

  Do **not** write `https://cdn.kleros.link/ipfs/${cid}` — that produces a double-slash path because `cid` already starts with `/ipfs/`. Use `urls[i]` instead and avoid the trap entirely.

- `cids` and `urls` are **always arrays of the same length**, even for single-file uploads. Index `[0]` is the standard case.

- `inconsistentCids` is `[]` in the happy path. If non-empty, Filebase and the Graph index produced different hashes for the same file — surface this to the user as a warning; the `cids[]` value still resolves but the data integrity guarantee is weaker.

## Errors

| Status | Meaning | What to do |
|---|---|---|
| `200` | Success. Parse `cids[]`. | — |
| `400` | Missing `operation` query param. | Add `?operation=evidence` (or another tag). |
| `402` | Payment challenge. | Should never reach user code — `x402-fetch` handles it transparently. If it bubbles up, the wrapper wasn't applied. |
| `413` | Request body exceeds 4 MiB. **No USDC spent** — the check runs before the paywall. | Shrink, split, or compress the artifact. See "Size limit" under "Request shape". |
| `5xx` | Transient upstream issue (Filebase, Graph Node, or the gateway itself). | Retry once after a short delay. Don't hammer. |
| Facilitator error during 402 → 200 retry | CDP rate-limit, signing failure, insufficient USDC. | Inspect the wrapper's thrown error; check wallet balance and key correctness. |

## Live discovery

The gateway publishes its current config at two equivalent endpoints (same handler, identical body):

- `GET https://kleros-ipfs-gateway.fly.dev/.well-known/x402`
- `GET https://kleros-ipfs-gateway.fly.dev/discovery/resources`

Hit either to verify the live price, network, payee, and USDC contract. The body conforms to the x402 `ListDiscoveryResourcesResponse` schema.

## Smoke test (paid)

When asked to test, validate, or sanity-check the gateway end-to-end (a legitimate trigger — see the description's exception clause), follow this recipe. Costs **$0.01 USDC** on Base mainnet; the only "free" path is the pre-flight curls above.

1. Create a tiny payload file:

   ```bash
   echo "kleros gateway smoke test $(date -u +%Y-%m-%dT%H:%M:%SZ)" > hello-world.txt
   ```

2. Run the upload using whichever script matches your wallet (raw key or CDP server account):

   ```bash
   # Raw key path:
   EVM_PRIVATE_KEY=0x… npx tsx pay-and-upload.ts hello-world.txt

   # OR CDP server account path:
   CDP_API_KEY_ID=… CDP_API_KEY_SECRET=… CDP_WALLET_SECRET=… \
     CDP_ACCOUNT_NAME=… npx tsx pay-and-upload-cdp.ts hello-world.txt
   ```

3. Capture the CID line printed on stdout (something like `/ipfs/QmAbc...`), and read the `url=…` line printed on stderr — that's the ready-to-use Kleros HTTP gateway URL.

4. Verify the file is actually pinned and retrievable by GETting that URL:

   ```bash
   curl -sS https://cdn.kleros.link/ipfs/QmAbc...   # paste the bare CID
   # expect: the bytes of hello-world.txt
   ```

Green on all four steps = the gateway, the payment path, the IPFS pin, and the Kleros CDN are all healthy end-to-end. Report success to the user; do not loop on extra paid uploads "just to be sure" — one round-trip is sufficient evidence.

## Examples

**Example 1 — agent uploads dispute evidence:**

> User: "I have a screenshot at /tmp/exhibit-a.png that I want to attach to a Kleros dispute. Pin it to IPFS for me."

Steps:
1. Confirm the file exists.
2. Run the bundled script: `EVM_PRIVATE_KEY=0x… npx tsx pay-and-upload.ts /tmp/exhibit-a.png`.
3. The script prints the CID on stdout (e.g. `/ipfs/QmXXX...`) and the pre-built URL on stderr as `url=https://cdn.kleros.link/ipfs/QmXXX...`. Hand that URL to the user — it's the canonical Kleros HTTP gateway. See "Response shape" if you need to build URLs from raw `cids` (when the `urls[]` field isn't present).

**Example 2 — agent pins meta-evidence JSON:**

> User: "Pin this JSON file to IPFS using `meta-evidence` as the operation: ./case-42.json"

Steps:
1. `OPERATION=meta-evidence EVM_PRIVATE_KEY=0x… npx tsx pay-and-upload.ts ./case-42.json`.
2. Surface the CID — the user likely needs it for a smart-contract call that references meta-evidence by hash.

**Example 3 — agent sanity-checks the gateway before relying on it:**

> User: "Is the Kleros IPFS gateway working right now? I'd like to verify before relying on it for an upload."

Steps:
1. Run the three free pre-flight checks from the "Pre-flight" section (health, discovery, unpaid 402). None spend USDC.
2. If all three return as expected, report the gateway as healthy and proceed. If any fail, surface the specific error so the user can decide whether to retry or escalate.

## Bundled

Both scripts are **optional**. They exist so agents without x402 tooling can pay and upload without rediscovering `x402-fetch` from scratch. If your agent already speaks x402, ignore them and call the gateway directly.

- `scripts/pay-and-upload.ts` — reference Node implementation. Adapt to your project context, or run standalone.
- `scripts/package.json` — declares the two deps (`x402-fetch`, `tsx`). No lockfile and no tsconfig (tsx runs TS natively).

If you're integrating into an existing Node project, you can ignore the bundled `package.json` and just `npm i x402-fetch` in your own project.
