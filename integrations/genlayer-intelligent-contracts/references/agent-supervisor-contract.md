# Agent Supervisor Intelligent Contract

Use this pattern for a GenLayer Intelligent Contract that reviews whether an agent should keep delegated authority.

## Contract Responsibilities

- Store the mandate id, objective, authority summary, rubric, review cadence, and current status.
- Accept structured review submissions containing action receipts and output artifacts.
- Judge whether the agent's actions were useful, safe, in scope, and well evidenced.
- Emit or store a decision that downstream systems can consume.
- Keep a history of warnings and revocation decisions.

## Status Model

```ts
type AgentMandateStatus =
  | "active"
  | "warned"
  | "constrained"
  | "revoked"
  | "escalated";
```

## Decision Semantics

- `continue`: keep the current delegation active.
- `warn`: keep delegation active, but record warning for future reviews.
- `constrain`: require stricter limits, such as fewer transactions or human approval for deployments.
- `revoke`: disable the permission through the target-chain revocation path.
- `escalate`: send to human or Internet Court process when evidence is insufficient or stakes are too high.

## Evidence Bundle

```ts
type EvidenceBundle = {
  mandateId: string;
  reviewWindowId: string;
  receiptsUri: string;
  artifactsUri: string;
  receiptHashes: `0x${string}`[];
  submittedBy: `0x${string}`;
  submittedAt: string;
};
```

Prefer content-addressed evidence for receipts and artifacts. Keep large logs outside contract state, but include hashes or URIs that make the review reproducible.

## Revocation Timing

Long-lived delegations need both active and passive safety:

- Active: a controller can revoke by mandate id or permission hash after a GenLayer decision.
- Passive: absolute expiry limits damage if the revocation path fails.
- Emergency: the delegator can revoke directly without waiting for the supervisor.

## Appeal Path

For demos, keep appeals simple:

1. Agent can submit missing evidence once.
2. GenLayer reruns review against the updated bundle.
3. If the second decision is `revoke`, Internet Court marks it final unless the human delegator overrides.
