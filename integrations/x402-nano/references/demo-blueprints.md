# x402 + Nano (XNO) Demo Blueprints

## Blueprint A: Pay-per-use Report API on Nano

Goal: an agent pays per request for a protected report endpoint, settled feelessly on Nano mainnet.

Actors:

- Payer: a Nano account holding XNO (open, with a known frontier).
- Buyer agent: holds the payer key material and signs `send` blocks.
- Resource server: serves an x402-protected endpoint and calls a facilitator to verify/settle.
- Facilitator: verifies the exact-scheme payment and submits the block on `settle`.
- Internet Court: receives disputes if a paid response is malformed.

Happy path:

1. Agent requests a protected report.
2. Server returns `402` with `accepts[]` containing `nano:mainnet`.
3. Agent reads `account_info` (frontier, balance, representative) and generates proof of work
   over the frontier — nothing is signed or spent yet.
4. Agent builds and signs a `send` block for exactly the required raw amount to `payTo`.
5. Agent retries with the signed `PaymentPayload` carrying the block.
6. Server calls facilitator `verify`; on success `settle` (node `process` + confirmation).
7. Server releases the report and returns the settlement receipt (block hash).

Failure paths:

- Frontier moved between verify and settle: server returns `frontier_moved`; agent re-reads
  `account_info`, re-signs with the new `previous`/`balance`/`representative`, re-presents.
- Insufficient balance: `account_info` shows the block cannot settle; agent does not send.
- Duplicate settle: facilitator returns `duplicate_settlement`; agent treats the original as paid.
- Paid but malformed report: evidence package goes to dispute.

## Blueprint B: Feeless subscription cadence

A server exposes a paid endpoint to a buyer. Because each Nano `exact` payment is a single
feeless block, the buyer can pay per-call without a fee floor or a sub-cent minimum — the same
budget buys more small calls than it would on a gas-bearing chain.

Flow:

1. Buyer sets a bounded weekly budget (Guarded mode).
2. Agent pays per request; each settles as its own block.
3. If the buyer's account frontier moves for another reason, prior unsettled payloads are
   invalidated and re-signed — do not reuse a stale signed block.

## Blueprint C: Escrowed agent deal on XNO

Goal: two agents settle a deal with XNO as the value rail, with Internet Court as the adjudicator.

Flow:

1. Buyer and seller agree terms; the deal price is named in XNO (raw on the wire).
2. Buyer agent settles the XNO amount to the seller's `payTo` through the facilitator.
3. Settlement receipt (block hash, `network: nano:mainnet`, `payer`) serves as evidence.
4. If the deliverable is disputed, the receipt and the evidence package go to Internet Court.
