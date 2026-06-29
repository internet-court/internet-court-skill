# Provider Hardening

This note captures practical hardening defaults for `RpcProvider` usage in production agents.

## Baseline Configuration

- Use explicit RPC URL per environment (`mainnet`, `sepolia`) and avoid implicit defaults.
- Set request timeout budgets and surface timeout errors distinctly from revert errors.
- Prefer providers with stable SLAs; keep at least one fallback endpoint.

## Retry Strategy

- Retry only transient failures (timeouts, 429, 5xx).
- Use bounded exponential backoff with jitter (for example 300ms, 700ms, 1500ms; max 3 attempts).
- Do not retry deterministic failures (`entrypoint_not_found`, validation failures, calldata errors).

## Health and Observability

- Emit structured logs with `requestId`, `method`, `rpcUrl`, and latency.
- Track error-rate and timeout-rate per endpoint.
- Trigger provider failover when an endpoint exceeds an error threshold in a rolling window.

## Safety Checks

- Verify expected chain ID at startup and before sensitive flows.
- Fail closed on RPC/network mismatches.
- Keep block-tag use explicit (`latest`, pinned block) to avoid silent semantic drift.
