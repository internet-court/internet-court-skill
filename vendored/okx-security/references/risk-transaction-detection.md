# Risk Transaction Detection

`onchainos security tx-scan` — transaction pre-execution security scan (EVM + Solana).
`onchainos security sig-scan` — message signature security scan (EVM only).

## tx-scan

### EVM Parameters

| Parameter | Required | Description |
|---|---|---|
| `--chain` | Yes | EVM chain (16 supported chains) |
| `--from` | Yes | Sender address (0x + 40 hex) |
| `--data` | Yes | Transaction calldata (hex) |
| `--to` | No | Target contract/address |
| `--value` | No | Value in wei — decimal (e.g. `1000000000000000000`) or hex string (e.g. `0xde0b6b3a7640000`); decimal is auto-converted to hex |
| `--gas` | No | Gas limit |
| `--gas-price` | No | Gas price |

### Solana Parameters

| Parameter | Required | Description |
|---|---|---|
| `--chain solana` | Yes | Must be `solana` or `501` |
| `--from` | Yes | Sender (Base58) |
| `--encoding` | Yes | `base58` or `base64` |
| `--transactions` | Yes | Comma-separated tx payloads |

### Usage

**EVM:**
```bash
onchainos security tx-scan \
  --chain <chain> \
  --from <address> \
  --data <calldata_hex> \
  [--to <address>] \
  [--value <hex_wei>] \
  [--gas <number>] \
  [--gas-price <number>]
```

**Solana:**
```bash
onchainos security tx-scan \
  --chain solana \
  --from <base58_address> \
  --encoding <base58|base64> \
  --transactions <payload1,payload2,...>
```

## sig-scan

| Parameter | Required | Description |
|---|---|---|
| `--chain` | Yes | EVM chain name or ID |
| `--from` | Yes | Signer address (0x + 40 hex) |
| `--sig-method` | Yes | One of: `personal_sign`, `eth_sign`, `eth_signTypedData`, `eth_signTypedData_v3`, `eth_signTypedData_v4` |
| `--message` | Yes | Message content or EIP-712 typed data JSON |

### Usage

```bash
onchainos security sig-scan \
  --chain <chain> \
  --from <address> \
  --sig-method <personal_sign|eth_sign|eth_signTypedData|eth_signTypedData_v3|eth_signTypedData_v4> \
  --message <message_or_typed_data_json>
```

## Return Fields (shared by tx-scan and sig-scan)

| Field | Type | Description |
|---|---|---|
| `action` | String | Risk action: `""` (safe), `"warn"` (medium risk), `"block"` (high risk) |
| `riskItemDetail` | Array | List of detected risk items |
| `riskItemDetail[].name` | String | Risk item identifier (e.g. `black_tag`, `approve_eoa`) |
| `riskItemDetail[].description` | Map | Risk description (multi-language) |
| `riskItemDetail[].reason` | Array | List of trigger reasons |
| `riskItemDetail[].action` | String | `"block"` or `"warn"` |
| `simulator` | Object | Transaction simulation result |
| `simulator.gasLimit` | Integer | Estimated gas (EVM: `gasLimit`, Solana: `gasUsed`) |
| `simulator.revertReason` | String | Revert reason if simulation failed (null if success) |
| `warnings` | Array | Warning messages (result is still usable but may be incomplete) |

## Risk Items Reference

