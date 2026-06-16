# Risk Approval Monitoring

`onchainos security approvals` — query token approval and Permit2 authorizations for a wallet address.

## Parameters

| Parameter | Required | Description |
|---|---|---|
| `--address` | **Yes** | EVM wallet address to query. |
| `--chain` | No | Comma-separated EVM chain names or indexes (e.g. `"ethereum,base"` or `"1,8453"`). Without this flag, all supported EVM chains are queried. |
| `--limit` | No | Results per page (default: 20). |
| `--cursor` | No | Pagination cursor from previous response. |

## Usage

```bash
# Query all chains
onchainos security approvals --address 0xYourAddress

# Query specific chains
onchainos security approvals --address 0xYourAddress --chain "ethereum,base"
```

## Return Fields

| Field | Type | Description |
|---|---|---|
| `approvalList` | Array | List of approval entries |
| `approvalList[].tokenSymbol` | String | Token symbol (e.g. `USDC`) |
| `approvalList[].tokenAddress` | String | Token contract address |
| `approvalList[].chainIndex` | String | Chain index |
| `approvalList[].spenderAddress` | String | Address that holds the allowance |
| `approvalList[].allowance` | String | Approved amount (raw, `"unlimited"` if max uint256) |
| `approvalList[].riskLevel` | String | Risk level of the approval |
| `cursor` | String | Pagination cursor for next page |

## Important Notes

**EVM only**: Approvals are an EVM-only concept. Always pass an EVM address. When the user is logged in, use the EVM address from `onchainos wallet status` — do not pass Solana or other non-EVM addresses.

**Default address**: If the user does not specify an address, use the EVM address of the currently logged-in Agentic Wallet (from `onchainos wallet status`). Only ask the user for an address if no wallet session is active.

## Revoke Guidance

After identifying risky approvals, guide the user to revoke by constructing `approve(spender, 0)` calldata and:
- **Path A (external wallet)**: User signs the revoke calldata externally -> `onchainos gateway broadcast`
- **Path B (Agentic Wallet)**: `onchainos wallet contract-call --to <token_contract> --chain <chain> --input-data <revoke_calldata>`

**Always run `onchainos security tx-scan` on the revoke calldata before executing.**

## Examples

**User says:** "Show my token approvals on Ethereum"

```bash
onchainos security approvals --address 0xMyWallet --chain ethereum
# -> Display:
#   Chain: Ethereum
#   USDC: approved unlimited to 0xSpender1 (LOW risk)
#   WETH: approved 1000 to 0xSpender2 (LOW risk)
```

**User says:** "Show me approvals across all my chains"

```bash
onchainos security approvals --address 0xMyWallet
# -> Display:
#   Chain: Ethereum
#   USDT: approved unlimited to 0xMaliciousSpender (HIGH risk — SPENDER_ADDRESS_BLACK)
#   Recommendation: Revoke this approval immediately.
```

## Workflow: Review and Revoke Risky Approvals

> User: "Check my approvals" or triggered by `ACCOUNT_IN_RISK` from tx-scan

```
1. onchainos security approvals --address <addr>
       -> list all active approvals
2. Identify risky approvals (unlimited allowances, unknown spenders, etc.)
3. For each risky approval, construct revoke calldata: approve(spender, 0)
4. onchainos security tx-scan --chain <chain> --from <addr> --to <token_contract> --data <revoke_calldata>
       -> verify the revoke tx itself is safe
5. Execute revoke:
   Path A (external wallet): user signs externally -> onchainos gateway broadcast
   Path B (Agentic Wallet): onchainos wallet contract-call --to <token_contract> --chain <chain> --input-data <revoke_calldata>
```
