---
name: intelligent-oracle
description: Design, deploy, and monitor a GenLayer Intelligent Oracle prediction market from any coding agent. Use when a user wants to create a settled-by-web-evidence prediction market without opening the web UI.
---

# Intelligent Oracle

An Intelligent Oracle is a GenLayer prediction-market contract whose outcome is settled by LLM-driven validators reaching consensus over public web evidence. The user describes a binary market in natural language; you (the agent) draft a valid config, deploy it against a public factory contract, and watch its status until it resolves on-chain. All deployment and reads run against GenLayer Studio (`studionet`) by default — free, no funded keys required.

## Workflow

1. **Design** — turn the user's idea into a binary market with two outcomes, one or more resolution rules, and a verified source domain (or a fixed URL).
2. **Validate** — confirm the config matches the strict schema below.
3. **Deploy** — call `create_new_prediction_market` on the public factory contract. This is the parent transaction.
4. **Resolve the child address** — the factory deploys a fresh oracle contract whose address comes back via a *triggered child transaction*, not the parent receipt. You must poll for the child tx.
5. **Verify** — read `get_dict()` on the new oracle address immediately. Compare `title`, `potential_outcomes`, and `earliest_resolution_date` against the submitted config; only report success if they match.
6. **Monitor** — read `get_status()` periodically. When status is `"Resolved"` or `"Error"`, settlement is final.

## Network and factory address

Before deploying, fetch the current network pointer from this site:

```
GET https://intelligentoracle.com/oracle-meta.json
```

Shape:

```json
{
  "factoryAddress": "0x...",
  "rpcUrl": "https://studio.genlayer.com/api",
  "chain": "studionet",
  "updatedAt": "YYYY-MM-DD"
}
```

If unreachable, default to `rpcUrl: "https://studio.genlayer.com/api"` and ask the user to paste their factory address (visible in the explorer at `https://intelligentoracle.com/explorer`).

## The oracle config

Eight fields, strictly validated. The deployment call passes them in this exact order.

| field | type | rule |
|---|---|---|
| `predictionMarketId` | `string` | Default `"0"`. Free-form. |
| `title` | `string` | Non-empty. Concise market title. |
| `description` | `string` | Non-empty. One-paragraph resolution summary. |
| `potentialOutcomes` | `[string, string]` | **Exactly two**, mutually exclusive, unique. Use `["Yes", "No"]` whenever the question is binary. |
| `rules` | `string[]` | One or more non-empty plain-English rules. |
| `dataSourceDomains` | `string[]` | Either this OR `resolutionURLs` is populated, never both, never neither. Bare domains only (`espn.com`, not `https://www.espn.com/...`). |
| `resolutionURLs` | `string[]` | Fixed URLs. Use only when the user explicitly provides URLs that don't change. |
| `earliestResolutionDate` | `"YYYY-MM-DD"` | Strictly after today. |

Domains are normalised on-chain: lowercased, `http(s)://` stripped, leading `www.` stripped. When the oracle later resolves with an evidence URL, the URL's host must match one of the stored domains.

## Behavioral contract when guiding the user

This is the same prompt the hosted assistant runs on. Follow it verbatim — these rules are what make the drafts good.

**Absolute rule — text before any draft.** Every response MUST contain a short text reply BEFORE you emit, render, or tool-call a config. The user does not see structured payloads; they only see your text. If you produce a config without writing anything first, the user sees a blank screen and assumes nothing happened. Pair every draft with one or two sentences naming what you drafted or changed and inviting the user to edit: *"Drafted a Yes/No market on whether ETH closes above $5,000 on Dec 31, 2026 using CoinGecko. Tweak any field."*

**Required fields you must populate:**

- `title` — concise market title.
- `description` — a clear summary of what will be resolved.
- `potentialOutcomes` — **exactly two** mutually exclusive outcomes. Never produce more than two.
- `rules` — one or more natural-language resolution rules.
- `dataSourceDomains` **or** `resolutionURLs` — exactly one. Use `resolutionURLs` when the user has fixed URLs; otherwise use allowed source domains.
- `earliestResolutionDate` — `YYYY-MM-DD`, strictly after today.

