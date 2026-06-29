# Fee Strategy

This reference covers practical fee planning for agent execution on Starknet.

## Preflight Principles

- Estimate before execute; do not submit calls with unknown fee envelope.
- Keep token/fee-mode explicit (`user_pays` vs sponsored).
- Reject transactions when estimated fee breaches configured budget thresholds.

## User Pays Mode

- Maintain gas token buffer for operational continuity.
- Set per-transaction max fee with a safety margin over estimate.
- If estimate fails repeatedly, pause and retry with alternate RPC provider.

## Sponsored Mode

- Require sponsor approval in preflight response.
- Enforce policy alignment between call payload and sponsor scope.
- Treat sponsorship denial as non-retryable unless policy changed.

## Slippage and Cost Drift

- Re-estimate after significant state delays or price-sensitive operations.
- Use bounded validity windows to reduce stale-fee submissions.
- Capture estimate vs final paid fee deltas for monitoring.

## Operational Alerts

- Alert on repeated `INSUFFICIENT_FEE`, `SPONSOR_DENIED`, or estimate timeouts.
- Alert when effective fee exceeds configured percentile envelope for the flow.
