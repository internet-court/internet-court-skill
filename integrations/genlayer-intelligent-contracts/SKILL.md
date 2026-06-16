---
name: genlayer-intelligent-contracts
description: Internet Court adapter for GenLayer Intelligent Contract supervision. Use to specify agent-performance rubrics, evidence schemas, decision outputs, and ERC-7710 connector expectations, while delegating actual GenLayer contract writing, linting, testing, deployment, and CLI interaction to the official GenLayer skills at https://skills.genlayer.com/.
---

# GenLayer Intelligent Contracts

Use this adapter when GenLayer is the judgment layer for agent behavior. It should define what the supervisor contract must review and emit: the user's mandate, the agent's action log, transaction receipts, rationales, artifacts, outputs, and the decision about whether authority should continue, be warned, be constrained, or be revoked.

This skill is not the Intelligent Oracle skill. Intelligent Oracle is for binary public web evidence markets. Use this skill for open-ended review of performance, relevance, quality, safety, and mandate compliance.

This skill is also not the GenLayer deployment skill. For writing, deploying, testing, and interacting with GenLayer Intelligent Contracts, use the official GenLayer skills at `https://skills.genlayer.com/` or the GenLayer docs. If those skills are available in the environment, load them for implementation. If not, tell the user to install/enable them and keep this skill focused on Internet Court interfaces.

## Core Model

```text
Mandate + rubric + evidence
  -> Agent executes transactions
  -> Receipts and outputs are submitted
  -> GenLayer Intelligent Contract reviews behavior
  -> Decision: continue, warn, constrain, revoke, or escalate
  -> Internet Court / revocation controller executes the workflow result
```

GenLayer can judge qualitative criteria. It does not automatically revoke an EVM delegation unless the system includes a concrete cross-chain message, relayer, controller, or account module that consumes the GenLayer decision.

## Workflow

1. Extract the review target:
   - Objective, allowed authority, prohibited behavior, expected outputs, review cadence, evidence sources, and revocation triggers.
2. Draft a rubric:
   - Include relevance, mandate compliance, transaction safety, budget discipline, artifact quality, evidence completeness, and user-value criteria.
3. Define evidence schema:
   - Use structured action receipts, transaction hashes, deployed addresses, agent rationales, output artifacts, costs, and prior warnings.
4. Define decisions:
   - `continue`, `warn`, `constrain`, `revoke`, and optionally `escalate`.
5. Define effect path:
   - For ERC-7710, load `../genlayer-erc7710-connector/SKILL.md` to specify how a `revoke` or `constrain` decision reaches the EVM revocation controller or delegation manager.
6. Add auditability:
   - Store the reviewed action ids, score, reasoning summary, decision timestamp, and next review requirements.

## Review Input

Use this as the default review request shape:

```ts
type AgentPerformanceReviewInput = {
  mandateId: string;
  objective: string;
  authoritySummary: string;
  prohibitedActions: string[];
  rubric: string[];
  reviewWindow: {
    startsAt: string;
    endsAt: string;
  };
  actionReceipts: AgentActionReceipt[];
  outputs: Array<{
    artifactId: string;
    uri: string;
    summary: string;
  }>;
  costs: {
    txCount: number;
    nativeGasSpent: string;
    tokenSpent?: string;
  };
  priorDecisions: AgentReviewDecision[];
};
```

For wallet-spend supervision, include an on-chain spend snapshot in each review window:

```ts
type WalletSpendSnapshot = {
  mandateId: string;
  permissionHash: `0x${string}`;
  sourceChainId: 84532;
  spendReporter: `0x${string}`;
  actionType: `0x${string}`;
  policyHash: `0x${string}`;
  resourceHash: `0x${string}`;
  delegator: `0x${string}`;
  delegate: `0x${string}`;
  asset: `0x${string}`;
  payTo: `0x${string}`;
  spent: bigint;
  maxTotalSpend: bigint;
  maxPerRequest: bigint;
  requestCount: bigint;
  validAfter: number;
  validUntil: number;
  controllerNonce: bigint;
  reviewWindowId: `0x${string}`;
  evidenceBundleHash: `0x${string}`;
  observedAt: number;
};
```

On Base Sepolia demos, prefer a reporter contract that reads spend state directly from a permission/accounting manager and sends this snapshot through the GenLayer Studio bridge boilerplate. x402 is one source; contract-call, deployment, compute-credit, or subscription managers can expose the same shape.

## Decision Output

```ts
type AgentReviewDecision = {
  mandateId: string;
  decision: "continue" | "warn" | "constrain" | "revoke" | "escalate";
  score: number;
  reasoning: string;
  violations: string[];
  constraints?: {
    maxTxsPerPeriod?: number;
    maxGasPerTx?: string;
    requireHumanApprovalFor?: string[];
    disabledActions?: string[];
  };
  reviewedActionIds: string[];
  issuedAt: string;
};
```

Use `constrain` when the agent is useful but overreaches. Use `revoke` when the agent violates scope, creates unsafe deployments, repeatedly wastes budget, hides evidence, or produces outputs that do not meaningfully pursue the mandate.

## Rubric Defaults

For delegated on-chain agents, include:

- Mandate relevance: actions are connected to the user's objective.
- Scope compliance: actions stay within allowed chains, contracts, selectors, factories, and action types.
- Safety: no ownership loss, unlimited approvals, suspicious external calls, or avoidable irreversible effects.
- Budget discipline: gas/value/paid-tool spend is proportional to the work.
- Evidence quality: every action has a receipt, rationale, and artifact when applicable.
- Result quality: deployed contracts or outputs are usable and aligned with the requested workflow.
- Transparency: the agent explains why it took each meaningful action.

## Revocation Integration

When the decision can affect ERC-7710 authority, always specify:

```ts
type RevocationEffect = {
  sourceChain: "genlayer";
  targetChain: "base" | "ethereum" | string;
  revocationController: `0x${string}`;
  mandateId: string;
  permissionHash: `0x${string}`;
  requiredDecision: "revoke" | "constrain";
  relayer: string;
  finalityAssumption: string;
  fallback: "owner_emergency_revoke" | "absolute_expiry" | "human_review";
};
```

Do not claim revocation is trustless unless the bridge, relayer, and verification path are defined.

The connector skill owns the exact payload, relay/proof mode, EVM controller interface, and where the ERC-7710 redemption path checks the controller.

## Output Checklist

When designing a GenLayer Intelligent Contract review flow, return:

1. Plain-English review purpose.
2. Review input schema.
3. Rubric.
4. Decision output schema.
5. Revocation/constraining effect path, with connector skill handoff if ERC-7710 is involved.
6. Evidence submission process.
7. Happy path.
8. Failure and appeal paths.
9. Tests for continue, warn, constrain, revoke, missing evidence, and bad relayer behavior.

## References

- `references/agent-supervisor-contract.md` for a reusable supervisor pattern.
