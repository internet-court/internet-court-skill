---
name: trustless-agents
description: ERC-8004 Trustless Agents — on-chain agent identity + reputation. Resolve an agent by id (Identity Registry ERC-721 → owner + AgentCard), list the canonical registry addresses, and generate a spec-compliant agent registration card (registration-v1, with x402 support + trust models). Custody-free, read + scaffolding. Triggers: ERC-8004, trustless agent, agent identity, agent registry, AgentCard, agent reputation, on-chain agent, A2A, agent discovery, agent card, 8004.
---

# ERC-8004 Trustless Agents skill

ERC-8004 (draft EIP) gives AI agents a portable on-chain identity + reputation:
the **Identity Registry** is an ERC-721 ("AgentIdentity") deployed as a singleton
at the vanity address `0x8004A169…` across many chains (verified on Base
mainnet). An agent's `tokenURI` points to an AgentCard describing what it does,
its endpoints (A2A/MCP), trust models, and x402 support.

## Tools

| Tool | Purpose |
|---|---|
| `chaingpt_erc8004_resolve_agent` | Resolve `agentId` → owner + decoded AgentCard (handles `data:` and https/ipfs tokenURIs). Read-only. |
| `chaingpt_erc8004_registries` | The canonical Identity + Reputation registry addresses and the chains they're on. |
| `chaingpt_erc8004_agentcard` | Generate a `registration-v1` AgentCard JSON (name, services, `supportedTrust`, `x402Support`) to host at the tokenURI / `/.well-known/agent-card.json`. Optionally emits the `data:` URI form. |

`chaingpt_erc8004_resolve_agent agentId=0 chain=base` → the Genesis Agent.

## Scope

Read + scaffolding are shipped and verified. The **write path** (register /
giveFeedback / validation) is intentionally deferred: ERC-8004 is a draft whose
write ABIs (especially the Validation Registry) are still being revised, so we
don't ship unverified identity/reputation-mutating calldata. Generate the
AgentCard here, then register via the project's reference contracts once the
write ABI is final.

Reads use a public-RPC fallback chain; set `BASE_RPC_URL` for reliability.
0 ChainGPT credits.
