# Security Policy

This package is a set of **agent instructions**, not a running service. Its
security surface is what an agent is told to do while it holds a wallet, a
delegated spending budget, or provider API keys — so "a vulnerability" here
usually means text that can make a correctly-behaving agent act against its
user.

## Reporting a vulnerability

Report suspected vulnerabilities privately — do **not** open a public issue.

- Preferred: GitHub private vulnerability reporting on this repository
  (**Security → Report a vulnerability**).
- Alternative: email `security@internetcourt.org`.

Please include the file and line (or the URL, for fetched content), the commit
you reviewed, the exact text or sequence that causes the unsafe behavior, and
what an agent following it would do that it should not. If you have a
reproduction, a transcript of the agent's turn is worth more than a description
of it.

We aim to acknowledge a report within 3 working days and to agree a disclosure
timeline with you before any public write-up.

## Scope

In scope — the first-party content:

- `SKILL.md`, the master router: its routing tables, its
  **Guardrails** (especially *Untrusted Content*), *Wallet-UI Deployment Mode*,
  and the proof requirements that gate every claim of an on-chain fact.
- Everything under `integrations/` — the connector skills, including the
  ERC-7710 revocation controller wiring and the x402/ERC-7710 combined rail.
- `skills-lock.json`, `NOTICE.md`, `LICENSE`, `openclaw.plugin.json`,
  `.claude-plugin/`: an entry that resolves to the wrong file, a wrong
  `sourceCommit`, or a wrong license/attribution record is in scope.

Report as a vulnerability, not a bug:

- Instructions that would lead an agent to sign, transact, approve, or delegate
  **without** the user's explicit act in their own wallet UI.
- Any path that would have an agent reveal or transmit a private key, seed
  phrase, session token, or provider credential.
- Unbounded authority: a recommended approval, allowance, mandate, or budget
  with no cap, no expiry, and no revocation path.
- Guardrail bypasses: content, ordering, or phrasing that lets fetched or
  vendored text override a rule in `SKILL.md` — the *Untrusted Content*
  boundary is the control being tested.
- A routing entry that sends the agent to a skill which does something
  materially different from what the table claims.

Out of scope:

- **`vendored/` skill content.** Those files are third-party work published by
  their own authors and are redistributed unmodified. Report the issue to the
  upstream owner listed for that skill in [`NOTICE.md`](NOTICE.md), and open an
  issue here so the vendored copy can be refreshed, pinned to a different
  commit, or removed. If you are the copyright holder of a vendored skill and
  want it gone, `NOTICE.md` documents that removal requests are honoured
  without argument.
- Bugs in the upstream protocols themselves (x402, ERC-7710/7715, ERC-8004,
  A2A, GenLayer, Kleros, …). Report those to the protocol's own maintainers; if
  the flaw makes guidance in this package unsafe, tell us so the guidance can
  change.
- Third-party endpoints this package points at — `raw.githubusercontent.com`,
  `https://www.intelligentoracle.com/skill.md`, provider APIs.
- Findings that require an already-compromised host, agent runtime, or wallet.

## Testing boundaries

These workflows move real value. When testing:

- Use a **testnet** and a throwaway key. Never test with a funded mainnet key,
  and never with someone else's funds.
- Keep spend caps and permission bounds minimal; do not test by granting a
  real unbounded approval.
- Do not run adjudication, arbitration, or dispute flows against live
  counterparties, live escrows, or public registries that others rely on.
- Do not test provider integrations with credentials you were not issued.
- Do not open on-chain disputes or curate-registry challenges as tests — they
  cost other participants time and deposits.

## Known limitations

Stated plainly so they are not reported as discoveries:

- **This package cannot enforce anything.** Every guardrail here is a rule
  addressed to a model, and a sufficiently adversarial context can talk a model
  out of a rule. The enforceable controls live elsewhere: bounded ERC-7710
  permissions, spend caps, revocation controllers, absolute expiries, and the
  user's own wallet confirmation. Treat `SKILL.md` as defense in depth on top of
  those, never as a substitute.
- **Vendored copies are snapshots.** `skills-lock.json` records the
  `sourceCommit` each skill was taken from, but nothing in this repository polls
  upstream. A vendored skill can be behind upstream, and an upstream fix does
  not reach you until the copy is refreshed here.
- **`computedHash` is not verifiable from this repository.** Each lock entry
  carries a `computedHash`, but the repository ships no generator and no
  verifier, and the value does not reproduce as a plain SHA-256 of the entry
  file — so it currently documents provenance rather than proving integrity. Do
  not rely on it to detect tampering. Restoring that guarantee needs the
  generator published alongside a `verify` command, and is tracked as work to do
  rather than an implemented control.
- **Fetching by `main` is a moving target.** When only the master `SKILL.md` is
  installed, sibling skills are fetched over the network. `SKILL.md` tells the
  agent to prefer a pinned ref, but a caller can still fetch `main` and get
  different instructions than a previous run.
- **Provider credentials are handled by the vendored skills.** Several need
  their own API keys (OKX, ChainGPT, Chainbase, and others). How each stores and
  transmits a key is upstream's design, documented in that skill; this package
  does not proxy, wrap, or audit it.
