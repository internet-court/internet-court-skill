---
name: 1inch-swap
description: >-
  Quote and execute token swaps via the 1inch MCP `swap` tool: Classic (DEX aggregation),
  Fusion (gasless intent), and Fusion+/cross-chain. Use when the user wants best rate,
  gasless swap, bridge-less cross-chain, or quote comparison.
license: MIT
compatibility: Requires 1inch MCP server (see 1inch-mcp-server skill) with auth for execution.
---

# 1inch Swap

Use the authenticated MCP tool **`swap`**. Call **`authenticate` first** if you are not already a real user (initialize 200 is still anonymous). Do not hand-build calldata for normal flows.

## Recommended: connect the user's wallet first (WalletConnect)

Unless the user explicitly wants to sign with their own tooling (private key, cast, viem), **offer WalletConnect before executing**: pair via the `walletconnect` tool (see the `1inch-walletconnect` skill), then call `swap`. With an active session, `execute` **defaults to true** — the tool handles approve txs, EIP-712 signing, submission, and native escrow sends through the connected wallet, and the user simply approves each prompt in their wallet app. No key handling, no manual signing steps.

- Set `execute: false` only when the user wants unsigned calldata / typed data to sign elsewhere.
- Set `execute: true` explicitly to require a wallet session (errors if not connected).

## Modes

- **Classic** — on-chain via aggregation router; user pays gas. `preferredType: "classic"`.
- **Fusion** — gasless intent; resolvers fill. `preferredType: "fusion"`.
- **Cross-chain** — set `dstChain`; `preferredType: "crosschain"`.

## Approaches

1. **Wallet-first (recommended):** connect via `walletconnect`, then call `swap` with `src`, `dst`, `amount`, `chain`, `from` (the connected wallet address). The user approves in their wallet.
2. **Shortcut:** call `swap` directly. Omit `preferredType` to let the server recommend, or set it explicitly.
3. **Full flow:** `quoteOnly: true` → compare quotes / `recommended` → execute with chosen `preferredType`.
4. **Manual Fusion/cross-chain submit (no wallet session):** after signing typed data locally, call again with `signedOrder` + `orderHash`.

## Flow guides (bundled references)

Load the reference for your flow before signing or broadcasting:

| Flow        | Reference                                            | MCP resource fallback                     |
| ----------- | ---------------------------------------------------- | ----------------------------------------- |
| Quote       | [references/QUOTE.md](references/QUOTE.md)           | `file://1inch-mcp/guides/swap/quote`      |
| Classic     | [references/CLASSIC.md](references/CLASSIC.md)       | `file://1inch-mcp/guides/swap/classic`    |
| Fusion      | [references/FUSION.md](references/FUSION.md)         | `file://1inch-mcp/guides/swap/fusion`     |
| Cross-chain | [references/CROSSCHAIN.md](references/CROSSCHAIN.md) | `file://1inch-mcp/guides/swap/crosschain` |

The references are the primary source (they work in every client). The MCP resource URIs serve the same content live for clients that read resources.

The manual signing snippets in the references (cast / Python / viem) are only needed **without** a WalletConnect session — with one, the tool executes through the connected wallet automatically.

## Example prompts

- "Quote swapping 100 USDC to ETH on Base"
- "Swap 0.5 ETH to USDT on Arbitrum with Fusion"
- "Swap 100 USDC from Ethereum to Polygon"
