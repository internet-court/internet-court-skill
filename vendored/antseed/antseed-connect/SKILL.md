---
name: antseed-connect
description: Connect coding agents, AI SDKs, and LLM tools to the AntSeed buyer proxy. Use when configuring Claude Code, Codex, OpenCode, Pi, OpenClaw, Hermes, GenLayer Studio, Vercel AI SDK, LangChain, or raw HTTP to route inference through AntSeed at localhost:8377.
---

# AntSeed — Integration Skill

> This file is the agent-readable companion to https://antseed.com/integrations.
> It tells any AI agent (Claude, Codex, OpenClaw, Hermes, custom) exactly
> how to wire its tool of choice up to the AntSeed peer-to-peer inference network.

## What is AntSeed?

AntSeed is a peer-to-peer marketplace for AI inference. Buyers run a small
local daemon (the **buyer proxy**) that exposes an HTTP API at
`http://localhost:8377` speaking the three caller-facing LLM API protocols:
Anthropic Messages, OpenAI Chat Completions, and OpenAI Responses. Legacy
OpenAI Completions is supported internally for adapter translation. The proxy
discovers providers on a DHT, routes the
request to a peer, translates between protocols when needed (via
`@antseed/api-adapter`), and settles in USDC on Base.

Important: AntSeed is for value-added AI services (specialized models, agents,
TEEs, fine-tunes, managed workflows), not raw resale of API keys or subscription
access. Providers must comply with upstream terms of service.

From the perspective of any tool, SDK, or agent, **AntSeed is just a local
OpenAI/Anthropic-compatible endpoint** — point a `base_url` at it and you are done.

## Glossary (mental model)

- **Buyer proxy** — the local server on `localhost:8377` that accepts API calls
  from your tools and forwards them to AntSeed peers. It is the only thing your
  editor / agent / SDK ever talks to.
- **Peer** — someone selling inference. Each peer has a `peerId` (40-char hex),
  a display name, and a list of services. List with `antseed network browse`.
- **Service** — a single model id like `claude-sonnet-4-6` or `deepseek-v4-flash`.
  *This is what you pass as `model` in your tool's config.* Each service has its
  own `protocols` array and its own `in` / `cachedIn` / `out` pricing.
- **Protocols** (per service) — the wire formats a service accepts *natively*,
  advertised on each peer in `providerServiceApiProtocols` (and surfaced per service
  in `matchingServices[].protocols`). Values are `anthropic-messages`,
  `openai-chat-completions`, `openai-responses`, `openai-completions`. **This is
  the field to match your tool's wire format against.** If your tool's wire format
  is in this list, the request passes through untouched; if not, the api-adapter
  translates on the fly.
- **Cached input pricing** — services charge a separate, much lower rate
  (typically 4–10×) for tokens that are reused across requests: system prompts,
  tool schemas, prior conversation turns, long files you keep referencing. The CLI
  exposes it as `cachedInputUsdPerMillion`. For long-running agents and chatbots,
  this is often the dominant cost line.
- **Pin** — telling the buyer proxy "route requests to *this* peer." In the
  default manual flow, there is no peer auto-selection; you must choose a peer,
  send a per-request pin header, or start the proxy with a router plugin that
  performs selection. Common explicit routes:
  - **Session pin**: `antseed buyer connection set --peer <peerId>`. Persists in
    `~/.antseed/buyer.state.json` and applies to every request until you change it.
  - **Per-request header**: `x-antseed-pin-peer: <peerId>` on each call. Overrides
    the session pin for that request, and works *without* any session pin at all.
  - **Model prefix**: set `model` to `<peerId>@<service>`. The proxy uses the
    prefix as the peer pin and forwards only `<service>` to the seller.
  
  If both header and model-prefix pins are present, the header selects the peer;
  the model prefix is still stripped before routing.
  Until at least one of these is in effect, every request returns `no_peer_pinned`.

## Universal setup (do this once)

### Option A — AntStation desktop app (easiest)

Download from https://antseed.com — it ships the buyer proxy, a wallet, and a
peer browser in a GUI. While the app is open the proxy is reachable at
`http://localhost:8377`.

### Option B — CLI (headless / servers / agents)

```bash
# 1. Install
npm install -g @antseed/cli

# 2. Identity (an EVM private key — 64 hex chars). Save this somewhere safe;
#    you will reuse it across machines and it controls your USDC deposits.
export ANTSEED_IDENTITY_HEX=$(openssl rand -hex 32)
# SECURITY: never paste this key into chat, logs, GitHub issues, or a file
# committed to git. It controls the buyer identity and access to deposits.

# 3. Start the buyer proxy on :8377
antseed buyer start &

# 4. Browse the network and list every service (= model) each peer offers,
#    along with its native protocols and USD-per-1M-tokens pricing.
#    `service` is the model id you pass to your tool. `protocols` is the
#    wire format(s) the service accepts natively — match it against your
#    tool. `in` / `cachedIn` / `out` are fresh-input / cached-input / output.
antseed network browse --json --top 5 \
  | jq '.peers | map({
      peerId, name: .displayName,
      services: [
        (.providerServiceApiProtocols | to_entries[]) as $p
        | ($p.value.services | to_entries[]) as $s
        | {
            service:  $s.key,
            protocols: $s.value,
            in:       (.providerPricing[$p.key].services[$s.key].inputUsdPerMillion       // .providerPricing[$p.key].defaults.inputUsdPerMillion),
            cachedIn: (.providerPricing[$p.key].services[$s.key].cachedInputUsdPerMillion // null),
            out:      (.providerPricing[$p.key].services[$s.key].outputUsdPerMillion      // .providerPricing[$p.key].defaults.outputUsdPerMillion)
          }
      ]
    })'

# 5. Inspect one peer in detail. The shape of `matchingServices[]` is the same
#    as the per-service rows above, with `tags` (capability hints) included.
#    `cachedIn` is typically 4–10× cheaper than `in` and often dominates the
#    cost line for long-running agents and chatbots — always include it when
#    comparing peers.
antseed network peer <peerId> --json \
  | jq '.matchingServices[] | {
      service, protocols,
      in:       .inputUsdPerMillion,
      cachedIn: .cachedInputUsdPerMillion,
      out:      .outputUsdPerMillion,
      tags
    }'

# 6. Pin a peer (session-wide). Until you do, every request returns
#    `no_peer_pinned` UNLESS the request includes an `x-antseed-pin-peer`
#    header (see Per-request peer selection below).
antseed buyer connection set --peer <peerId>

# 7. Verify the proxy advertises the services you expect
curl -s http://localhost:8377/v1/models | jq '.data[].id'

# 8. (Optional) Deposit USDC on Base for paid services
antseed payments  # opens portal at 127.0.0.1:3118?token=<hex> — connect a wallet, deposit USDC
```

### Security notes for agents and deploys

- Treat `ANTSEED_IDENTITY_HEX` / `~/.antseed/identity.key` as a hot wallet key.
  Never print it, paste it into chat, commit it, or copy it off the buyer host.
- Keep the buyer proxy bound to `127.0.0.1` / `localhost`. Do not expose
  `:8377` directly to the public internet; use SSH tunnels or a private network
  if another process must reach it remotely.
- Start with small USDC deposits and conservative reserve caps for autonomous
  agents. The funding wallet does not need to stay connected after depositing.
- If a tool requires an API key, use a non-secret placeholder such as `antseed`;
  the buyer proxy authenticates with the local identity key instead.

## Endpoints exposed by the buyer proxy

| Path | Wire format | Common callers |
|------|-------------|----------------|
| `POST /v1/messages` | Anthropic Messages | Claude Code, Anthropic SDKs, OpenClaw |
| `POST /v1/chat/completions` | OpenAI Chat Completions | Codex, Hermes, OpenAI SDKs, Vercel AI SDK, LangChain, most tools |
| `POST /v1/responses` | OpenAI Responses | Codex (newer builds), tools using the Responses API |

All four protocols (including legacy `openai-completions`) are supported by
`@antseed/api-adapter` for translation, but only the three endpoints above are
exposed to callers. Translation is automatic: a request that arrives in one
format and is routed to a peer whose service advertises a different `protocols`
value is transformed both directions (request and streaming response).

No `Authorization` header is required by the buyer proxy. It authenticates and
pays peers using the local node's identity key and on-chain USDC deposits.

### Per-request peer selection (no session pin needed)

Two ways to tell the proxy which peer to use:

1. **Session pin** — `antseed buyer connection set --peer <peerId>`. Persists in
   `~/.antseed/buyer.state.json` (`pinnedPeerId`) and applies to every request
   until you change it. Best for single-tenant setups (laptops, dedicated agents).
2. **Per-request header** — send `x-antseed-pin-peer: <peerId>` on each call.
   Overrides the session pin for that one request. **You do not need to call
   `antseed buyer connection set` at all** if every request includes this header
   — the proxy will accept and route them. Best for scripts, schedulers, and
   multi-tenant deployments that need to fan out to different peers per call.

Example (per-request, no session pin):

```bash
curl http://localhost:8377/v1/chat/completions \
  -H 'content-type: application/json' \
  -H 'x-antseed-pin-peer: 4668854ba3e8b094e6f48fbeb59cec1cfde162f2' \
  -d '{ "model": "minimax-m2.7", "messages": [{"role":"user","content":"hi"}] }'
```

Other optional headers:

