# Fusion Swap — Signing and Submitting

Fusion swaps are gasless. Sign the EIP-712 typedData, then submit via the swap tool.

## Response Fields

- `typedData`: EIP-712 object `{types, domain, primaryType, message}`
- `orderHash`: Order identifier
- `order`, `extension`, `quoteId`: Required for submit payload

**Native Fusion** (src=ETH): Response has `subtype:"native"` and `escrowTx`. You send an on-chain tx to lock native tokens (escrow path); resolvers fill after that. No EIP-712 signing — server generates the order.

**ERC-20 Fusion**: Sign EIP-712 typedData, submit signedOrder. No on-chain tx; resolvers fill gaslessly. Allowance may be required for the source token.

### Preflight and approveTx (ERC-20)

The response may include `preflight` and `approveTx` when allowance is insufficient:

- `preflight.allowanceSufficient`: `false` when the wallet has not approved enough tokens for the 1inch router
- `approveTx`: Ready-to-send approval tx `{to, data, value, valueDecimal}` — sign and broadcast this first, wait for confirmation, then sign the typedData and submit

If `preflight.allowanceSufficient === false`, the first nextStep is to sign and broadcast `approveTx` before signing the typedData.

### Approval & gas

When `preflight.allowanceSufficient` is `false`, the response also carries an `approval` block: `approval.reason` (why the one-time ERC-20 approval is needed), `approval.gasNote` (it costs the source chain's native token — even though the Fusion swap itself is gasless), and `approval.estimatedCost.costNative` (estimated cost in native units, when available). Tell the user this upfront before prompting them to sign.

In WalletConnect auto-execute mode the approve is sent automatically; the final response then contains `approvalTxSent: true` — explain that the first wallet prompt was the one-time approval and used native gas.

## Flow (ERC-20)

1. Sign typedData with eth_signTypedData_v4
2. Build payload: `{ order, srcChainId, signature, extension, quoteId }` using **exact** order, extension, quoteId from response
3. Call swap with `signedOrder=<JSON string of payload>`

**Critical:** The signature must be from `order.maker` (the `from` address). "Invalid signature" means signer ≠ maker.

## Cast (Foundry, recommended)

```bash
# Save typedData from response to typedData.json, then:
sig=$(cast wallet sign --data --from-file typedData.json --private-key "$PRIVATE_KEY" | tr -d '[:space:]')
# Build payload: { order, srcChainId, signature: sig, extension, quoteId } — use jq or similar to merge
# Call swap with signedOrder=<JSON string of payload>
```

Ensure the private key matches `order.maker` (the `from` address). Signature must be 0x-prefixed hex, 130 chars.

## Python (eth_account)

```python
from eth_account import Account
sig = Account.sign_typed_data(private_key, full_message=typed_data)
payload = {"order": order, "srcChainId": chain, "signature": sig.signature.hex(), "extension": extension, "quoteId": quoteId}
# Call swap with signedOrder=json.dumps(payload)
```

## Node.js (viem)

```ts
const sig = await walletClient.signTypedData(typedData);
const signature = typeof sig === "string" ? sig : sig.r + sig.s.slice(2) + sig.v.toString(16).padStart(2, "0");
const payload = { order, srcChainId: chain, signature, extension, quoteId };
// Call swap with signedOrder=JSON.stringify(payload)
```

## Native Fusion (ETH → token)

When `rpcUrl` is in the response, use cast (calldata is 2nd positional arg, not `--data`). Cast is not compatible with product_api — use rpcUrl.

```bash
cast send $TO $DATA --value $VALUE_DECIMAL --rpc-url "<rpcUrl>" --poll-interval 5 --private-key "$PRIVATE_KEY"
# Use escrowTx.valueDecimal (decimal wei), not hex. Cast may reject hex with "digit out of range for base 16".
# Example: cast send 0x1111... 0x07ed2379... --value 2000000000000000 --rpc-url "<rpcUrl>" --poll-interval 5 --private-key "$PRIVATE_KEY"
```

Otherwise broadcast `escrowTx` via product_api:

```
method: "POST"
path: "/web3/{chainId}"
body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0x<signedEscrowTxHex>"],"id":1}
```

After tx confirms, resolvers fill — no further action.

## Submit Error Recovery

When submit returns an error, the response includes `reasonCode` and `nextSteps` for remediation:

| reasonCode          | Meaning                                         | Action                                                                                 |
| ------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ALLOWANCE_TOO_LOW` | NotEnoughBalanceOrAllowance — usually allowance | Check on-chain allowance. Send approve tx. Regenerate quote, sign, resubmit.           |
| `INVALID_SIGNATURE` | Signer ≠ order.maker                            | Re-sign with the wallet that matches order.maker.                                      |
| `QUOTE_EXPIRED`     | Quote or order no longer valid                  | Call swap again for a fresh quote, sign, resubmit.                                     |
| `UNKNOWN`           | Other error                                     | Check error message; if allowance/balance related, approve and retry with fresh quote. |

**NotEnoughBalanceOrAllowance**: Most often this is insufficient allowance (e.g. USDC on Base). Send the approve tx (from `approveTx` in a prior response, or call swap with preferredType=classic to get an approve step), wait for confirmation, then get a new Fusion quote and submit.

## Notes

- EIP-712 signing: use cast (recommended), Python, or Node.js.
- Resolvers fill the order on-chain; user pays no gas (except native escrow).
- product_api uses the same OAuth bearer token as the MCP session.
- Native Fusion: when `rpcUrl` is present, use `cast send <to> <calldata> --value <value> --rpc-url <rpcUrl> --poll-interval 5 --private-key $KEY` for the escrow tx (calldata is 2nd positional arg).
