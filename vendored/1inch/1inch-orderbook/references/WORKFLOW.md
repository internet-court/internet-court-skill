# 1inch Orderbook Workflow

Use the **orderbook** tool (authenticated) for Limit Order Protocol v4.1 flows. Required field: `action` — one of `build`, `create`, `list`, `cancel`.

## Build

Server builds the order and returns EIP-712 `typedData`, `orderHash`, `orderData`, and the Limit Order Protocol contract for approvals.

- `makerAsset` / `takerAsset`: token address (0x...) or symbol (e.g. USDC).
- `makingAmount` / `takingAmount`: strings in smallest units.
- `makerAddress`: 0x address that will sign.
- `expirationSeconds`: optional, seconds from now (default 604800 = 7 days).

The response includes a `defaults` object showing all derived values (expiration, receiver, allowPartialFills).

### Approval & gas

When the maker's allowance for the Limit Order Protocol is below `makingAmount`, the build response carries an `approval` block — `approval.reason` (why the one-time ERC-20 approval is needed), `approval.gasNote` (it is paid in the chain's **native token**, even though the limit order itself is gasless), and `approval.estimatedCost.costNative` (estimated cost in native units, when available) — plus a ready-to-broadcast `approveTx`. Tell the user this upfront, broadcast the `approveTx` (**product_api** Web3 path or the maker wallet), wait for confirmation, then sign. Do not check the user's native balance on their behalf — mention the requirement and let the user decide.

In WalletConnect auto-execute mode the approve is sent automatically; `approvalTxSent: true` in the final response means the first wallet prompt was the one-time approval and used native gas.

## Sign

Sign `typedData` with **eth_signTypedData_v4** (same wallet as `maker`).

## Create

Call orderbook with `action: "create"`, same `chain`, plus `orderHash`, `signature`, and `orderData` from the build response.

## List

`action: "list"` with `listMode`:

| Mode       | Required                                                  |
| ---------- | --------------------------------------------------------- |
| `by_maker` | `makerAddress`                                            |
| `by_hash`  | `orderHash`                                               |
| `all`      | optional `limit`, `cursor`, `statuses`, `sortBy`, filters |

## Cancel

`action: "cancel"` loads order state. There is no HTTP cancel endpoint — cancel on-chain via the Limit Order Protocol or SDK; see response `nextSteps`.

## Raw REST

For paths not covered by the tool, use **product_api** and discover endpoints from the API index: https://business.1inch.com/portal/llms.txt (Swagger links per product).

## Common chain IDs

| Chain    | ID    |
| -------- | ----- |
| Ethereum | 1     |
| Arbitrum | 42161 |
| Base     | 8453  |
| Polygon  | 137   |
| BSC      | 56    |