- `x-antseed-provider: <providerName>` — when a peer exposes the same service
  through more than one seller-plugin (rare), force a specific one. Most tools
  never need this.

## Files the CLI creates in `~/.antseed/`

Knowing what lives in `~/.antseed/` matters for backups, container deploys,
and debugging. The directory is created on first `antseed buyer start` (or
first run of any `antseed` command that needs it).

| Path | Purpose | Survives restart? | Safe to delete? |
|------|---------|--------------------|------------------|
| `identity.key` | Raw 32-byte EVM private key for the buyer wallet. Fallback when `ANTSEED_IDENTITY_HEX` is not set. | yes | NO — deleting loses access to your USDC deposits. Back this up. |
| `identity.enc` | Encrypted copy of `identity.key` (when the desktop app sets a passphrase). | yes | only if `identity.key` is also intact |
| `config.json` | Static settings: chain id, proxy port, max-pricing caps, bootstrap nodes, payments preferences. Hand-editable. | yes | yes (defaults are sane) |
| `buyer.state.json` | Live runtime state: `pinnedPeerId`, the discovered-peers cache (`discoveredPeers`), on-chain stats, the proxy `pid` and `port`. Re-built from the network on next start. | yes (the pin survives restart) | yes (you lose the pin and the cached peer list — next browse will repopulate) |
| `metering.db` | SQLite log of every request the proxy served (model, peer, tokens, USDC). Used by `antseed buyer status` and the payments portal. | yes | yes (you lose request history; settlement is unaffected) |
| `payments/` | Per-channel state used by the seller-side settlement flow (only relevant if you also run `antseed seller`). | yes | only if you do not run a seller |
| `plugins/` | Cache of downloaded provider plugins. | yes | yes (re-downloaded on next use) |
| `chat/`, `projects/` | Used by the desktop app for local chat history. Empty on a CLI-only setup. | yes | yes |

### `config.json` (commonly edited)

```json title="~/.antseed/config.json"
{
  "buyer": {
    "proxyPort": 8377,                  // change if 8377 conflicts on the host
    "minPeerReputation": 0,             // optional: raise to filter lower-reputation peers
    "maxPricing": {                     // refuse to route to peers above this rate
      "defaults": { "inputUsdPerMillion": 100, "outputUsdPerMillion": 100 }
    }
  },
  "payments": {
    "preferredMethod": "crypto",
    "crypto": { "chainId": "base-mainnet" }   // or "base-sepolia" for testnet
  },
  "network": { "bootstrapNodes": [] }   // empty = use built-in defaults
}
```

Edit, then restart the buyer proxy. **Do not hardcode contract addresses** —
the chain preset (`base-mainnet` / `base-sepolia`) resolves Deposits, Channels,
USDC, and the RPC URL automatically.

### `buyer.state.json` (read-only in practice)

Top-level fields that an agent might want to inspect:

- `pinnedPeerId` — the currently pinned peer (or `null`).
- `pid` / `port` — the running proxy. If `pid` is non-null but the process is gone, `antseed buyer start` will detect the stale lockfile and clean up.
- `discoveredPeers` — cached peer list from the last DHT browse. Refreshed on `antseed network browse`.
- `peersUpdatedAt`, `onChainStatsRefreshedAt` — cache timestamps (epoch millis).

To force a clean reset of pin + caches without losing your wallet:

```bash
antseed buyer stop || true
rm ~/.antseed/buyer.state.json
antseed buyer start &
```

## How to integrate <your tool>

Below is every integration we currently document. Find your tool, copy the
config block, done. If your tool is not listed but accepts a custom OpenAI or
Anthropic base URL, follow the closest example (or look at the **curl / Raw
HTTP** entry — the contract is stable).

## Claude Code

*Anthropic's official CLI agent — launch through AntSeed with `antseed claude`.*

- **Category:** Coding agents
- **Wire format:** Anthropic Messages
- **Setup time:** ~2 min
- **Page:** https://antseed.com/integrations/claude-code

**TL;DR for agents:** Prefer `antseed claude --model <service-id>`. It sets ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY for Claude Code. Manual equivalent: set ANTHROPIC_BASE_URL=http://localhost:8377 and ANTHROPIC_API_KEY=antseed, then run `claude --model <service-id>`.

Claude Code is the official CLI coding agent from Anthropic. It speaks the Anthropic Messages API natively, so it slots into AntSeed through the `antseed claude` wrapper or by pointing `ANTHROPIC_BASE_URL` at your local proxy.

`antseed claude` resolves the active buyer proxy, sets the placeholder Anthropic API key for the child process, and forwards the rest of your Claude Code flags unchanged. Manual environment variables still work if you want to run `claude` directly.

No real Anthropic API key is needed — the AntSeed proxy authenticates each request with your local identity (`ANTSEED_IDENTITY_HEX`) and settles payments on-chain. The `ANTHROPIC_API_KEY` value is required by the Anthropic SDK only as a non-empty placeholder.

When Claude Code calls the Messages API, the proxy forwards the request to the peer you pinned in step 3 of the setup above. Whichever *service ids* that peer advertises (visible in `antseed network peer <peerId>`) become the valid `--model` values.

**Install**

- **Install Claude Code globally**
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- **Verify it runs**
  ```bash
  claude --version
  ```
  *Example output:*
  ```
  1.4.2 (Claude Code)
  ```

**Configure**

```bash
antseed claude --model claude-sonnet-4-6
```

_Recommended: the wrapper reads the active buyer proxy from `buyer.state.json` or config, sets `ANTHROPIC_BASE_URL` and `ANTHROPIC_API_KEY` for Claude Code, and forwards extra Claude args. Add `--antseed-base-url http://host:port` only when your proxy is somewhere else._

```bash
export ANTHROPIC_BASE_URL="http://localhost:8377"
export ANTHROPIC_API_KEY="antseed"
```

_Manual equivalent if you want to run `claude` directly instead of through `antseed claude`._

**Suggested models:** `claude-sonnet-4-6`, `claude-opus-4-7`, `deepseek-v4-flash`

`antseed claude --model <service-id>` passes the value to Claude Code unchanged. The valid set is whatever your pinned peer advertises — see the discovery commands below.

**Test it**

- **See which models your pinned peer offers**
  ```bash
  curl -s http://localhost:8377/v1/models | jq '.data[].id'
  ```
  *Example response:*
  ```
  "claude-opus-4-7"
  "claude-sonnet-4-6"
  "deepseek-v4-flash"
  "gpt-oss-120b"
  ```
  > These are the only ids that work with `--model`. To switch peers, run `antseed network browse`, then `antseed buyer connection set --peer <peerId>` and re-check this list.
- **Start a Claude Code session through the wrapper**
  ```bash
  antseed claude --model claude-sonnet-4-6
  ```
  > Manual equivalent after exporting the env vars above: `claude --model claude-sonnet-4-6`.

**Troubleshooting**

- *"invalid x-api-key" or 401 from Anthropic SDK* — `antseed claude` sets `ANTHROPIC_API_KEY=antseed` for you. If you run `claude` directly, set the variable to any non-empty string; the proxy ignores the value.
- *Hangs forever on first message* — No peer is pinned. Run `antseed network browse` to see peers, then `antseed buyer connection set --peer <peerId>`.
- *`model_not_found` for a model name you expected to work* — The pinned peer doesn't advertise that service id. Check what it does offer with `antseed network peer <peerId>` (or `curl http://localhost:8377/v1/models`). Pin a different peer if needed.
- *Want to confirm a request actually went through AntSeed (not Anthropic direct)* — After the request completes, run `antseed buyer metering` — you'll see the channel for the peer Claude Code routed to, with token counts and the USDC settled. `antseed buyer status` shows the snapshot (pinned peer, active-channel count, deposits).

**How Claude Code talks to AntSeed**

