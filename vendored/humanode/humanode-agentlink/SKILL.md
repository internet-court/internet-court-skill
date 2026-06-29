# AgentLink Skill

AgentLink gives an AI agent a verified, human-backed on-chain identity. With this skill the agent can sign any HTTP request, appear in the on-chain registry as a trusted agent, and access free partner endpoints on Base mainnet.

## Skill Condition

An agent holds the AgentLink Skill when both are true:

- **Linked & registered** — the agent wallet is linked to a biomapped human owner, which is the same on-chain write that registers it in the `BiomapperAgentRegistry`. `agentlink status --network base --json` reports `"linked": true` and `"active": true`.
- **Signing** — the agent can produce a valid `agentlink` header, signed by the agent key (held in the encrypted CLI keystore, or by an external signer for the SDK).

---

## Phase 1 — Acquire

Run the CLI with `npx` (no global install needed) and store your agent private key. No on-chain write happens yet — registration is created during the Linker step in Phase 2.

```bash
# Store the agent private key in the encrypted local keystore.
# You will be prompted for the key and a password.
npx @techdigger/humanode-agentlink-cli keystore set

# Show the agent wallet address derived from the stored key
npx @techdigger/humanode-agentlink-cli keystore address
```

Prefer a global install? `npm install -g @techdigger/humanode-agentlink-cli` makes the `agentlink` command available directly (this guide uses the short `agentlink ...` form from here on). For CI or secret-manager flows use `--private-key-stdin` instead of the interactive keystore.

---

## Phase 2 — Verify

The human owner must complete biomapping and link their wallet to the agent. The agent cannot complete this phase alone — it generates a URL for the human to open.

### Human prerequisites

The human owner must do these two steps first:

1. Open [Biomapper](https://mainnet.biomapper.hmnd.app/biomap) and complete biomapping.
2. Bridge their biomapping to Base.

### Generate the Linker URL

Replace `0x<OWNER_ADDRESS>` with the human owner's biomapped wallet address:

```bash
agentlink link --owner 0x<OWNER_ADDRESS> --network base --open
```

This prints (and optionally opens) a self-contained URL. Send it to the human owner. They open it, review the request in the AgentLink Linker at [app.agentlink.id](https://app.agentlink.id/), and sign the link transaction.

### Confirm the skill is active

```bash
agentlink status --network base --json
```

When the JSON output shows `"linked": true` and `"active": true`, the skill is acquired and Phase 2 is complete.

`active` tracks the owner's biomapping. If the linked owner wallet stops being biomapped in the current Biomapper generation, status flips to `"active": false` and freemium access pauses until they re-biomap — the link itself is preserved.

---

## Phase 3 — Use

### Sign requests with the SDK

Add the SDK to your agent project (this is the `@techdigger/humanode-agentlink` runtime package — separate from the `@techdigger/humanode-agentlink-cli` used above):

```bash
npm install @techdigger/humanode-agentlink
```

`createAgentLinkClient` returns a `fetch` wrapper that attaches the `agentlink` header to every request automatically. Give it the agent key in whichever form matches how your agent already holds it.

**Option A — raw private key.** Simplest for a self-hosted agent that keeps its key in an environment variable or secret:

```typescript
import { createAgentLinkClient } from '@techdigger/humanode-agentlink'

const { fetch: agentFetch } = createAgentLinkClient({
  network: 'base',
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
})
```

**Option B — external signer.** Use this when the key lives in a KMS, HSM, or secret manager and you never want it in your process — pass the agent's public address plus a `sign` callback:

```typescript
const { fetch: agentFetch } = createAgentLinkClient({
  network: 'base',
  address: agentAddress, // your agent's public address
  sign: (message) => signer.sign(message), // key stays in KMS / HSM / secret manager
})
```

Either client signs and sends the request the same way:

```typescript
// The agentlink header is attached automatically
const response = await agentFetch('https://api.xona-agent.com/base-main/image/nano-banana', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a futuristic city at sunset', aspect_ratio: '1:1', referenceImage: [] }),
})
```

To build just the header value for use with curl, axios, or any HTTP client, `buildAgentLinkHeader` takes the same two option shapes:

```typescript
import { buildAgentLinkHeader } from '@techdigger/humanode-agentlink'

// Option A — raw key
const header = await buildAgentLinkHeader('https://api.xona-agent.com/base-main/image/nano-banana', {
  network: 'base',
  privateKey: process.env.AGENT_PRIVATE_KEY as `0x${string}`,
})

// Option B — external signer
const header = await buildAgentLinkHeader('https://api.xona-agent.com/base-main/image/nano-banana', {
  network: 'base',
  address: agentAddress,
  sign: (message) => signer.sign(message),
})
// pass as: agentlink: <header>
```

> Keep the agent key wherever you already manage secrets. A raw key in env is fine for a self-hosted agent that controls its own host — just keep it out of source control and logs. If the key lives in a KMS or HSM, use Option B so it never crosses that boundary.

### Smoke-test a signed request

```bash
agentlink request https://api.xona-agent.com/base-main/image/nano-banana --network base
```

> `agentlink request` sends only the `agentlink` header — no request body. Use it to verify the agent is linked and the signature is accepted. For real POST requests with a JSON body use the SDK above.

---

## Free Endpoints (Base mainnet, live today)

These partner endpoints are free for linked agents. Full recipes and the machine-readable index are at [agentlink.id/docs/freemium-endpoints](https://agentlink.id/docs/freemium-endpoints).

### XONA — creative AI agent

| Endpoint | What it does |
| --- | --- |
| `POST https://api.xona-agent.com/base-main/video/short-generation` | Generate a short video from a text prompt |
| `POST https://api.xona-agent.com/base-main/image/nano-banana` | Generate an image from a text prompt |

Headers required: `Content-Type: application/json` and `agentlink: <signed payload>`.

### WURK — tasking marketplace

WURK allows **one freemium use total** across both endpoints.

| Endpoint | What it does |
| --- | --- |
| `GET https://wurkapi.fun/base/agentlink/xraid/xverified/small` | Commission an X (Twitter) raid |
| `GET https://wurkapi.fun/base/agentlink/agenttohuman` | Commission an agent-to-human job |

WURK uses a server-issued challenge flow — see [agentlink.id/docs/freemium-endpoints](https://agentlink.id/docs/freemium-endpoints) for the full signing recipe.

---

## Network Reference

| Profile | Chain | Registry |
| --- | --- | --- |
| `base` (mainnet) | `eip155:8453` | `0x7Ef35Bf180dcDAA5AB6cdEC7e9DED6230aD12263` |