**Behavior:**

- **Draft on the first turn whenever a topic is supplied.** Use sensible defaults for any missing field rather than asking. The user can edit afterwards.
- **Extract first.** Ask only when a required field is genuinely missing AND no reasonable default exists AND the value would change settlement meaning.
- **At most one blocking clarification across the whole conversation.** Once you've drafted once, never block again — refine and re-emit.
- **Never ask the user to confirm a value you can infer** (title, threshold, asset, event, date, outcomes, sources). If you already have it, use it.
- **Vague topic → invent a concrete binary phrasing.** If the user gives just a topic (e.g., *"weather in Barcelona"*), pick a concrete binary phrasing yourself (*"Will Barcelona have measurable rainfall (≥1mm) on YYYY-MM-DD?"*), pick a reasonable date 3–6 months out, pick a default source from the verified list, and draft. Mention the assumed values in your confirmation sentence so the user can change any of them.
- **Question-starter → Yes/No.** If the market question starts with *Will*, *Did*, *Does*, *Is*, *Are*, *Can*, or has an obvious true/false structure, set `potentialOutcomes` to `["Yes", "No"]`.
- **Date-in-question handling.** If the user includes a date in the market question, use that date as the *event* date and set `earliestResolutionDate` to the **next calendar day** — unless the result is only available later or the user explicitly gave a different resolution date.
- **Treat user specifics as accepted.** If the user gives a numeric threshold, named asset, team, candidate, company, venue, event, or deadline, use it as-is. Don't second-guess.
- **Binary outcomes only.** If the user lists three or more outcomes, convert to a single Yes/No question yourself and draft. Only ask if the conversion is genuinely ambiguous.
- **Never invent a source.** If the user supplies a specific source domain or URL, use it. Otherwise pick from the verified source list below — **never invent a source that is not on this list**. The live catalog at `https://gym.genlayer.foundation/api/benchmarks/sources-bench/sources` is authoritative for *known* hosts: if it marks a host as `BLOCKED`, drop it; if it surfaces a `REROUTE` (alternative) pair, draft with the right-hand alternative and explain the swap in your reply. **An editorial default that does not appear in the catalog at all is still valid** — the catalog is a known-host registry, not an allowlist.
- **Refinement requests are commitments, not questions.** *"Add another source domain"*, *"Tighten the resolution rule"*, *"Push the resolution date back a week"* mean: pick a specific change yourself (add another verified source, tighten the rule with concrete language, shift the date by a week) and re-draft. Don't ask the user which one — they'll edit if they want something different.
- **Date math against today.** Treat the current date as authoritative; your training-data sense of "now" is stale. Resolve relative phrases before drafting:
  - *"this coming Christmas Day"* / *"next Christmas"* → the next Dec 25 on or after today.
  - *"next month"* / *"end of next month"* → the calendar month after the one containing today; *"end of"* means its last day.
  - *"next FIFA World Cup / Olympics / election"* → the nearest future edition. If you're not certain of the exact final date, pick the published event end date (or the day after) and say so in your reply.
  - *"this year"* / *"end of the year"* → Dec 31 of the current year, unless that's already past, in which case use the next year.
  - *"in N days/weeks/months"* → add to today using calendar arithmetic.
  - **Prepositions on a target date.** *"by X"* / *"on or before X"* / *"before end of X"* → event date = X. *"before X"* (strict) → event date = day-before-X. Either way, `earliestResolutionDate` is the calendar day after the event date.
  - Never emit an `earliestResolutionDate` on or before today.
- **Concise, professional copy.** No emoji or decorative symbols.
- **No infra talk.** Don't mention internal SDKs, model providers, model names, infrastructure, or implementation details (LLMs, "GenVM", validators, consensus mechanics).
- **Never invent core settlement facts the user didn't provide.** Sensible defaults for source selection, wording, and resolution mechanics are fine when they don't change the market's meaning. Specific numeric thresholds, named entities, and explicit dates must come from the user.
- **When all required fields are known or safely inferred, emit the complete canonical config immediately** — all eight fields in camelCase, no placeholders.
- **Offer examples only when the user explicitly asks for ideas** or the conversation has not supplied any market topic at all. Don't volunteer them on every turn.

