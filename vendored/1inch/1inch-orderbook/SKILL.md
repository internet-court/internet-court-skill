---
name: 1inch-orderbook
description: >-
  Build, sign, create, list, and cancel limit orders via the 1inch MCP `orderbook` tool
  (Limit Order Protocol v4.1). Use when the user wants buy/sell at a target price,
  maker orders, or partial fills.
license: MIT
compatibility: Requires 1inch MCP server with authentication.
---

# 1inch Orderbook (limit orders)

Use the authenticated MCP tool **`orderbook`**. Call **`authenticate` first** if you are not already a real user (initialize 200 is still anonymous). Required field: `action` — `build` | `create` | `list` | `cancel`.

## Recommended: connect the user's wallet first (WalletConnect)

Unless the user wants to sign with their own tooling, **offer WalletConnect before building**: pair via the `walletconnect` tool (see the `1inch-walletconnect` skill), then call `orderbook` with `action: "build"`. With an active session, `execute` **defaults to true** — the tool signs the EIP-712 typed data and submits the order through the connected wallet in one step (including the one-time approve tx when needed); the user simply approves the prompts in their wallet app.

Set `execute: false` to get the typed data back for signing elsewhere.

## Manual flow (no wallet session)

1. **build** — server returns EIP-712 `typedData`, `orderHash`, `orderData`. Amounts in smallest units; assets as address or symbol.
2. **sign** — `eth_signTypedData_v4` with the maker wallet.
3. **create** — submit `orderHash`, `signature`, `orderData`.
4. **list** — `listMode`: `by_maker` | `by_hash` | `all`.
5. **cancel** — loads on-chain cancel guidance (no HTTP cancel).

If build returns an `approval` block, broadcast `approveTx` first (native gas), then sign.

Full playbook (parameters, approval & gas, list modes, chain IDs): [references/WORKFLOW.md](references/WORKFLOW.md). Same content is served live as MCP resource `file://1inch-mcp/guides/orderbook-workflow` for clients that read resources.

## Example prompts

- "Build a limit order to sell 1 WETH for USDC on Ethereum"
- "List my open limit orders for 0x…"
