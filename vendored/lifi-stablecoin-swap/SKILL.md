---
name: lifi-stablecoin-swap
description: |
  Build a production 1:1 stablecoin swap with LI.FI Intents — an interface or backend where
  the amount the user sends equals the amount they receive (no visible gas or solver fees),
  same-chain or cross-chain, filled by LI.FI's solver network and verifiable on-chain.

  USE THIS SKILL WHEN USER WANTS TO:
  - Build a 1:1 stablecoin swap interface ("send 100 USDC, receive 100 USDC"), same- or cross-chain
  - Add stablecoin transfers with a guaranteed output amount to an app, backend, or bot
  - Build enterprise/fintech-grade transfers with no visible gas or solver fees for the end user
  - Implement the LI.FI Intents quote -> approve -> escrow open -> status loop for stablecoins
  - Move USDC / USDT 1:1 across chains under an onboarded LI.FI integrator
  - Understand how the LI.FI integrator ID / Partner Portal enables 1:1 quoting
  - Use the @lifi/intent TypeScript SDK to quote, build, open, and track an intent order

  This skill is self-contained and covers the integration end to end via the `@lifi/intent` SDK
  (the primary path), with the raw `order.li.fi` REST endpoints as a language-agnostic option.
  For the wider LI.FI product surface (classic swaps/bridges, Composer, Earn), use the `lifi` skill.
---

# Build a 1:1 Stablecoin Swap with LI.FI Intents

A normal crypto transfer leaks value to gas and spreads — send 100 USDC, ~99.8 arrives. For a
neobank, payment processor, or regulated fintech, that's a non-starter: their users expect that
sending 100 means 100 arrives.

LI.FI Intents lets you offer exactly that — **send 100 USDC, receive 100 USDC** (or USDT, or
another supported stablecoin), same-chain or cross-chain. A solver from LI.FI's network fronts
the destination gas and sources the liquidity, then settles against the user's deposit, so the
end user sees one number from start to finish, provable on a public block explorer.

The primary integration is the **`@lifi/intent` TypeScript SDK** — it requests the quote, builds
the on-chain order, and tracks it. The raw REST API is in §7 for non-TypeScript backends.

---

## 1. Enable 1:1 quoting on your integrator account

1:1 stablecoin quoting is a capability provisioned on your **LI.FI integrator account**:

1. Register an integrator ID on the **LI.FI Partner Portal** — https://portal.li.fi
2. Complete an integration agreement with LI.FI. As part of onboarding, 1:1 stablecoin quoting is
   enabled for your integrator.
3. Quote requests made **under your integrator key** then return 1:1 amounts for supported
   stablecoin pairs.

The integration code below is identical regardless — what makes the quote come back 1:1 is your
onboarded integrator. See https://docs.li.fi/lifi-intents/introduction or contact LI.FI to enable it.

---

## 2. The flow

`order.li.fi` is the Intents API. The escrow flow is the recommended default and takes four steps:

```
1. Quote     getQuotes(...)                              -> guaranteed output amount (1:1)
2. Approve   ERC-20 approve(InputSettlerEscrow, amount)  -> let the settler pull the input token
3. Open      escrow.open(StandardOrder) on-chain         -> locks funds, emits Open(orderId)
4. Track     GET /orders/status?onChainOrderId=...         -> Signed -> Delivered -> Settled
```

Opening the order emits `Open(bytes32 indexed orderId, ...)`; solvers watch for that event and fill
on the destination chain, so the escrow flow needs **no order-submission call**. You poll status
until the funds land, then show the user the destination transaction. The `orderId` is the
receipt — anyone can independently verify the deposit and the delivery matched.

(There is also a **Compact / gasless** flow — deposit once into The Compact, then sign and submit
each order off-chain. Use escrow unless you specifically want gasless after a one-time deposit.)

```bash
npm install @lifi/intent viem
```

(The runnable interface in the quickstart also uses `wagmi` + `@tanstack/react-query` for the
wallet — its install line includes them.)