- **Wire format sent by Claude Code:** Anthropic Messages (hits `/v1/messages` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `anthropic-messages` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between Anthropic Messages and the service's native protocol on the fly. So a request from Claude Code can still reach a service that only advertises a different protocol — just with a small transform step.
- **Caveat:** services whose only advertised protocol is `openai-responses` require streaming. If Claude Code sends a non-streaming request and the proxy routes it to one of those services, the call fails with `HTTP 400: Stream must be set to true`. Pick a service whose `protocols` includes `anthropic-messages` (or another non-responses protocol) to avoid this.

**Links**

- [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code)
- [AntSeed skill: join-buyer](https://github.com/AntSeed/antseed/tree/main/skills/join-buyer)

---

## OpenAI Codex CLI

*OpenAI's official CLI coding agent — use `antseed codex` for per-run proxy config.*

- **Category:** Coding agents
- **Wire format:** OpenAI Chat Completions
- **Setup time:** ~2 min
- **Page:** https://antseed.com/integrations/codex

**TL;DR for agents:** Prefer `antseed codex --model <service-id>`. It injects the AntSeed Codex provider for one run using base_url=http://localhost:8377/v1 and wire_api="responses". Manual alternative: create user-level ~/.codex/antseed.config.toml with top-level model/model_provider plus [model_providers.antseed], then run `codex --profile antseed`.

Codex is OpenAI's terminal coding agent. Recent versions ignore `OPENAI_BASE_URL` and instead read provider config from Codex settings.

`antseed codex` supplies that provider config for one run with Codex `-c` overrides, points it at the active buyer proxy, sets the placeholder API key, and leaves your real `CODEX_HOME` untouched.

If you prefer a persistent manual setup, create `~/.codex/antseed.config.toml` and launch Codex with `codex --profile antseed`; the wrapper is still the shortest path for one-off sessions.

**Install**

- **Install Codex globally**
  ```bash
  npm install -g @openai/codex
  ```
- **Verify it runs**
  ```bash
  codex --version
  ```

**Configure**

```bash
antseed codex --model claude-sonnet-4-6
```

_Recommended: the wrapper resolves the proxy URL, injects an AntSeed model provider with `wire_api = "responses"`, sets `ANTSEED_API_KEY=antseed`, and forwards extra Codex args. Put child flags after `--` when they look like wrapper flags._

```toml title="~/.codex/antseed.config.toml"
# Loaded by: codex --profile antseed
# Set this to a service id returned by http://localhost:8377/v1/models
# after pinning an AntSeed peer.
model = "claude-sonnet-4-6"
model_provider = "antseed"

[model_providers.antseed]
name = "AntSeed"
base_url = "http://localhost:8377/v1"
wire_api = "responses"
```

_Manual profile only: this must be your **user-level** `~/.codex/antseed.config.toml`, then launch with `codex --profile antseed`. If your buyer proxy uses a non-default port, update `base_url` to match it. Project-local `./.codex/config.toml` provider blocks are ignored by Codex._

> **GUI:**
>
> No real OpenAI key is needed. The AntSeed proxy authenticates with your local buyer identity; the wrapper and manual profile both point Codex at the local proxy instead of OpenAI.

**Suggested models:** `claude-sonnet-4-6`, `deepseek-v3.1`, `kimi-k2.5`, `qwen-3-coder-480b`

Pass the peer service id to `antseed codex --model <service-id>`. For a manual profile, set top-level `model = "<service-id>"` in `~/.codex/antseed.config.toml` or override with `codex --profile antseed --model <service-id>`.

**Test it**

- **See which service ids your pinned peer exposes**
  ```bash
  curl -s http://localhost:8377/v1/models | jq '.data[].id'
  ```
  *Example response:*
  ```
  "claude-opus-4-7"
  "claude-sonnet-4-6"
  "deepseek-v4-flash"
  "gpt-oss-120b"
  ```
  > Whatever appears here is a valid value for top-level `model = ...` in `~/.codex/antseed.config.toml` (or for `codex --profile antseed --model <id>`).
- **Run Codex through the wrapper**
  ```bash
  antseed codex --model deepseek-v4-flash
  ```
  > Manual profile equivalent: `codex --profile antseed --model deepseek-v4-flash`.
- **Verify inference is actually paid through AntSeed**
  ```bash
  open http://localhost:3118   # or: antseed buyer status
  ```
  *What to look for after one real prompt:*
  ```
  Deposits available: 4.289391 USDC → 3.289391 USDC
  Deposits reserved:           0 USDC → 1 USDC
  ```
  > The buyer dashboard at http://localhost:3118 is the authoritative real-time signal: a non-zero `Reserved` (channel opened) and/or a drop in `Available` (settled spend) after a real prompt confirms AntSeed served the request. The `antseed buyer status` CLI output is cached and may lag the dashboard — refresh the web view for confirmation. Do not rely on `lsof -i | grep codex` or `~/.codex/log/codex-tui.log`: Codex keeps persistent TCP connections to Cloudflare/ChatGPT IPs (e.g. 172.64.0.0/13) for non-inference purposes (the cause was not isolated during testing), and the `provider=OpenAI` lines in the TUI log are not a reliable indicator that inference went to OpenAI — the on-chain numbers can show AntSeed served the request despite that log line.

**Troubleshooting**

- *`OPENAI_BASE_URL` / `OPENAI_API_KEY` are being ignored* — Expected on recent Codex builds. Use `antseed codex --model <service-id>` so the wrapper injects the provider config for the current run, or use the manual `~/.codex/antseed.config.toml` profile above.
- *How can I tell if Codex is actually routing through AntSeed?* — Check the buyer dashboard at http://localhost:3118 (or `antseed buyer status`) after sending a test prompt. `Reserved` going from $0 to a non-zero value (a channel was opened) and/or `Available` dropping (spend settled) confirms AntSeed served the request. If both stay flat after a real prompt, the profile is not being applied. Do not trust `lsof` connections to Cloudflare IPs or `provider=OpenAI` lines in `~/.codex/log/codex-tui.log` — neither is a reliable routing signal.
- *Codex prints `Ignored unsupported project-local config keys … model_provider, model_providers`* — Provider settings must live in your **user-level** Codex profile file. For this manual flow, put the top-level `model`, `model_provider`, and `[model_providers.antseed]` block in `~/.codex/antseed.config.toml`, then relaunch with `codex --profile antseed`. Codex silently rejects provider blocks in project-local `./.codex/config.toml` and falls back to its default provider.
- *Hand-written Codex `-c` provider overrides behave inconsistently* — Use `antseed codex --model <service-id>` so AntSeed supplies the complete provider block (`base_url`, `wire_api`, and `model_provider`) for the current run. If managing config yourself, keep the full provider/profile in user-level `~/.codex/antseed.config.toml`.
- *Streaming stops after the first chunk with a manual profile* — Use `antseed codex`, or set `wire_api = "responses"` in the manual `[model_providers.antseed]` block.
- *`unknown profile: antseed`* — Codex caches profile config on launch. Make sure you saved `~/.codex/antseed.config.toml`, then start a fresh `codex --profile antseed` session.
- *Hangs forever on first message* — No peer is pinned. Run `antseed network browse`, then `antseed buyer connection set --peer <peerId>`.

**How OpenAI Codex CLI talks to AntSeed**

- **Wire format sent by OpenAI Codex CLI:** OpenAI Chat Completions (hits `/v1/chat/completions` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `openai-chat-completions` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between OpenAI Chat Completions and the service's native protocol on the fly. So a request from OpenAI Codex CLI can still reach a service that only advertises a different protocol — just with a small transform step.
- **Caveat:** services whose only advertised protocol is `openai-responses` require streaming. If OpenAI Codex CLI sends a non-streaming request and the proxy routes it to one of those services, the call fails with `HTTP 400: Stream must be set to true`. Pick a service whose `protocols` includes `openai-chat-completions` (or another non-responses protocol) to avoid this.

**Links**

- [Codex repo](https://github.com/openai/codex)
- [Codex sample config](https://developers.openai.com/codex/config-sample)

---

## OpenCode

*Open-source AI coding agent — launch through AntSeed with `antseed opencode`.*

- **Category:** Coding agents
- **Wire format:** OpenAI Chat Completions
- **Setup time:** ~2 min
- **Page:** https://antseed.com/integrations/opencode

**TL;DR for agents:** Prefer `antseed opencode --model <service-id>`. It creates a temporary OpenCode provider config using npm="@ai-sdk/openai-compatible", baseURL="http://localhost:8377/v1", apiKey="antseed", and one model entry. Manual alternative: put the same provider in opencode.json and run `opencode`.

OpenCode is an MIT-licensed terminal coding agent built on the Vercel AI SDK. It supports 75+ providers out of the box and lets you register custom ones via `opencode.json`.

`antseed opencode` creates that custom provider config in a temporary `opencode.json`, points OpenCode at it for the child process, and deletes it when the session exits. Manual project or global config still works if you want OpenCode to remember AntSeed outside the wrapper.

AntSeed plugs in as a **custom provider** using the `@ai-sdk/openai-compatible` adapter — the same one OpenCode recommends for any OpenAI-compatible endpoint (LM Studio, llama.cpp, Atomic Chat, etc.). No `ANTHROPIC_BASE_URL`: OpenCode reads provider config from JSON.

Each model you want to use must be listed under `models`. The id has to match what the buyer proxy returns from `GET /v1/models` — i.e. a service id advertised by your currently-pinned peer.

**Install**

- **Install OpenCode**
  ```bash
  npm install -g opencode-ai
  ```
- **Verify it runs**
  ```bash
  opencode --version
  ```

**Configure**

```bash
antseed opencode --model gpt-oss-120b
```

_Recommended: the wrapper resolves the proxy URL, writes a temporary OpenCode config with one AntSeed model, sets `OPENCODE_CONFIG` for the child process, and forwards extra OpenCode args._

```json title="opencode.json  (project root, or ~/.config/opencode/opencode.json for global)"
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "antseed": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "AntSeed (peer-to-peer)",
      "options": {
        "baseURL": "http://localhost:8377/v1",
        "apiKey": "antseed"
      },
      "models": {
        "claude-sonnet-4-6":  { "name": "Claude Sonnet 4.6 (via AntSeed)" },
        "deepseek-v4-flash":  { "name": "DeepSeek v4 Flash (via AntSeed)" },
        "gpt-oss-120b":       { "name": "gpt-oss 120B (via AntSeed)" }
      }
    }
  }
}
```

_Manual equivalent if you want OpenCode to keep AntSeed in its normal project or global config._

**Suggested models:** `claude-sonnet-4-6`, `claude-opus-4-7`, `deepseek-v4-flash`, `gpt-oss-120b`

`antseed opencode --model <service-id>` generates a temporary config for that one id. In manual config, the keys under `models` must exactly match service ids returned by `curl http://localhost:8377/v1/models`.

**Test it**

- **Confirm the proxy lists the same ids your config references**
  ```bash
  curl -s http://localhost:8377/v1/models | jq '.data[].id'
  ```
  *Example response:*
  ```
  "claude-opus-4-7"
  "claude-sonnet-4-6"
  "deepseek-v4-flash"
  "gpt-oss-120b"
  ```
  > Add or remove entries under `models` in `opencode.json` so they match this list.
- **Launch OpenCode through the wrapper**
  ```bash
  antseed opencode --model gpt-oss-120b
  ```
  > Extra OpenCode args are forwarded, so `antseed opencode --model gpt-oss-120b run` works too. Manual config equivalent: run `opencode`, then pick one of the AntSeed entries from `/models`.

**Troubleshooting**

- *AntSeed doesn't appear in `/connect` or `/models`* — With `antseed opencode`, pass the service id via `--model`; the wrapper supplies a temporary config. With manual config, make sure `opencode.json` is in your project root (or `~/.config/opencode/opencode.json`) and that the JSON is valid — a stray comma silently disables the whole provider.
- *Model is listed but every call returns `model_not_found`* — The pinned peer doesn't advertise that service id. Run `antseed network peer <peerId>` to see what it actually offers, or pin a different peer.
- *OpenCode prompts for an API key* — The proxy ignores auth, but the AI SDK sometimes asks anyway. Either skip the prompt (press enter on empty input) or set `"apiKey": "antseed"` inside `options` in `opencode.json`.

**How OpenCode talks to AntSeed**

- **Wire format sent by OpenCode:** OpenAI Chat Completions (hits `/v1/chat/completions` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `openai-chat-completions` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between OpenAI Chat Completions and the service's native protocol on the fly. So a request from OpenCode can still reach a service that only advertises a different protocol — just with a small transform step.
- **Caveat:** services whose only advertised protocol is `openai-responses` require streaming. If OpenCode sends a non-streaming request and the proxy routes it to one of those services, the call fails with `HTTP 400: Stream must be set to true`. Pick a service whose `protocols` includes `openai-chat-completions` (or another non-responses protocol) to avoid this.

**Links**

- [OpenCode docs → Custom provider](https://opencode.ai/docs/providers/#custom-provider)
- [OpenCode repo](https://github.com/sst/opencode)

---

## Pi

*Open-source terminal coding agent with a first-class AntSeed extension.*

- **Category:** Coding agents
- **Wire format:** OpenAI Responses
- **Setup time:** ~3 min
- **Page:** https://antseed.com/integrations/pi

**TL;DR for agents:** Install Pi: `npm install -g @mariozechner/pi-coding-agent`. Install the AntSeed extension: `pi install git:github.com/AntSeed/pi-antseed`. Restart or `/reload`. The extension calls `pi.registerProvider("antseed", { api: "openai-responses", baseUrl: "http://localhost:8377/v1" })` and auto-discovers models from the pinned peer via GET /v1/models. Switch with `/model antseed/<service-id>`. Override base URL with `ANTSEED_BASE_URL` env var; auth with `ANTSEED_API_KEY`.

**What Pi is.** Pi (`@mariozechner/pi-coding-agent`) is a minimal, hackable terminal coding agent by Mario Zechner — the same lineage as [pi-mono](https://github.com/badlogic/pi-mono). It ships with four default tools (`read`, `write`, `edit`, `bash`) and lets you extend everything else — commands, providers, themes, even the editor UI — through TypeScript *extensions*, *skills*, and *prompt templates*. No fork required.

**What the AntSeed extension does.** [`pi-antseed`](https://github.com/AntSeed/pi-antseed) is a Pi extension that registers the local buyer proxy as a Pi provider named `antseed`. Once installed, every service your pinned peer advertises shows up under `antseed/<id>` in Pi's model picker (Ctrl+L or `/model`) — you switch with `/model antseed/minimax-m2.7` just like any built-in.

**Why an extension instead of env vars.** Pi already speaks dozens of provider protocols natively. The extension calls `pi.registerProvider("antseed", { api: "openai-responses", authHeader: true, baseUrl: "http://localhost:8377/v1" })` — Pi then handles auth headers, streaming, retries, and tool-calling. The Responses API path preserves reasoning items across turns for reasoning-capable models, while the extension still auto-refreshes the model list from `GET /v1/models` so the menu reflects what your pinned peer can serve.

**Install**

- **Install Pi itself (the coding agent CLI)**
  ```bash
  npm install -g @mariozechner/pi-coding-agent
  ```
  > Pi requires Node.js 20+. The binary is `pi`. Verify with `pi --version`. Without any extensions, Pi can already talk to Claude / GPT / Gemini / Groq / etc. via API key or OAuth — the AntSeed extension below is what teaches it to route through your local buyer proxy.
- **Install the AntSeed extension into Pi**
  ```bash
  pi install git:github.com/AntSeed/pi-antseed
  ```
  > Pi extensions install from a git URL or a local path. Alternatives: `pi -e git:github.com/AntSeed/pi-antseed` runs the extension once without installing, useful for trying it out. `pi install ./pi-antseed` works from a local clone.
- **Reload Pi so the new provider is picked up**
  ```bash
  /reload
  ```
  > Run this inside the Pi REPL (after typing `pi` to launch it). It re-scans extensions, skills, prompt templates, keybindings, and context files. A full restart works too.

**Configure**

```bash
export ANTSEED_BASE_URL="http://localhost:8377/v1"
```

> **GUI:**
>
> No GUI config needed in the common case — the extension reads `ANTSEED_BASE_URL` (default `http://localhost:8377/v1`) and discovers models from the pinned peer automatically. Only set `ANTSEED_API_KEY` if you front the buyer proxy with your own auth layer, or `ANTSEED_MODELS="id1,id2"` to skip discovery and register a fixed list.

**Suggested models:** `minimax-m2.7`, `claude-sonnet-4-6`, `deepseek-v4-flash`, `qwen3-coder-480b`

The extension auto-discovers from `GET /v1/models` after Pi loads, so anything your pinned peer advertises shows up under `antseed/...`. After re-pinning a different peer, run `/reload` in Pi to refresh the model list.

**Test it**

- **Launch Pi**
  ```bash
  pi
  ```
  > You'll see Pi's startup header, which lists loaded extensions. Look for `antseed` (or `pi-antseed`) in that list — if it's there, the extension loaded successfully.
- **Open the model picker and pick an AntSeed-routed model**
  ```bash
  /model
  ```
  > Or press Ctrl+L. The picker is fuzzy-searchable; type "antseed" to filter. You should see entries like `antseed/claude-sonnet-4-6`, `antseed/deepseek-v4-flash`, etc. — one for each service your pinned peer advertises.
- **Or switch directly via slash command**
  ```bash
  /model antseed/minimax-m2.7
  ```
  > Replace `minimax-m2.7` with any id from `curl http://localhost:8377/v1/models`. After this, every prompt routes through AntSeed → your pinned peer → the model.

**Troubleshooting**

- *`pi: command not found` after install* — Your global npm bin is not on `PATH`. Run `npm prefix -g` to find it, then add `<that-path>/bin` to `PATH` in your shell rc. Or use a Node version manager (nvm, fnm, volta) which handles this automatically.
- *`antseed` doesn't appear in the model picker (`/model` or Ctrl+L)* — The extension didn't load. Re-run `pi install git:github.com/AntSeed/pi-antseed`, restart Pi, and watch the startup header — it lists every loaded extension and surfaces load errors there.
- *Picker only shows a few hard-coded `antseed/...` ids, not what my peer offers* — Pi started before the buyer proxy was up, so the extension fell back to its built-in seed list. Make sure `antseed buyer start` is running and a peer is pinned, then run `/reload` inside Pi to refresh the model list.
- *Empty `/v1/models` from the proxy* — No peer is connected. Run `antseed network browse` to see options, then `antseed buyer connection set --peer <peerId>`. Or launch the proxy with `antseed buyer start --router <name>` for automatic peer selection.
- *5xx from the proxy mid-conversation* — Usually means the pinned peer doesn't offer the model you asked for, or has just gone offline. Re-pin via `antseed buyer connection set --peer <peerId>` and `/reload` in Pi.
- *Want to use a custom buyer proxy URL (remote host, custom port)* — Set `ANTSEED_BASE_URL=http://your-host:8377/v1` in the shell that launches `pi`. The extension reads this on startup. If your proxy is fronted by auth, also set `ANTSEED_API_KEY=<token>`.

**How Pi talks to AntSeed**

- **Wire format sent by Pi:** OpenAI Responses (hits `/v1/responses` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `openai-responses` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between OpenAI Responses and the service's native protocol on the fly. So a request from Pi can still reach a service that only advertises a different protocol — just with a small transform step.

**Links**

- [Pi coding agent (npm)](https://www.npmjs.com/package/@mariozechner/pi-coding-agent)
- [Pi source (badlogic/pi-mono)](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)
- [pi-antseed extension](https://github.com/AntSeed/pi-antseed)

---

## OpenClaw

*Open-source autonomous agent runtime — register AntSeed as a custom provider in `openclaw.json`.*

- **Category:** Autonomous agents
- **Wire format:** Anthropic Messages
- **Setup time:** ~3 min
- **Page:** https://antseed.com/integrations/openclaw

**TL;DR for agents:** Edit ~/.openclaw/openclaw.json: under models.providers, add an `antseed` entry with baseUrl=http://127.0.0.1:8377, api="anthropic-messages", apiKey="antseed-p2p", and a `models[]` array whose `id` values match service ids from GET /v1/models. Optionally `openclaw config set agents.defaults.model.primary "antseed/<id>"`. Reload with `openclaw config reload`.

**What OpenClaw is.** OpenClaw is an open-source agent runtime for autonomous, long-running tasks (research, coding, web automation). It loads its provider catalog from `~/.openclaw/openclaw.json` — each entry is an HTTP endpoint plus a wire protocol (`anthropic-messages`, `openai-chat`, etc.) and a list of models.

**How AntSeed plugs in.** Add a provider entry called `antseed` that points at `http://127.0.0.1:8377` with `api: "anthropic-messages"`. Each model id you list under that provider must be a service id your pinned peer advertises — OpenClaw will surface them in its model picker as `antseed/<service-id>`.

**Why a config entry instead of env vars.** OpenClaw runs many providers in parallel (one per task, sometimes one per agent). A single base-URL override would force every agent through AntSeed; a named provider lets you mix AntSeed with hosted Anthropic, OpenAI, or local models on a per-agent basis.

**Install**

- **Install OpenClaw**
  ```bash
  npm install -g openclaw
  ```
  > Verify with `openclaw --version`. The config file lives at `~/.openclaw/openclaw.json` and is created on first launch.

**Configure**

```json title="~/.openclaw/openclaw.json  (merge into the existing `models.providers` object)"
{
  "models": {
    "providers": {
      "antseed": {
        "baseUrl": "http://127.0.0.1:8377",
        "apiKey": "antseed-p2p",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-sonnet-4-6",
            "name": "Claude Sonnet 4.6 (via AntSeed)",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 200000,
            "maxTokens": 8192
          },
          {
            "id": "deepseek-v4-flash",
            "name": "DeepSeek v4 Flash (via AntSeed)",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  }
}
```

```bash
# Set AntSeed as the default model for new agents:
openclaw config set agents.defaults.model.primary "antseed/claude-sonnet-4-6"
```

**Suggested models:** `claude-sonnet-4-6`, `claude-opus-4-7`, `deepseek-v4-flash`, `gpt-oss-120b`

Each `id` under `models[]` must match a service id from `curl http://127.0.0.1:8377/v1/models`. `apiKey` is required by OpenClaw's validator but ignored by the proxy — any non-empty string works. The `"antseed-p2p"` value is just convention.

**Test it**

- **Confirm the proxy advertises the service ids you put in config**
  ```bash
  curl -s http://127.0.0.1:8377/v1/models | jq '.data[].id'
  ```
  *Example response:*
  ```
  "claude-opus-4-7"
  "claude-sonnet-4-6"
  "deepseek-v4-flash"
  "gpt-oss-120b"
  ```
  > If a model id you listed in `openclaw.json` doesn't appear here, your pinned peer doesn't serve it. Pin a different peer or remove the entry.
- **Reload OpenClaw and check the provider list**
  ```bash
  openclaw config reload && openclaw providers list
  ```
  > Or restart OpenClaw. You should see `antseed` with the model count you configured.
- **Run an agent against AntSeed**
  ```bash
  openclaw run "Summarize the README in this repo" --model antseed/claude-sonnet-4-6
  ```

**Troubleshooting**

- *`provider "antseed" not found` when launching an agent* — JSON parse error in `openclaw.json`, or you put the entry in the wrong nesting level. The provider must live under `models.providers.antseed`. Run `openclaw config validate` to surface parse errors.
- *OpenClaw lists `antseed/<id>` but every call returns `404 model_not_found`* — The pinned peer doesn't advertise that service id. Run `antseed network peer <peerId>` to see what it actually offers, or pin a different peer with `antseed buyer connection set --peer <peerId>`.
- *Streaming errors on long-running agents* — AntSeed supports SSE streaming. If you see truncated responses, check that no proxy in front of OpenClaw is buffering (Cloudflare, nginx). The buyer proxy itself does not buffer.
- *Agent stalls on first request after a deploy* — AntSeed opens a payment channel on the first request to a new peer (one on-chain transaction, ~5–15s on Base). Subsequent requests reuse the channel. Pre-warm by running a quick `curl` before launching the agent.

**How OpenClaw talks to AntSeed**

- **Wire format sent by OpenClaw:** Anthropic Messages (hits `/v1/messages` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `anthropic-messages` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between Anthropic Messages and the service's native protocol on the fly. So a request from OpenClaw can still reach a service that only advertises a different protocol — just with a small transform step.
- **Caveat:** services whose only advertised protocol is `openai-responses` require streaming. If OpenClaw sends a non-streaming request and the proxy routes it to one of those services, the call fails with `HTTP 400: Stream must be set to true`. Pick a service whose `protocols` includes `anthropic-messages` (or another non-responses protocol) to avoid this.

**Links**

- [OpenClaw repo](https://github.com/openclaw/openclaw)
- [AntSeed skill: openclaw-antseed (full walkthrough)](https://github.com/AntSeed/antseed/tree/main/skills/openclaw-antseed)

---

## Hermes

*Nous Research's agent framework — register AntSeed as a custom provider in `config.yaml`.*

- **Category:** Autonomous agents
- **Wire format:** OpenAI Chat Completions
- **Setup time:** ~3 min
- **Page:** https://antseed.com/integrations/hermes

**TL;DR for agents:** Edit ~/.hermes/config.yaml: add a `custom_providers` entry named `antseed` with base_url=http://127.0.0.1:8377/v1, api_mode=chat_completions, api_key="antseed-p2p", and a `models:` list whose ids match service ids from GET /v1/models. Set `model.default` to one of those ids and `model.provider: antseed`. Pin `auxiliary.title_generation.model` and `auxiliary.compression.model` to a chat_completions model to avoid streaming errors against openai-responses peers.

**What Hermes is.** Hermes is the agent framework from [Nous Research](https://nousresearch.com/) (successor to OpenClaw's lineage). It's designed for autonomous, multi-step workflows — research agents, coding agents, swarms — and reads its model catalog from `~/.hermes/config.yaml`.

**How AntSeed plugs in.** Add an entry under `custom_providers` with `base_url: http://127.0.0.1:8377/v1`, `api_mode: chat_completions`, and a list of `models`. Each model id must be a service id your pinned peer advertises. Then point `model.default` at the one you want as primary.

**One Hermes-specific gotcha.** Some peers serve GPT-style models via the `openai-responses` protocol, which *requires* streaming. Hermes' auxiliary calls (title generation, context compression) are non-streaming and will fail against those models with `HTTP 400: Stream must be set to true`. Pin auxiliary slots to a `chat_completions` model (config example below).

**Install**

- **Install or build Hermes**
  ```bash
  # Follow Nous Research setup at https://github.com/NousResearch/hermes-agent
  ```
  > Hermes is typically run as a long-lived process (often under systemd on a server). The config file `~/.hermes/config.yaml` is read at startup — changes require a restart.

**Configure**

```yaml title="~/.hermes/config.yaml  (merge into your existing config)"
model:
  default: claude-sonnet-4-6
  provider: antseed

custom_providers:
  - name: antseed
    base_url: http://127.0.0.1:8377/v1
    api_key: antseed-p2p
    api_mode: chat_completions
    models:
      - claude-sonnet-4-6
      - claude-opus-4-7
      - deepseek-v4-flash
      - gpt-oss-120b
      - minimax-m2.7

# Pin auxiliary calls to a chat_completions model so non-streaming
# requests (title generation, compression) don't break against
# openai-responses peers.
auxiliary:
  title_generation:
    provider: antseed
    model: minimax-m2.7
  compression:
    provider: antseed
    model: minimax-m2.7
```

**Suggested models:** `claude-sonnet-4-6`, `minimax-m2.7`, `deepseek-v4-flash`, `gpt-oss-120b`

Only ids listed under `models:` show up in Hermes' picker — mirror it against `curl http://127.0.0.1:8377/v1/models` so you don't advertise models no peer serves. `model.provider: antseed` pins the default to this custom provider.

**Test it**

- **Confirm the proxy advertises the same ids your config references**
  ```bash
  curl -s http://127.0.0.1:8377/v1/models | jq '.data[].id'
  ```
  *Example response:*
  ```
  "claude-opus-4-7"
  "claude-sonnet-4-6"
  "deepseek-v4-flash"
  "gpt-oss-120b"
  "minimax-m2.7"
  ```
- **Restart Hermes to pick up the new provider**
  ```bash
  sudo systemctl restart hermes
  ```
  > Or whatever supervisor you use. Then check the journal: `sudo journalctl -u hermes --no-pager -n 30`.
- **After the first request, confirm a channel opened and is being metered**
  ```bash
  antseed buyer status
  antseed buyer metering
  ```
  > `status` shows `Active channels: 1` once the first request settles (~5–15s on Base — one on-chain tx to open the channel). `metering` shows the per-peer token + USDC totals for each channel. To poll: `watch -n 1 antseed buyer metering`.

**Troubleshooting**

- *`HTTP 400: Stream must be set to true` from auxiliary calls* — You're routing through a peer that serves the model via `openai-responses` (which requires streaming), but Hermes' auxiliaries are non-streaming. Pin the `auxiliary.*` slots to a `chat_completions` model (see the config block above). Confirm a model's protocol with `antseed network peer <peerId>` — look for `protocols: openai-chat-completions` vs `openai-responses`.
- *Hermes loads the provider but every call returns `no_peer_pinned`* — In the default manual flow AntSeed does not auto-select a peer — pin one with `antseed buyer connection set --peer <peerId>`, send `x-antseed-pin-peer` per request, or start the buyer with a router plugin. The session pin survives buyer-proxy restarts (it's persisted to `~/.antseed/buyer.state.json`).
- *Hermes runs on a remote host and can't reach `127.0.0.1:8377`* — Either run the buyer proxy on the same host as Hermes (recommended — keeps the hot signing key local), or expose the proxy via SSH tunnel: `ssh -N -L 127.0.0.1:8377:127.0.0.1:8377 user@hermes-host`. Do not bind the buyer proxy to a public interface.
- *Want to swap the routed model without restarting AntSeed* — Edit `model.default` (and `models:` if needed) in `config.yaml`, re-pin a peer that serves it (`antseed buyer connection set --peer <peerId>`), then `sudo systemctl restart hermes`. The buyer proxy stays up; no contract calls.

**How Hermes talks to AntSeed**

- **Wire format sent by Hermes:** OpenAI Chat Completions (hits `/v1/chat/completions` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `openai-chat-completions` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between OpenAI Chat Completions and the service's native protocol on the fly. So a request from Hermes can still reach a service that only advertises a different protocol — just with a small transform step.
- **Caveat:** services whose only advertised protocol is `openai-responses` require streaming. If Hermes sends a non-streaming request and the proxy routes it to one of those services, the call fails with `HTTP 400: Stream must be set to true`. Pick a service whose `protocols` includes `openai-chat-completions` (or another non-responses protocol) to avoid this.

**Links**

- [Hermes Agent (Nous Research)](https://github.com/NousResearch/hermes-agent)
- [AntSeed skill: hermes-antseed (full walkthrough including systemd, remote hosts, payment portal)](https://github.com/AntSeed/antseed/tree/main/skills/hermes-antseed)

---

## GenLayer Studio

*Use AntSeed as an inference provider inside GenLayer Studio validators.*

- **Category:** Frameworks
- **Wire format:** OpenAI Chat Completions
- **Setup time:** ~5 min
- **Page:** https://antseed.com/integrations/genlayer-studio

**TL;DR for agents:** In GenLayer Studio: drop one JSON file per model into `backend/node/create_nodes/default_providers/` with `provider: "antseed"`, `plugin: "openai-compatible"`, `model: "<service-id>"`, and `plugin_config.api_url: "http://host.docker.internal:8377"` (NO `/v1` suffix — the plugin appends it). Add `"antseed"` to the provider enum and an if/then rule to BOTH `backend/.../providers_schema.json` and `frontend/.../providers_schema.json`. Set `ANTSEED_API_KEY=antseed` in `.env`. Restart with `genlayer up --reset`. The user must run AntStation or `antseed buyer start` and pin a peer that serves the listed `model` ids.

**What GenLayer Studio is.** Studio runs *Intelligent Contract* validators that consult LLMs to reach consensus. Each validator is configured with a provider entry that has a `provider` name, a `plugin` (one of `openai-compatible` / `anthropic` / `google` / `ollama` / `custom`), a `model` id, and a `plugin_config` with `api_url` and `api_key_env_var`.

**How AntSeed plugs in.** Drop one JSON file per model into `backend/node/create_nodes/default_providers/` with `plugin: "openai-compatible"` and `api_url: "http://host.docker.internal:8377"`. Studio's openai-compatible plugin appends `/v1/chat/completions` automatically, so the buyer proxy receives a standard OpenAI Chat request and routes it to your pinned peer. Mirror the existing LibertAI entry (PR #1526) — it is the closest analogue: an openai-compatible host with a hosted base URL replaced by your local proxy.

**Why `host.docker.internal`, not `localhost`.** Studio's backend runs in Docker via `genlayer up`. From inside the container, `localhost` means the container itself, not your host machine — it cannot reach the AntSeed buyer proxy on the host. Mac/Windows Docker exposes the host as `host.docker.internal`; on Linux you must add `extra_hosts: ["host.docker.internal:host-gateway"]` to the backend service in `docker-compose.yml` or run with `--network=host`.

**Prerequisites**

- GenLayer Studio cloned and running locally with `genlayer up` (see https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio)

**Install**

- **On Linux only — make `host.docker.internal` resolve from inside the backend container**
  ```yaml
  # docker-compose.yml — patch the backend (jsonrpc) service
  services:
    jsonrpc:
      extra_hosts:
        - "host.docker.internal:host-gateway"
  ```
  > Mac and Windows Docker Desktop already expose the host as `host.docker.internal` automatically — skip this step on those platforms. Restart with `genlayer up --reset` after editing.

**Configure**

```json title="backend/node/create_nodes/default_providers/antseed_claude-sonnet-4-6.json"
{
  "provider": "antseed",
  "plugin": "openai-compatible",
  "model": "claude-sonnet-4-6",
  "config": {},
  "plugin_config": {
    "api_key_env_var": "ANTSEED_API_KEY",
    "api_url": "http://host.docker.internal:8377"
  }
}
```

```json title="backend/node/create_nodes/default_providers/antseed_deepseek-v4-flash.json"
{
  "provider": "antseed",
  "plugin": "openai-compatible",
  "model": "deepseek-v4-flash",
  "config": {},
  "plugin_config": {
    "api_key_env_var": "ANTSEED_API_KEY",
    "api_url": "http://host.docker.internal:8377"
  }
}
```

```bash title=".env  (next to docker-compose.yml)"
# AntSeed authenticates with your local identity key, not this value.
# Studio's openai-compatible plugin still requires the env var to be set.
ANTSEED_API_KEY=antseed
```

```json title="backend/node/create_nodes/providers_schema.json  AND  frontend/src/assets/schemas/providers_schema.json"
// In each schema, add "antseed" to the provider enum's examples…
"provider": {
  "type": "string",
  "examples": ["ollama", "openrouter", "libertai", "antseed", …]
},

// …and add an if/then block locking provider:antseed to plugin:openai-compatible
{
  "if":   { "properties": { "provider": { "const": "antseed" } } },
  "then": { "properties": { "plugin":   { "const": "openai-compatible" } } }
}
```

_Both schema files must be kept in sync — the backend uses one for validation, the frontend uses the other for the UI dropdown. This is exactly what PR #1526 did for LibertAI._

**Suggested models:** `claude-sonnet-4-6`, `deepseek-v4-flash`, `gpt-oss-120b`, `qwen3-coder-480b`

Each provider JSON file pins exactly one `model`. Studio enumerates these into the validator-creation UI; pick services you know your pinned peer offers (check `antseed network peer <peerId> --json | jq '.matchingServices[].service'`). To expose more models later, drop in more `antseed_<model>.json` files — no schema edit needed.

**Test it**

- **Restart Studio so it re-scans `default_providers/`**
  ```bash
  genlayer up --reset
  ```
  > `get_default_providers()` in `backend/node/create_nodes/providers.py` reads every `*.json` in that folder once on boot, validates against `providers_schema.json`, and caches the result. Schema-validation errors abort startup with the offending file path — watch the logs.
- **In the Studio UI, create a new validator with provider "antseed"**
  > You should see your `antseed_*.json` model ids in the dropdown. Save and trigger a contract that calls `genlayer.eq_principle.prompt(…)` — the request hits `http://host.docker.internal:8377/v1/chat/completions` on the AntSeed proxy and is forwarded to your pinned peer.
- **Confirm the validator call hit AntSeed**
  ```bash
  antseed buyer metering
  ```
  > Each validator call adds tokens + USDC to the channel for the peer you pinned. Run after a Studio request to see the totals update. To poll live: `watch -n 1 antseed buyer metering`.

**Troubleshooting**

- *`Error validating file … antseed_*.json` on `genlayer up`* — The schema rejected your provider JSON. Most common cause: missing the if/then rule for `provider:antseed`, so it falls through with the wrong `plugin`. Add the rule to *both* `backend/.../providers_schema.json` and `frontend/.../providers_schema.json`. Run `genlayer up --reset` after editing.
- *Validator hangs, then errors with `Connection refused` to `host.docker.internal:8377`* — The backend container can't see your host. On Linux, add `extra_hosts: ["host.docker.internal:host-gateway"]` under the backend service in `docker-compose.yml` (see install step 2). On Mac/Windows, confirm Docker Desktop is running and the AntSeed proxy is up: `curl http://host.docker.internal:8377/v1/models` from inside the container with `docker compose exec jsonrpc curl …`.
- *Validator returns `no_peer_pinned`* — No peer is pinned in the buyer proxy. Run `antseed network browse`, pick one, then `antseed buyer connection set --peer <peerId>`. Alternatively, send a per-request `x-antseed-pin-peer` header by extending the openai-compatible plugin — not currently exposed in the standard schema, so session pin is the path of least resistance.
- *`404 model_not_found` from a validator using e.g. `claude-sonnet-4-6`* — Your pinned peer doesn't advertise that service id. Run `antseed network peer <peerId> --json | jq '.matchingServices[].service'` to see what it does serve. Either pin a different peer or remove that `antseed_<model>.json` file.
- *First call after a restart takes 5–15 seconds* — AntSeed opens a payment channel on the first request to a new peer (one Base-mainnet transaction). Subsequent calls reuse the channel. Pre-warm with `curl -s http://localhost:8377/v1/chat/completions -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}]}'` before triggering Studio.

**Caveats**

- AntSeed is a local daemon, not a hosted endpoint. Every Studio operator must run AntStation or `antseed buyer start` on their own machine and fund their wallet — there is no central account.
- Free services exist on the AntSeed network (`in: 0, out: 0`), but using paid ones requires a USDC deposit on Base. AntStation guides users through this on first launch; the CLI exposes it as `antseed payments`.

**How GenLayer Studio talks to AntSeed**

- **Wire format sent by GenLayer Studio:** OpenAI Chat Completions (hits `/v1/chat/completions` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `openai-chat-completions` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between OpenAI Chat Completions and the service's native protocol on the fly. So a request from GenLayer Studio can still reach a service that only advertises a different protocol — just with a small transform step.
- **Caveat:** services whose only advertised protocol is `openai-responses` require streaming. If GenLayer Studio sends a non-streaming request and the proxy routes it to one of those services, the call fails with `HTTP 400: Stream must be set to true`. Pick a service whose `protocols` includes `openai-chat-completions` (or another non-responses protocol) to avoid this.

**Links**

- [GenLayer Studio repo](https://github.com/genlayerlabs/genlayer-studio)
- [Studio docs](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio)
- [Reference PR (LibertAI)](https://github.com/genlayerlabs/genlayer-studio/pull/1526)
- [providers_schema.json (source of truth)](https://github.com/genlayerlabs/genlayer-studio/blob/main/backend/node/create_nodes/providers_schema.json)

---

## Vercel AI SDK

*Use `@ai-sdk/openai-compatible` to call AntSeed from `generateText` / `streamText` / `generateObject`.*

- **Category:** Frameworks
- **Wire format:** OpenAI Chat Completions
- **Setup time:** ~5 min
- **Page:** https://antseed.com/integrations/vercel-ai-sdk

**TL;DR for agents:** createOpenAICompatible({ name: 'antseed', baseURL: 'http://localhost:8377/v1', apiKey: 'antseed' }), then antseed('<service-id>') as the model. Use @ai-sdk/openai-compatible (NOT @ai-sdk/openai). Service ids come from GET http://localhost:8377/v1/models. Per-request peer override: pass headers: { 'x-antseed-pin-peer': '<peerId>' } in generateText/streamText.

**What the AI SDK is.** Vercel's `ai` package is a provider-agnostic TypeScript toolkit for building LLM apps and agents. You pick a *provider* (a small adapter package), instantiate a model from it, and pass that model into one of the framework's primitives: `generateText`, `streamText`, `generateObject`, or `streamObject`. The AI SDK handles tool-calling, structured output, message history, and streaming for you.

**How AntSeed plugs in.** AntSeed is OpenAI-Chat-compatible at `http://localhost:8377/v1`, so the right adapter is `@ai-sdk/openai-compatible` (not `@ai-sdk/openai`). The official OpenAI provider is locked to OpenAI's API surface and quietly drops third-party fields; the openai-compatible provider is the one Vercel's own docs recommend for proxies, gateways, and any non-OpenAI server that speaks Chat Completions. You point it at the AntSeed proxy with `baseURL` and pass any non-empty `apiKey` placeholder — the proxy authenticates with your local identity key, not with this header.

**Which model ids work.** The first argument to the provider call is the AntSeed *service id* (e.g. `claude-sonnet-4-6`, `deepseek-v4-flash`). It must match a service your pinned peer advertises — confirm with `curl http://localhost:8377/v1/models`.

**Prerequisites**

- Node.js 18 or newer

**Install**

- **Install the SDK and the openai-compatible provider**
  ```bash
  npm install ai @ai-sdk/openai-compatible zod
  ```
  > `zod` is only needed if you call `generateObject` / `streamObject`. Skip it for plain text generation.

**Configure**

```typescript
// antseed.ts — a single provider instance you can import everywhere
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const antseed = createOpenAICompatible({
  name: 'antseed',
  baseURL: 'http://localhost:8377/v1',
  apiKey: 'antseed', // any non-empty string — proxy ignores this header
  includeUsage: true, // surface token counts in streaming responses too
});
```

```typescript
// stream.ts
import { streamText } from 'ai';
import { antseed } from './antseed';

const result = streamText({
  model: antseed('claude-sonnet-4-6'), // an AntSeed service id
  prompt: 'Why is the sky blue?',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

console.log('\nusage:', await result.usage);
```

```typescript
// structured.ts — generateObject works the same way
import { generateObject } from 'ai';
import { z } from 'zod';
import { antseed } from './antseed';

const { object } = await generateObject({
  model: antseed('claude-sonnet-4-6'),
  schema: z.object({
    title: z.string(),
    bullets: z.array(z.string()).min(3).max(5),
  }),
  prompt: 'Summarize the AntSeed buyer-proxy README as a slide.',
});
console.log(object);
```

**Suggested models:** `claude-sonnet-4-6`, `deepseek-v4-flash`, `gpt-oss-120b`, `qwen3-coder-480b`

The string you pass to `antseed('<id>')` is forwarded verbatim as `model` in the OpenAI Chat request. Run `curl -s http://localhost:8377/v1/models | jq '.data[].id'` to see exactly what your pinned peer offers.

**Test it**

- **Run a smoke test with `tsx`**
  ```bash
  npx tsx stream.ts
  ```
  *Example output:*
  ```
  The sky is blue because shorter (blue) wavelengths of sunlight
  scatter much more than longer (red) wavelengths in Earth's atmosphere…
  
  usage: { promptTokens: 14, completionTokens: 78, totalTokens: 92 }
  ```
  > If you see `404 model_not_found`, the pinned peer does not advertise the id you passed. If you see `no_peer_pinned`, run `antseed buyer connection set --peer <peerId>` first — or send the per-request header (next step).
- **Per-request peer override (no session pin needed)**
  ```typescript
  // Use `headers` to fan out to different peers per call.
  const result = streamText({
    model: antseed('claude-sonnet-4-6'),
    prompt: 'hi',
    headers: {
      'x-antseed-pin-peer': 'cccccccccccccccccccccccccccccccccccccccc',
    },
  });
  ```
  > Useful when one Node process serves many tenants and you want each request routed to a different peer. The header overrides the session pin for that single call.

**Troubleshooting**

- *TypeScript complains that `antseed` has no call signature* — You imported from `@ai-sdk/openai` instead of `@ai-sdk/openai-compatible`. Switch the package — the SDK's official OpenAI provider is locked to OpenAI's service ids and rejects unknown ones.
- *`generateObject` returns malformed JSON* — The AI SDK is strict about JSON Schema support. Pass `supportsStructuredOutputs: true` to `createOpenAICompatible` only if your pinned peer's service supports OpenAI-style structured outputs natively. If unsure, leave it off — the SDK falls back to tool-call-based JSON which works everywhere.
- *`includeUsage` is set but `result.usage` is undefined* — Some upstream providers behind AntSeed do not emit usage on streamed responses. Try `generateText` instead of `streamText` for definitive token counts; otherwise run `antseed buyer metering` for the authoritative per-channel token + USDC totals AntSeed itself measured.
- *Browser/edge runtime fails with `fetch` errors* — The AntSeed proxy listens on `127.0.0.1:8377`, which is not reachable from a browser tab on a deployed site. The AI SDK is designed to run on the server (Route Handlers, Server Actions, edge functions on your own machine, or a Node process); don't call it from a client component when the model is AntSeed.

**How Vercel AI SDK talks to AntSeed**

- **Wire format sent by Vercel AI SDK:** OpenAI Chat Completions (hits `/v1/chat/completions` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `openai-chat-completions` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between OpenAI Chat Completions and the service's native protocol on the fly. So a request from Vercel AI SDK can still reach a service that only advertises a different protocol — just with a small transform step.
- **Caveat:** services whose only advertised protocol is `openai-responses` require streaming. If Vercel AI SDK sends a non-streaming request and the proxy routes it to one of those services, the call fails with `HTTP 400: Stream must be set to true`. Pick a service whose `protocols` includes `openai-chat-completions` (or another non-responses protocol) to avoid this.

**Links**

- [AI SDK docs](https://ai-sdk.dev/docs)
- [@ai-sdk/openai-compatible provider docs](https://ai-sdk.dev/providers/openai-compatible-providers)
- [`ai` on npm](https://www.npmjs.com/package/ai)

---

## LangChain (Python)

*Drop-in `ChatOpenAI(base_url=…)` — works in chains, LCEL, and LangGraph agents.*

- **Category:** Frameworks
- **Wire format:** OpenAI Chat Completions
- **Setup time:** ~5 min
- **Page:** https://antseed.com/integrations/langchain-python

**TL;DR for agents:** ChatOpenAI(model='<service-id>', base_url='http://localhost:8377/v1', api_key='antseed') from langchain-openai. Drops into LCEL, create_react_agent, RAG, with_structured_output. Per-request peer override: extra_headers={'x-antseed-pin-peer': '<peerId>'}. Service ids come from GET http://localhost:8377/v1/models. Reasoning traces (reasoning_content, etc.) are NOT preserved by ChatOpenAI — use the Responses endpoint for those.

**What LangChain is.** LangChain is the Python framework for composing LLMs with tools, retrievers, memory, and agents. The chat-model interface is `BaseChatModel`; `ChatOpenAI` from `langchain-openai` is a concrete subclass that talks the OpenAI Chat Completions wire format.

**How AntSeed plugs in.** Pass `base_url="http://localhost:8377/v1"` and any non-empty `api_key` to `ChatOpenAI`. Once you have an instance, every primitive that accepts a chat model — LCEL pipes (`prompt | llm | parser`), tool-calling agents, `create_react_agent`, LangGraph nodes, RAG chains, structured-output binding via `with_structured_output` — will route through AntSeed without any further changes.

**One thing to know.** LangChain's `ChatOpenAI` is OpenAI-strict by design: it will not preserve non-standard response fields like `reasoning_content`, `reasoning`, or `reasoning_details` that some third-party servers emit. For chat, tool-calling, and structured output this is fine. If you specifically need a model's reasoning traces, consider using the AntSeed buyer proxy with the OpenAI Responses endpoint (`/v1/responses`) via a different provider package, or use a model that returns reasoning inline.

**Prerequisites**

- Python 3.10 or newer

**Install**

- **Install LangChain and the OpenAI integration**
  ```bash
  pip install -U langchain langchain-openai
  ```

**Configure**

```python
# antseed_llm.py — import this once, reuse everywhere.
from langchain_openai import ChatOpenAI

antseed = ChatOpenAI(
    model="claude-sonnet-4-6",          # an AntSeed service id
    base_url="http://localhost:8377/v1",
    api_key="antseed",                   # any non-empty string
    temperature=0.7,
    # max_completion_tokens=2048,        # uncomment for hard caps
)

print(antseed.invoke("Hello").content)
```

```python
# pipeline.py — LCEL chain. Identical to OpenAI; the swap is invisible.
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from antseed_llm import antseed

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a concise technical writer."),
    ("human", "Explain {topic} in one paragraph."),
])

chain = prompt | antseed | StrOutputParser()
print(chain.invoke({"topic": "payment channels"}))
```

```python
# tools.py — tool-calling agent. Works because AntSeed forwards OpenAI tool calls verbatim.
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from antseed_llm import antseed

@tool
def get_weather(city: str) -> str:
    """Return the current weather for a city."""
    return f"It's 22°C and sunny in {city}."

agent = create_react_agent(antseed, [get_weather])
result = agent.invoke({
    "messages": [("user", "What's the weather in Lisbon?")]
})
print(result["messages"][-1].content)
```

**Suggested models:** `claude-sonnet-4-6`, `deepseek-v4-flash`, `gpt-oss-120b`, `qwen3-coder-480b`

Pick services whose `protocols` array includes `openai-chat-completions` (most do natively; the rest are translated automatically by `@antseed/api-adapter`). Tool calling and structured output rely on the service supporting OpenAI-style function-call syntax — confirm with a quick smoke test before building large agents.

**Test it**

- **Run the basic example**
  ```bash
  python antseed_llm.py
  ```
  *Example output:*
  ```
  Hello! How can I help you today?
  ```
- **Per-request peer override (no session pin needed)**
  ```python
  # extra_headers is forwarded as-is to the proxy.
  from langchain_openai import ChatOpenAI
  
  llm = ChatOpenAI(
      model="claude-sonnet-4-6",
      base_url="http://localhost:8377/v1",
      api_key="antseed",
      extra_headers={
          "x-antseed-pin-peer": "cccccccccccccccccccccccccccccccccccccccc",
      },
  )
  print(llm.invoke("hi").content)
  ```
  > Use this when a single Python process needs to fan out to different peers per call (multi-tenant, scheduled jobs, A/B tests across peers).
- **Verify it actually went through AntSeed**
  ```bash
  antseed buyer metering
  ```
  > `buyer metering` reads the local SQLite log and prints per-channel token + USDC totals. After your `python` call, the channel for the peer you pinned should show non-zero input/output tokens. (`buyer status` is a snapshot view — it shows the active-channel count but not per-call usage.)

**Troubleshooting**

- *`openai.NotFoundError: 404 … model_not_found`* — The pinned peer does not advertise the id you passed. Confirm with `curl http://localhost:8377/v1/models | jq` and either pin a different peer or change the `model=` argument.
- *`openai.APIConnectionError: Connection refused`* — The buyer proxy is not running. Start it with `antseed buyer start` (or open AntStation desktop). Confirm `curl http://localhost:8377/v1/models` works before retrying from Python.
- *`with_structured_output` returns the right schema but empty fields* — Either the model behind the pinned peer does not support OpenAI tool-call syntax, or you used `method="json_mode"` against a service that does not honor it. Try `method="function_calling"` (the default), and prefer services tagged `coding` or `tools` in `antseed network peer <peerId> --json`.
- *Streaming with `stream=True` truncates mid-response* — A buffering proxy (nginx, Cloudflare) sits between your code and the buyer proxy. The AntSeed proxy itself does not buffer SSE. Either bypass the intermediate proxy or set its buffering off (`proxy_buffering off;` in nginx).
- *Reasoning traces missing on a model you know emits them* — See the third paragraph above: `langchain-openai` does not preserve non-standard response fields. For first-class reasoning support, route the request through the OpenAI Responses endpoint (`POST /v1/responses` on the proxy) using a Responses-aware client, or pick a model that puts reasoning inline in `content`.

**How LangChain (Python) talks to AntSeed**

- **Wire format sent by LangChain (Python):** OpenAI Chat Completions (hits `/v1/chat/completions` on the buyer proxy).
- **Best-fit services:** any service whose `protocols` array contains `openai-chat-completions` — that is what the peer advertises as natively-supported, so traffic passes through with zero translation overhead.
- **How to check a peer:** run `antseed network peer <peerId> --json` and look at `matchingServices[].protocols` for each model. The browse command shows the same data per peer in `providerServiceApiProtocols`.
- **When protocols differ:** AntSeed's `@antseed/api-adapter` translates between OpenAI Chat Completions and the service's native protocol on the fly. So a request from LangChain (Python) can still reach a service that only advertises a different protocol — just with a small transform step.
- **Caveat:** services whose only advertised protocol is `openai-responses` require streaming. If LangChain (Python) sends a non-streaming request and the proxy routes it to one of those services, the call fails with `HTTP 400: Stream must be set to true`. Pick a service whose `protocols` includes `openai-chat-completions` (or another non-responses protocol) to avoid this.

**Links**

- [LangChain docs](https://python.langchain.com)
- [ChatOpenAI integration page](https://docs.langchain.com/oss/python/integrations/chat/openai)
- [`langchain-openai` on PyPI](https://pypi.org/project/langchain-openai/)

---

## curl / raw HTTP

*Hit the proxy with plain HTTP — useful for scripts and debugging.*

- **Category:** Raw HTTP
- **Wire format:** Multi-format
- **Setup time:** ~1 min
- **Page:** https://antseed.com/integrations/curl

**TL;DR for agents:** POST JSON to http://localhost:8377/v1/messages, /v1/chat/completions, or /v1/responses. No Authorization header required.

The buyer proxy is a vanilla HTTP server. Anything that can issue an HTTP POST works. Three endpoints are exposed:

• `POST /v1/messages` — Anthropic Messages format
• `POST /v1/chat/completions` — OpenAI Chat Completions
• `POST /v1/responses` — OpenAI Responses API

**Configure**

```bash
# Anthropic format
curl http://localhost:8377/v1/messages \
  -H 'content-type: application/json' \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# OpenAI Chat format
curl http://localhost:8377/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{
    "model": "deepseek-v3.1",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**How curl / raw HTTP talks to AntSeed**

curl / raw HTTP can send any of AntSeed's supported wire formats. Match the request format against each service's `protocols` array (advertised per service in `providerServiceApiProtocols` / `matchingServices[].protocols`) — when it matches, the request passes through untouched; when it does not, `@antseed/api-adapter` translates on the fly.

| Endpoint | Wire format | Native fit (services advertising) |
|----------|-------------|------------------------------------|
| `/v1/messages` | Anthropic Messages | `anthropic-messages` |
| `/v1/chat/completions` | OpenAI Chat Completions | `openai-chat-completions` |
| `/v1/responses` | OpenAI Responses | `openai-responses` |

---

## For agents writing integrations

If you are a coding agent helping a user wire up AntSeed, the canonical flow is:

1. Detect what tool the user is using.
2. Look it up in this file by name.
3. Run the **Install** steps if the tool is not present.
4. Before editing config files, read the existing file, preserve unrelated
   user settings, and merge only the AntSeed provider/profile block.
5. Apply the **Configure** block (env vars, config file edit, or GUI instruction).
6. Verify with the **Test it** command.
7. Pick a peer: `antseed network browse` → `antseed network peer <peerId> --json`.
   Match the tool's wire format against the service's `protocols` array — NOT the
   `provider` field. Then `antseed buyer connection set --peer <peerId>`.
8. If the tool is not listed: pick the **curl / Raw HTTP** entry and adapt — the
   contract is stable.

If a step fails, read the **Troubleshooting** entries; most failures map cleanly.

## Adding a new integration

Edit `apps/website/src/integrations/integrations.ts` in
https://github.com/AntSeed/antseed and open a PR. The hub at /integrations, the
per-tool page, and this skill.md are all generated from that single file.
