# CLAUDE.md

Guidance for agents working in this repository.

## What this is

The Internet Court skill package — "the trust layer for agent-to-agent
commerce". A master skill (`SKILL.md`) routes across the six-layer agentic
commerce stack to vendored protocol skills and Internet Court connector
skills. `README.md` has the stack table and layout. The repo is
self-contained: everything an agent needs ships inside it.

## Hard rules

- **Lightweight and portable.** This repo is a skill package only: no
  runnable apps, wallets, keystores, deployment scripts, or secrets. Demo
  workspaces live elsewhere, never here.
- **First-party = main skill + connectors ONLY.** The only skills written in
  this repo are `SKILL.md`, `integrations/genlayer-erc7710-connector/`,
  `integrations/genlayer-intelligent-contracts/`, and `integrations/x402-erc7710/`. Never write a new
  protocol skill here — protocol coverage must be a publicly published
  skill, vendored as a copy. If no public skill exists, ask the user; they
  will source it from the partner.
- **Never hand-edit `vendored/*`.** Vendored skills are faithful upstream
  copies (including whatever extra files upstream ships, and upstream's
  file casing — e.g. `vendored/metamask/smart-accounts-kit/skill.md` is lowercase).
  Change them only by refreshing from upstream (workflow below).
- **Vendored skills are grouped by owner.** Each one lives at
  `vendored/<owner>/<skill>/`, where `<owner>` is the publishing
  company/protocol (e.g. `vendored/metamask/smart-accounts-kit/`,
  `vendored/okx/okx-dex-swap/`, `vendored/genlayer/write-contract/`). Each
  entry's `vendoredPath` in `skills-lock.json` is the source of truth for
  where a skill lives.
- **Plain Agent Skills format** for first-party skills: a folder with a
  `SKILL.md` whose frontmatter has `name` (matching the folder) and
  `description`.
- **`references/` is local-only** (gitignored): working notes — consortium
  positioning, mandate patterns, demo runbooks. Never commit it and never
  link to it from committed files.
- **Do not commit** unless the user asks. Released versions are tagged
  (`v1`, `v2`, …).

## Updating vendored skills (new versions)

Every vendored skill is pinned in `skills-lock.json` with its `source`,
`skillPath`, `computedHash`, `fetchedAt`, and a `refreshCommand`. To update
one or all skills to the latest upstream version:

1. Run the entry's `refreshCommand` from the repo root. Most are
   `npx skills add <source>[/<path>] --agent claude-code -y && mv .claude/skills/<name> vendored/<owner>/`
   (replace the existing folder); the rest are `git clone … && cp -R …` or
   `curl …` for skills published as a bare `skill.md` URL
   (`intelligent-oracle`, `antseed-connect`).
2. Diff the new copy against the old one before accepting — upstream changes
   run with full agent permissions, so review them like third-party code.
3. Update the lock entry: recompute the hash
   (`shasum -a 256 vendored/<owner>/<name>/SKILL.md`), set `fetchedAt` to today, and
   update `sourceCommit` where present (`git rev-parse HEAD` in the clone).
   Note: entries created by the `npx skills` CLI use the CLI's own hash; the
   `hashAlgo: "sha256(SKILL.md)"` entries are plain file hashes.
4. If upstream added/removed/renamed skills, mirror that in `vendored/`,
   `skills-lock.json`, `vendored/README.md`, and the routing tables in
   `SKILL.md` and `README.md` (a skill is only discoverable if a routing row
   points at it).
5. Run the checks below, then commit and tag the next version (`v2`, `v3`,
   …) when the user asks for a release.

To add a brand-new protocol/partner skill: confirm the verified upstream
source, fetch it the same way, pin it, and add routing rows.

Validation checks before any release:

- Every first-party `SKILL.md` starts with `---`, has `name:` matching its
  folder, and a non-empty `description:`.
- `python3 -m json.tool skills-lock.json` parses; every skill folder
  (`vendored/<owner>/<name>/`) has a lock entry whose `vendoredPath` matches,
  and vice versa; `sha256(SKILL.md)` hashes match.
- Relative links in `SKILL.md` and `README.md` resolve to committed files
  (nothing may point into `references/`).

## Design principles

- GenLayer does not cancel ERC-7710 authority by itself: the Intelligent
  Contract produces a decision; a relayer/controller on the EVM side
  enforces it. Keep that honestly disclosed everywhere.
- Keep an absolute expiry and an emergency owner revoke as fail-safes on any
  long-lived permission.
- Treat ERC-7710/7715 as draft and implementation-dependent until the target
  wallet stack proves support.
- Testnet-first; never unlimited approvals or unbounded agent spend.
- Never claim a wallet, permission, deployment, payment, review, or relay
  exists without a proof (tx hash, address, signed artifact, receipt).

## Map

| Path | What |
|---|---|
| `SKILL.md` | Master router skill — trust modes, stack table, skill routing |
| `integrations/genlayer-erc7710-connector/` | GenLayer decision → ERC-7710 revocation (relayer/controller pattern) |
| `integrations/genlayer-intelligent-contracts/` | Review rubrics, evidence schemas, decision payload interface |
| `integrations/x402-erc7710/` | x402 payments through delegated permissions (combined rail) |
| `vendored/<owner>/` | Pinned copies of official protocol skills, grouped by publisher (`skills-lock.json`) |
| `references/` | Local-only working notes (gitignored, not part of releases) |