> Setup note: the SDK uses `bigint` literals (`100_000_000n`). `create-next-app` defaults
> `tsconfig.json` to `"target": "ES2017"`, which rejects them — set `"target": "ES2020"` (or higher).

---

## 3. Quote (1:1)

`getQuotes` with your integrator key. `IntentApi(true)` targets mainnet / the production solver
network. Amounts are `bigint` in the token's smallest units (100 USDC = `100_000_000n`, 6 decimals).
Under a 1:1-enabled integrator on a supported stablecoin pair, the output equals the input.

```ts
import { IntentApi } from "@lifi/intent";

const api = new IntentApi(true);

const res = await api.getQuotes({
  user,                                              // the user's 0x address
  userChainId: 8453,                                 // source chain (Base)
  integratorKey: process.env.LIFI_INTEGRATOR_KEY,    // your onboarded integrator key
  inputs:  [{ sender: user,   asset: usdcOnBase, chainId: 8453,  amount: 100_000_000n }],
  outputs: [{ receiver: user, asset: usdcOnArb,  chainId: 42161, amount: 0n }],
});

const quote = res.quotes[0];
if (!quote) throw new Error("No quote available for this pair");
const received = BigInt(quote.preview.outputs[0].amount); // == 100_000_000n for a 1:1 pair
const quoteId = quote.quoteId;
```

---

## 4. Build & open the order

The SDK builds the `StandardOrder` for you — pass plain token addresses + chain ids; it computes
the nonce, deadlines, oracle, and EIP-7930 encoding. `getOracle` supplies the verifier oracle
(Polymer addresses below). Then call `open(order)` on the escrow settler the SDK gives you.

```ts
import { Intent, type IntentDeps, type StandardEVM } from "@lifi/intent";
import type { WalletClient } from "viem";

const POLYMER_ORACLE = "0x0000003E06000007A224AeE90052fA6bb46d43C9" as const; // mainnet
const deps: IntentDeps = {
  getOracle: (verifier) => (verifier === "polymer" ? POLYMER_ORACLE : undefined),
};

type Tok = { address: `0x${string}`; chainId: number; decimals: number; name: string };
const ctx = (t: Tok, amount: bigint) => ({
  token: { address: t.address, name: t.name, chainId: BigInt(t.chainId),
           decimals: t.decimals, chainNamespace: "eip155" as const },
  amount,
});

const intent = new Intent({
  inputTokens:  [ctx(fromToken, 100_000_000n)],
  outputTokens: [ctx(toToken, received)],   // `received` from the quote
  verifier: "polymer",
  account: user,
  outputRecipient: user,
  lock: { type: "escrow" },
}, deps).order();

// asOrder() is a union (multichain | EVM | Solana); narrow to the single-chain EVM order
// so it matches the OPEN_ABI StandardOrder tuple.
const order   = intent.asOrder() as StandardEVM; // the StandardOrder struct
const orderId = intent.orderId();                // your tracking handle
const settler = intent.inputSettler;             // InputSettlerEscrow (0x000025c3...)

// 1) ERC-20 approve(settler, amountIn) for the source token if allowance is insufficient
//    (allowance check + ERC20 ABI shown in references/quickstart.md).
// 2) Open the order (full `open` ABI is in references/quickstart.md). viem's writeContract
//    needs `account` and `chain` when the wallet client has none bound:
const txHash = await wallet.writeContract({
  address: settler, abi: OPEN_ABI, functionName: "open", args: [order],
  account: user, chain: wallet.chain,
});
```

---

## 5. Track the order to settlement

Poll `GET https://order.li.fi/orders/status?onChainOrderId=<orderId>`:

