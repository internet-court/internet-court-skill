# Classic Swap — Signing and Broadcasting

Sign and broadcast the transaction returned by the swap tool for classic (on-chain) swaps.

## Response Fields

- `tx`: `{ to, data, value }` — ready to sign
- `step`: `"approve"` or `"swap"` — approve grants router permission; swap executes the trade
- `approval` (step="approve" only): why the approval is needed and its estimated native-gas cost (`approval.estimatedCost.costNative`) — relay this to the user before sending the tx
- `rpcUrl` (when authenticated): Proxy URL for cast — use with `--rpc-url <rpcUrl> --poll-interval 5` (non-async, 5s polling; no `--rpc-http-header` needed)

## Flow

1. **If step="approve"**: Sign and send the approve tx → broadcast via product_api → wait for receipt → call swap again for the swap tx
2. **If step="swap"**: Sign and send the swap tx → broadcast via product_api → wait for receipt — done

## Broadcasting via product_api

Use the `product_api` tool to broadcast signed transactions. Replace `{chainId}` with the chain ID from the swap response.

**Broadcast signed tx:**

```
method: "POST"
path: "/web3/{chainId}"
body: {"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0x<signedTxHex>"],"id":1}
```

**Check receipt:**

```
method: "POST"
path: "/web3/{chainId}"
body: {"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["0x<txHash>"],"id":1}
```

## Local signing (Python, Node.js, cast)

Sign the tx `{to, data, value}` with the user's wallet, then broadcast the signed hex via product_api above.

**Python (web3):**

```python
signed = w3.eth.account.sign_transaction({"to": to, "data": data, "value": int(value)}, private_key)
# Broadcast signed.raw_transaction via product_api
```

**Node.js (viem):**

```ts
const hash = await walletClient.sendTransaction({ to, data, value: BigInt(value) });
// Or signTransaction + broadcast signed hex via product_api
```

**CLI (cast):**

```bash
# Calldata is the 2nd positional arg (cast does not use --data). Use tx.valueDecimal for --value (decimal wei).
# Cast may reject hex with "digit out of range for base 16"; if so, use valueDecimal.
cast send $TO $DATA --value $VALUE_DECIMAL --rpc-url <rpcUrl> --poll-interval 5 --private-key $PRIVATE_KEY
# Example: cast send 0x1111... 0x07ed2379... --value 2000000000000000 --rpc-url "<rpcUrl>" --poll-interval 5 --private-key "$PRIVATE_KEY"
# Non-async send with 5s polling. When rpcUrl is in the response, use it directly (no --rpc-http-header needed).
# Otherwise: cast mktx | cast sign - | broadcast signed hex via product_api
```

## Notes

- product_api uses the same OAuth bearer token as the MCP session.
- When authenticated, the response includes `rpcUrl` — use cast: `cast send <to> <calldata> --value <value> --rpc-url <rpcUrl> --poll-interval 5 --private-key $KEY` (calldata is 2nd positional arg, not `--data`).
