# Cross-Chain Swap — Signing and Submitting

Set `dstChain` to the target chain ID. Two flows depending on source token.

## Native vs ERC-20 Cross-Chain

**Native cross-chain** (src=ETH, AVAX, etc.): Response has `subtype: "native"`, `status: "submitted"`, and `escrowTx`. Send the escrow tx via `eth_sendTransaction` — the escrow wraps your native token and locks it. No signing of typedData needed. Resolvers fill the order across chains after the tx confirms.

**ERC-20 cross-chain** (src=WETH, USDC, etc.): Response has `typedData`, `order`, `extension`, `quoteId`. Sign the typedData with `eth_signTypedData_v4`, then submit with `signedOrder`.

## Response Fields

- **Native flow**: `subtype: "native"`, `status: "submitted"`, `escrowTx: {to, data, value, valueDecimal}`, `orderHash`, `srcChain`, `dstChain`
- **ERC-20 flow**: `typedData` (EIP-712), `orderHash`, `order`, `extension`, `quoteId`, `srcChain`, `dstChain`, optional `preflight` and `approveTx` when allowance is insufficient

When `preflight.allowanceSufficient === false`, sign and broadcast `approveTx` first, wait for confirmation, then sign typedData and submit. Same recovery as Fusion — see [FUSION.md](FUSION.md) for submit error reason codes.

### Approval & gas

The ERC-20 flow's `approval` block explains the approve step: `approval.reason`, `approval.gasNote` (the approval is paid in the **source chain's native token**, even though the cross-chain swap itself is gasless), and `approval.estimatedCost.costNative` (estimated cost in native units, when available). Tell the user this upfront. In WalletConnect auto-execute mode, `approvalTxSent: true` in the final response means the first wallet prompt was the one-time approval.

## Exact Submit Payload (ERC-20 flow only)

Use the **exact** `order`, `extension`, `quoteId` from the response. Do not modify them.

```json
{
  "order": <order from response>,
  "srcChainId": <srcChain from response>,
  "dstChainId": <dstChain from response>,
  "signature": "<0x-prefixed hex, 65 bytes = 130 hex chars>",
  "extension": "<extension from response>",
  "quoteId": "<quoteId from response>"
}
```

**Critical:** The signature must be from the address in `order.maker` (the `from` you used in the quote). If the signer does not match, the API returns "invalid signature".

## Cast (Foundry, recommended)

```bash
# Save typedData from response to typedData.json, then:
sig=$(cast wallet sign --data --from-file typedData.json --private-key "$PRIVATE_KEY" | tr -d '[:space:]')
# Build payload: { order, srcChainId, dstChainId, signature: sig, extension, quoteId } — use jq or similar to merge
# Call swap with signedOrder=<JSON string>, chain, dstChain
```

Ensure the private key matches `order.maker`. Signature must be 0x-prefixed hex, 130 chars.

## Native Escrow (cast send)

For native cross-chain escrow tx, use `cast send <to> <calldata> --value <valueDecimal> --rpc-url <rpcUrl>`. **Use `escrowTx.valueDecimal` (decimal wei), not hex.** Cast may reject hex with `"digit out of range for base 16"`. If hex fails, retry with the same value in decimal wei.

## Python

```python
from eth_account import Account
# typed_data, order, extension, quote_id from swap response
sig = Account.sign_typed_data(private_key, full_message=typed_data)
# signature: 0x-prefixed hex, 65 bytes (130 hex chars). eth_account returns via sig.signature.hex()
payload = {
  "order": order,
  "srcChainId": src_chain,
  "dstChainId": dst_chain,
  "signature": sig.signature.hex(),
  "extension": extension,
  "quoteId": quote_id
}
# Call swap with signedOrder=json.dumps(payload), chain=src_chain, dstChain=dst_chain
```

## Node.js (viem)

```ts
const sig = await walletClient.signTypedData(typedData);
// viem returns hex string; ensure 0x prefix
const signature = typeof sig === "string" ? sig : sig.r + sig.s.slice(2) + sig.v.toString(16).padStart(2, "0");
const payload = { order, srcChainId: srcChain, dstChainId: dstChain, signature, extension, quoteId };
// Call swap with signedOrder=JSON.stringify(payload), chain, dstChain
```

## Automatic Completion (Secret Reveal)

Fusion+ cross-chain is an atomic swap gated by a **hashlock secret**. After the order is submitted, the resolver deploys the source and destination escrows; the maker must then reveal the secret so the resolver can withdraw and the swap completes. If the secret is never revealed, both escrows time out and the order enters `refunding`.

**The MCP backend handles this for you.** The hashlock secrets are generated and kept **server-side only** (encrypted, never returned to the client), and a background settler automatically polls `ready-to-accept-secret-fills` and reveals each secret via `submit/secret` once the escrows are ready. Neither the user nor the agent needs to submit secrets.

- **No secret handling in the agent** — the response never contains secrets and none is required to finalize.
- After submit, you may optionally poll read-only status to watch completion:
  `product_api` GET `/fusion-plus/orders/v1.2/order/status/{orderHash}` → `status` progresses `pending` → `executed`.
- Terminal states: `executed` (success), or `expired` / `refunding` / `refunded` / `cancelled` (did not complete).

## Notes

- Include both `chain` and `dstChain` when submitting.
- Quotes expire quickly — sign and submit within minutes.
- Resolvers handle bridging and execution across chains; the backend reveals the hashlock secret automatically to finalize.