```ts
const status = await fetch(
  `https://order.li.fi/orders/status?onChainOrderId=${orderId}`,
).then((r) => r.json());
// status.meta.orderStatus: Signed -> Delivered -> Settled (or Expired -> refundable)
```

| Status | Meaning |
|--------|---------|
| `Signed` | Order opened and broadcast to the solver network |
| `Delivered` | Solver has delivered the assets on the destination chain |
| `Settled` | Oracle verified delivery; the user's locked funds released to the solver (terminal) |
| `Expired` | No solver filled before the deadline — the user can claim a refund |

The status response also carries the destination/settlement transaction hashes — surface the
destination tx so the user (and your ops/compliance) can verify delivery on a block explorer.

---

## 6. The interface

A clean 1:1 swap UI has three states. Keep gas, spreads, and solver mechanics off the screen.

1. **Quote** — user picks send token + chain, receive token + chain, and an amount. Call
   `getQuotes` and display the received amount; for a 1:1-enabled integrator it reads back equal
   ("Send 100 USDC → Receive 100 USDC"). Show a single number; no fee field.
2. **In progress** — after approve + open, show a simple status from `/orders/status`
   ("Submitted → Delivered → Settled") with a link to the source transaction.
3. **Done** — show "Delivered" with the destination transaction link and the `orderId` as a
   verifiable receipt. Offer "swap again".

A complete, runnable React / Next.js interface is in
[`references/quickstart.md`](references/quickstart.md) — including the full `open` ABI, the ERC-20
approve/allowance step, and the wagmi `createConfig` + provider wiring the wallet hooks need.

---

## 7. Option 2 — raw REST (any language)

No SDK needed; call `order.li.fi` directly. The Intents API uses **EIP-7930 interoperable
addresses** for `user`/`asset`/`receiver` (chain embedded in the address) — e.g. USDC on Base
(chain id 8453 = `0x2105`, token `0x833589…02913`) encodes as
`0x0001000002210514833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
(`0001`=version, `0000`=EVM, `02`=chain-ref len, `2105`=chain id, `14`=addr len, then the 20-byte
address). Amounts are strings in smallest units.

**Quote** — `POST https://order.li.fi/quote/request` (under your integrator key):

```jsonc
{
  "user": "<eip7930>",
  "intent": {
    "intentType": "oif-swap",
    "swapType": "exact-input",
    "inputs":  [{ "user": "<eip7930>", "asset": "<eip7930 source token>", "amount": "100000000" }],
    "outputs": [{ "receiver": "<eip7930>", "asset": "<eip7930 dest token>", "amount": null }]
  },
  "supportedTypes": ["oif-escrow-v0"]
}
```

Read `quotes[0].preview.outputs[0].amount` (and `quoteId`, `validUntil`). Then build the
`StandardOrder`, ABI-encode it, and call `open(order)` on `InputSettlerEscrow`. The struct:

```
tuple(
  address user, uint256 nonce, uint256 originChainId,
  uint32 expires,        // final deadline; refundable after this
  uint32 fillDeadline,   // solver fill cutoff; must be < expires
  address inputOracle,   // Polymer Oracle (below)
  uint256[2][] inputs,   // [tokenId (input token address as uint256), amount]
  tuple(bytes32 oracle, bytes32 settler, uint256 chainId, bytes32 token,
        uint256 amount, bytes32 recipient, bytes callbackData, bytes context)[] outputs
)
```

`outputs[].settler` is the Output Settler; `recipient`/`token` are bytes32-padded addresses;
`callbackData`/`context` are `0x` for a plain transfer. Track via the same
`GET /orders/status?onChainOrderId=...`.

---

## Contract addresses (same on supported EVM chains)

| Contract | Address |
|----------|---------|
| InputSettlerEscrow | `0x000025c3226C00B2Cdc200005a1600509f4e00C0` |
| Output Settler | `0x0000000000eC36B683C2E6AC89e9A75989C22a2e` |
| Polymer Oracle (mainnet) | `0x0000003E06000007A224AeE90052fA6bb46d43C9` |

Supported chains and live routes are solver-driven and dynamic — query `GET /chains/supported`
and `GET /routes` rather than hardcoding.

---

## Resources

- LI.FI Intents — https://docs.li.fi/lifi-intents/introduction
- Intents quickstart — https://docs.li.fi/lifi-intents/quickstart
- Intents API overview — https://docs.li.fi/lifi-intents/intents-api/api-overview
- Partner Portal (register your integrator) — https://portal.li.fi
- Interactive API spec — https://order.li.fi/docs