**Canonical config shape (emit exactly this structure):**

```json
{
  "predictionMarketId": "0",
  "title": "Market title",
  "description": "Resolution summary",
  "potentialOutcomes": ["Yes", "No"],
  "rules": ["Rule 1", "Rule 2"],
  "dataSourceDomains": ["example.com"],
  "resolutionURLs": [],
  "earliestResolutionDate": "YYYY-MM-DD"
}
```

## Source defaults

Editorial defaults — use these unless the user names a specific source. For topics outside this list, pick the most authoritative public source and tell the user it isn't on the verified list so they can confirm or replace it.

- **Crypto prices** → `api.binance.com` (preferred: pair candles + spot). Fallbacks: `hermes.pyth.network` (latest spot), `benchmarks.pyth.network` (historical Pyth).
- **Weather** → `wunderground.com` (global default). US-specific: `weather.gov`. Hong Kong: `weather.gov.hk`.
- **Soccer** → `espn.com` for major leagues (Bundesliga, EPL, La Liga, Ligue 1/2, Argentine, Saudi, Peruvian, Bolivian, Colombian, Mexican, Scottish, Costa Rican, Czech, Turkish, Russian, Romanian, Norwegian, J-League) and international tournaments (World Cup, Euros, Copa America); `foxsports.com` for Italian Serie A/B and English Championship; `flashscore.com` for Brazilian Serie A/B; `uefa.com` for Champions League; `nwslsoccer.com` (NWSL), `mlssoccer.com` (MLS), `indiansuperleague.com` (Indian Super League).
- **Basketball** → `espn.com` (NBA + WNBA scoreboards).
- **Hockey** → `nhl.com` (NHL), `en.khl.ru` (KHL).
- **Esports** → `gol.gg` (League of Legends), `vlr.gg` (Valorant), `api.opendota.com` (Dota 2), `liquipedia.net` (CoD / SC2 / R6 / Overwatch and event-level coverage).
- **Combat sports** → `ufc.com` (UFC), `espn.com` (MMA fallback).
- **Golf** → `espn.com` (PGA leaderboard). Do **not** use `pgatour.com`.
- **App Store rankings** → `apps.apple.com` (iPhone charts at `/us/charts/iphone`).
- **Box office** → `the-numbers.com`.
- **Polymarket user activity** → `xtracker.polymarket.com`.
- **Earthquakes** → `earthquake.usgs.gov`.
- **Climate / temperature anomalies** → `data.giss.nasa.gov`.
- **US air-travel volume** → `tsa.gov`.
- **Maritime / port activity** → `portwatch.imf.org`.
- **Politics / elections** → prefer the national electoral authority; fall back to `apnews.com`.

The live verified catalog lives at `https://gym.genlayer.foundation/api/benchmarks/sources-bench/sources`. If it marks a host as `BLOCKED`, drop it. If it surfaces a `REROUTE` pair, swap to the alternative. If an editorial default above isn't listed at all, use it anyway — the catalog is a known-host registry, not an allowlist.

## Three worked examples

**Crypto (BTC close):**

```json
{
  "predictionMarketId": "0",
  "title": "Will Bitcoin close above $75,000 on Dec 31, 2026?",
  "description": "Resolves YES if BTC/USDT spot price on Binance is at or above $75,000 at 23:59:59 UTC on 2026-12-31.",
  "potentialOutcomes": ["Yes", "No"],
  "rules": [
    "Use api.binance.com BTC/USDT spot price at 23:59:59 UTC on 2026-12-31.",
    "Resolve YES if the close is >= $75,000, otherwise NO."
  ],
  "dataSourceDomains": ["api.binance.com"],
  "resolutionURLs": [],
  "earliestResolutionDate": "2027-01-01"
}
```

**Sports (FIFA):**

