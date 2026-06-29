# Account Lifecycle

Use this as a runbook for account creation, usage, and rotation in starknet.js-based agents.

## Lifecycle Stages

1. Provision
Generate signing key material and assign account address.
2. Bootstrap
Fund account and verify deploy state.
3. Active Operations
Execute transactions under explicit policy and monitor nonce/fees.
4. Rotation
Rotate key material or signer backend with overlap window and rollback path.
5. Decommission
Revoke credentials and archive audit artifacts.

## Signing and Sponsorship Boundaries

- Keep signer credentials separate from app credentials.
- For sponsored flows, preflight policy checks before submitting execute calls.
- Enforce max-spend and allowlist constraints at signer or account-policy layer.

## Nonce Management

- Always query current nonce before constructing concurrent transaction batches.
- Use per-workflow request IDs to correlate nonce conflicts and retries.
- On nonce mismatch, refresh state and rebuild calldata instead of blind replay.

## Incident Response

- Suspected key leak: rotate signer immediately and revoke active sessions.
- Persistent reverts: pause automated execution and require manual review.
- RPC consistency failures: switch provider and re-validate chain context.