| Risk Item | Description | Level | Action |
|---|---|---|---|
| `black_tag` | Target/asset/receiving address is blacklisted | CRITICAL | block |
| `from_risk_reject` | Sender address is blacklisted | CRITICAL | block |
| `SPENDER_ADDRESS_BLACK` | Approval target is blacklisted | CRITICAL | block |
| `ASSET_RECEIVE_ADDRESS_BLACK` | Asset receiving address is blacklisted | CRITICAL | block |
| `purchase_malicious_token` | Purchasing a malicious token | CRITICAL | block |
| `ACCOUNT_IN_RISK` | Account has existing malicious approvals | CRITICAL | block — additionally, guide the user to run `onchainos security approvals --address <addr>` to review and revoke risky approvals immediately |
| `evm_7702_risk` | EIP-7702 high-risk sub-transaction (no asset increase). EIP-7702 allows an EOA to delegate execution to an arbitrary contract, effectively granting permanent control — treat as equivalent to unlimited approval | CRITICAL | block |
| `evm_7702_auth_address_not_in_whitelist` | EIP-7702 upgrade contract not in whitelist. The EOA is delegating to an unverified contract, which could execute arbitrary operations on behalf of the account | CRITICAL | block |
| `evm_okx7702_loop_calls_are_not_allowed` | EIP-7702 sub-transaction recursive call — may indicate an exploit attempting to drain funds through re-entrancy | CRITICAL | block |
| `TRANSFER_TO_SIMILAR_ADDRESS` | Transfer to a similar address (vanity address phishing) — one of the most common causes of fund loss | HIGH | warn — display full address comparison (intended vs. detected similar address) and require explicit user confirmation before proceeding |
| `SOLANA_SIGN_ALL_TRANSACTIONS` | Solana sign-all-transactions request | HIGH | warn |
| `multicall_phishing_risk` | Token approval via multicall (phishing) | HIGH | warn |
| `approve_anycall_contract` | Approval to arbitrary external call contract | HIGH | warn |
| `to_is_7702_address` | Target is a 7702 upgraded address | MEDIUM | warn |
| `TRANSFER_TO_CONTRACT_ADDRESS` | Transfer directly to a contract | MEDIUM | warn |
| `TRANSFER_TO_MULTISIGN_ADDRESS` | Tron transfer to multisig | MEDIUM | warn |
| `approve_eoa` | Approval to an EOA (personal address) | MEDIUM | warn |
| `increase_allowance` | Increasing approval allowance | LOW | warn |
| `ACCOUNT_INSUFFICIENT_PERMISSIONS` | Tron account insufficient permissions | LOW | warn |

## Suggest Next Steps

| Result | Suggest |
|---|---|
| tx-scan safe | 1. Broadcast the transaction 2. Check wallet balance |
| tx-scan risky | 1. Check token safety with token-scan 2. Review approval list |
| sig-scan safe | Safe to sign. |
| sig-scan risky | Do NOT sign. Show risk details. |

## Workflows

### Signature Safety Check

> User: "Should I sign this EIP-712 permit request?"

```
1. onchainos security sig-scan --chain ethereum --from 0xWallet --sig-method eth_signTypedData_v4 --message '{"types":...}'
       -> check for phishing signatures
2. Display risk assessment
```

### Approve Safety Check

> User: "Is this approve transaction safe?"

```
1. onchainos security tx-scan --chain ethereum --from 0xWallet --to 0xToken --data 0x095ea7b3...
       -> check SPENDER_ADDRESS_BLACK, approve_eoa, increase_allowance
2. Display risk assessment
```

## Examples

**EVM tx-scan — approve calldata:**

```bash
onchainos security tx-scan --chain ethereum --from 0xabc123... --to 0xTokenContract --data 0x095ea7b3000000000000000000000000def456...00000000000000000000000000000000000000000000000000000000ffffffff
# -> Display:
#   Risk Level: HIGH (block)
#   Risk: SPENDER_ADDRESS_BLACK - The approval target address is on the blacklist
#   Recommendation: Do NOT approve this transaction. The spender address has been flagged as malicious.
```

**Solana tx-scan:**

```bash
onchainos security tx-scan --chain solana --from EeBCkp5j17U5Fg4bEiboHvRrUvQ4LP9AdioQwPg5wF43 --encoding base64 --transactions "CAurZp2HY+l9yM1By3HbAABCA=="
# -> Display:
#   Risk Level: LOW (safe)
#   No risks detected. Transaction simulation successful.
#   Estimated gas: 5000
```

**sig-scan — EIP-712 permit:**

```bash
onchainos security sig-scan --chain ethereum --from 0xMyWallet --sig-method eth_signTypedData_v4 --message '{"types":{"EIP712Domain":[{"name":"name","type":"string"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"USDC"},"message":{"owner":"0xMyWallet","spender":"0xMalicious","value":"115792089237316195423570985008687907853269984665640564039457584007913129639935"}}'
# -> Display:
#   Risk Level: HIGH (block)
#   Risk: SPENDER_ADDRESS_BLACK - The permit spender address is blacklisted
#   Recommendation: Do NOT sign this request. The spender is flagged as malicious.
```