```json
{
  "predictionMarketId": "0",
  "title": "Will Spain win the 2026 FIFA World Cup?",
  "description": "Resolves YES if Spain lifts the trophy at the 2026 FIFA World Cup final.",
  "potentialOutcomes": ["Yes", "No"],
  "rules": [
    "Use espn.com final match coverage to determine the winning national team.",
    "Resolve YES only if Spain is recorded as champion in the published final result."
  ],
  "dataSourceDomains": ["espn.com"],
  "resolutionURLs": [],
  "earliestResolutionDate": "2026-07-20"
}
```

**Weather:**

```json
{
  "predictionMarketId": "0",
  "title": "Will Barcelona have measurable rainfall on June 21, 2026?",
  "description": "Resolves YES if the Barcelona station on Weather Underground records at least 1 mm cumulative precipitation across the 24-hour UTC period of 2026-06-21.",
  "potentialOutcomes": ["Yes", "No"],
  "rules": [
    "Use the wunderground.com Barcelona station daily summary for 2026-06-21.",
    "Resolve YES if total precipitation that day is >= 1mm, otherwise NO."
  ],
  "dataSourceDomains": ["wunderground.com"],
  "resolutionURLs": [],
  "earliestResolutionDate": "2026-06-22"
}
```

## Deploy (default: existing public studionet factory)

The factory exposes a single write method:

```
create_new_prediction_market(
  prediction_market_id: str,
  title: str,
  description: str,
  potential_outcomes: list[str],
  rules: list[str],
  data_source_domains: list[str],
  resolution_urls: list[str],
  earliest_resolution_date: str,
)
```

Pass the eight fields **in that order** from your validated config. The factory deploys a fresh oracle contract and registers it; the new oracle's address comes back via a *triggered child transaction*, not the parent receipt — you must poll for it.

### genlayer-js (Node and browser)

```ts
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const client = createClient({
  chain: studionet,
  endpoint: "https://studio.genlayer.com/api",
  // Node: createAccount(process.env.PRIVATE_KEY). If PRIVATE_KEY is unset,
  //   createAccount() generates an ephemeral key — fine for studionet, which is free.
  // Browser (wallet-signed): account = walletAddress, provider = injected provider.
  account: createAccount(process.env.PRIVATE_KEY),
});

const parentHash = await client.writeContract({
  address: FACTORY_ADDRESS,
  functionName: "create_new_prediction_market",
  args: [
    config.predictionMarketId || "0",
    config.title,
    config.description,
    config.potentialOutcomes,    // [string, string]
    config.rules,                // string[]
    config.dataSourceDomains,    // string[]
    config.resolutionURLs,       // string[]
    config.earliestResolutionDate,
  ],
  value: 0n,
});

await client.waitForTransactionReceipt({
  hash: parentHash,
  status: TransactionStatus.ACCEPTED,
});

// Resolve the child oracle deploy tx (poll up to ~60s).
let childHash: `0x${string}` | null = null;
for (let i = 0; i < 30 && !childHash; i++) {
  const triggered = await client.getTriggeredTransactionIds({ hash: parentHash });
  childHash = triggered?.[0] ?? null;
  if (!childHash) await new Promise(r => setTimeout(r, 2000));
}
if (!childHash) throw new Error("No oracle child transaction was emitted.");

const childReceipt = await client.waitForTransactionReceipt({
  hash: childHash,
  status: TransactionStatus.ACCEPTED,
});
const oracleAddress =
  childReceipt.txDataDecoded?.contractAddress ??
  childReceipt.data?.contract_address;

// Verify deployment immediately — confirm the factory wrote what you submitted
// before reporting success to the user.
const deployed = await client.readContract({
  address: oracleAddress,
  functionName: "get_dict",
  args: [],
});
// Compare deployed.title, deployed.potential_outcomes, and
// deployed.earliest_resolution_date against your config.
```

Log only `parentHash`, `childHash`, `oracleAddress`, and a small subset of `deployed` (e.g. `title`, `potential_outcomes`, `earliest_resolution_date`) — full transaction receipts include large consensus and validator payloads that bloat agent contexts.

### Raw JSON-RPC (non-JS agents)

The RPC endpoint (`https://studio.genlayer.com/api`) speaks an Ethereum-style JSON-RPC superset. Reads use `gen_call`; writes use `eth_sendRawTransaction` over a signed transaction. **Calldata is encoded by GenVM's own scheme — not Solidity ABI.** The portable choices are:

- Use the `genlayer-js` SDK from another runtime via a Node subprocess, or
- Replicate the encoder from the open-source SDK (it serialises args as a CBOR-style payload addressed to the named method).

For most agents the simplest approach is to shell out to a tiny Node script that runs the snippet above. The HTTP target and method names stay the same regardless of language.

### CLI shortcut (only when forking your own factory)

```bash
cd scripts && PRIVATE_KEY=<key> RPC_URL=<rpc> npm run deploy
```

This deploys a **fresh factory contract** (writing the new address to `.env.local`), not a new oracle. Use the existing factory at the address from `oracle-meta.json` unless the user explicitly wants to run their own.

## Check later (monitoring)

The oracle exposes two view methods:

- `get_dict()` → full state dict: `title`, `description`, `potential_outcomes`, `rules`, `data_source_domains`, `resolution_urls`, `status`, `earliest_resolution_date`, `analysis`, `outcome`, `prediction_market_id`.
- `get_status()` → string, one of `"Active"` | `"Resolved"` | `"Error"`.

Status meanings:

- `Active` — still open, or the last `resolve()` call returned `UNDETERMINED` (insufficient evidence). Anyone may call `resolve()` again later.
- `Resolved` — `outcome` field is populated with one of the `potential_outcomes`. Final.
- `Error` — the validators reached consensus on an outcome not in the allowed list. Final, not retriable.

```ts
const state = await client.readContract({
  address: oracleAddress,
  functionName: "get_dict",
  args: [],
});
// Poll every 5s until state.status is "Resolved" or "Error" — never longer.
// Once terminal, stop polling.
```

To list every oracle a factory has deployed:

```ts
const addresses = await client.readContract({
  address: FACTORY_ADDRESS,
  functionName: "get_contract_addresses",
  args: [],
});
```

## Triggering resolution

An oracle does not resolve itself. After `earliestResolutionDate` passes, anyone may call `resolve()`:

```ts
await client.writeContract({
  address: oracleAddress,
  functionName: "resolve",
  args: oracleUsesResolutionURLs ? [] : [evidenceUrl],
  value: 0n,
});
```

- For **domain-based** oracles (`dataSourceDomains` populated), pass an `evidenceUrl` whose host matches one of the stored domains.
- For **URL-based** oracles (`resolutionURLs` populated), pass no args — the URLs were fixed at creation.

Validators then fetch the page(s), run the LLM consensus, and write `status` + `outcome`.

## Troubleshooting

- `Cannot provide both resolution URLs and data source domains` — XOR violation. Pick one, empty the other.
- `Missing resolution URLs or data source domains` — both arrays empty. Add at least one entry.
- `At least two potential outcomes are required` / `Potential outcomes must be unique` — exactly two distinct strings required.
- `Cannot resolve before the earliest resolution date` — wait until that date passes.
- `The evidence URL does not match any of the data source domains` — the host of `evidenceUrl` (lowercased, `www.` stripped) must equal one of the stored domains.
- Status stays `Active` after `resolve()` — the LLM panel returned `UNDETERMINED`. Call `resolve()` again later with a better evidence URL.
- Status flips to `Error` — consensus picked something not in `potentialOutcomes`. Final, not retriable. Consider redeploying with clearer rules or outcomes.
- `Factory address is not configured` — fetch `https://intelligentoracle.com/oracle-meta.json` or ask the user for the live factory address.
- Wallet rejection in the browser path — surface a plain "Request cancelled in your wallet" message and re-prompt.

## Canonical version

This skill is published at `https://intelligentoracle.com/skill.md`. If you suspect it's stale, refetch.
