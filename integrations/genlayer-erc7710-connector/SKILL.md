---
name: genlayer-erc7710-connector
description: Connect GenLayer Intelligent Contract decisions to ERC-7710-style delegated authority. Use when an agent needs to design the interface, message schema, relayer/bridge path, EVM revocation controller, constraint updates, proof/finality assumptions, and failure handling that turn a GenLayer agent-performance review into ERC-7710 revocation or policy changes.
---

# GenLayer ERC-7710 Connector

Use this skill after the mandate, ERC-7710 policy, and GenLayer Intelligent Contract review flow exist. This skill does not teach GenLayer contract deployment. For GenLayer build, deploy, test, and CLI operations, use the official GenLayer skills at `https://skills.genlayer.com/` or the GenLayer documentation.

This skill specifies the connector:

```text
GenLayer Intelligent Contract decision
  -> decision proof / receipt / finalized result
  -> relayer or bridge
  -> EVM RevocationController
  -> ERC-7710 Delegation Manager rejects or constrains future redemptions
```

## Design Rule

Never say "GenLayer cancels ERC-7710" without defining the effect path. GenLayer produces a decision. An EVM-side controller, account module, caveat enforcer, or delegation manager integration must consume that decision.

## Workflow

1. Identify the permission:
   - `mandateId`, `permissionHash`, delegator, delegate, delegation manager, target EVM chain, and current policy.
2. Identify the GenLayer decision source:
   - supervisor contract address, method that stores/returns the decision, review window, decision enum, score, issued timestamp, and finalized transaction id.
3. Choose the connector mode:
   - Manual demo relay, trusted relayer, GenLayer Studio bridge relay, optimistic relay with challenge window, light-client/bridge verification, or direct EVM call if supported by the target GenLayer/EVM integration.
4. Define the message:
   - Include enough data for the EVM controller to revoke or constrain exactly one mandate/permission.
5. Define the EVM effect:
   - Revoke, constrain, pause, require human approval, or mark pending appeal.
6. Define safety:
   - Finality assumptions, replay protection, nonce, deadline, idempotency, emergency owner revoke, and absolute permission expiry.
7. Define tests:
   - Continue does nothing, revoke blocks future redemption, constrain tightens policy, stale decisions fail, duplicate messages are idempotent, forged decisions fail.

## Connector Modes

Use the simplest mode that honestly matches the demo.

### Manual Demo Relay

Best for hackathon/prototype demos. The UI or operator reads the GenLayer decision and calls the EVM revocation controller.

State the trust assumption: the operator is trusted to relay the decision correctly.

### Trusted Relayer

Best for a realistic MVP. A service watches GenLayer review transactions, waits for finality, then submits a signed EVM transaction.

Require allowlisted relayer keys and onchain event logs. Keep the delegator emergency revoke path.

### GenLayer Studio Bridge Boilerplate

Use this for Base Sepolia demos that should exercise a real cross-chain control loop without claiming mainnet-grade verification.

Flow:

```text
1. Base reporter contract packages a spend or action snapshot.
2. Base BridgeSender.sol sends it to GenLayer through the bridge boilerplate.
3. BridgeReceiver.py dispatches process_bridge_message() on the supervisor IC.
4. Supervisor IC reviews the window and calls BridgeSender.py.
5. Base BridgeReceiver.sol dispatches processBridgeMessage() on an EVM decision receiver.
6. Decision receiver verifies bridge receiver, source chain id, and source IC.
7. Decision receiver calls RevocationController.applyGenLayerDecisionStruct().
```

Default Base Sepolia values from the bridge boilerplate:

- Base Sepolia chain id: `84532`.
- Base Sepolia LayerZero endpoint id: `40245`.
- GenLayer source chain id emitted by `BridgeSender.py`: `61998`.

Required EVM contracts:

- a reporter such as `WalletSpendReporter` that sends snapshots to GenLayer;
- a decision receiver such as `GenLayerDecisionReceiver` that is allowlisted as a relayer on `RevocationController`;
- a redemption path that checks `RevocationController.isRevoked`, `isPaused`, and `getConstraints` before spending.

Trust assumption: the bridge service and configured bridge contracts are trusted for the demo unless a verified proof path is added. Keep owner emergency revoke and absolute expiry.

### Optimistic Relay

Best when anyone can submit a decision, but the decision can be challenged during a delay.

Use for higher-stakes demos where incorrect revocation is costly and latency is acceptable.

### Verified Bridge

Best for production claims. The EVM controller verifies a GenLayer-origin proof or a trusted bridge message.

Do not choose this mode unless the proof/bridge implementation is actually available.

## Message Schema

Use this as the default connector payload:

```ts
type GenLayerDelegationDecision = {
  mandateId: string;
  permissionHash: `0x${string}`;
  genlayerChainId: string;
  genlayerSupervisor: string;
  genlayerTxId: string;
  reviewWindowId: string;
  decision: "continue" | "warn" | "constrain" | "revoke" | "escalate";
  score: number;
  violationsHash: `0x${string}`;
  evidenceBundleHash: `0x${string}`;
  constraintsHash: `0x${string}`;
  issuedAt: number;
  expiresAt: number;
  nonce: bigint;
};
```

For EVM submission, hash and sign or verify the exact payload:

```ts
type RelayEnvelope = {
  payload: GenLayerDelegationDecision;
  payloadHash: `0x${string}`;
  relayer: `0x${string}`;
  signature?: `0x${string}`;
  proof?: string;
};
```

## EVM Revocation Controller

The EVM controller should expose a small surface:

```solidity
interface IAgentRevocationController {
    event DelegationRevoked(bytes32 indexed mandateId, bytes32 indexed permissionHash, bytes32 decisionHash);
    event DelegationConstrained(bytes32 indexed mandateId, bytes32 indexed permissionHash, bytes32 decisionHash);

    function isRevoked(bytes32 permissionHash) external view returns (bool);
    function getConstraints(bytes32 permissionHash) external view returns (bytes32 constraintsHash);
    function applyGenLayerDecision(bytes calldata decision, bytes calldata proofOrSignature) external;
    function emergencyRevoke(bytes32 permissionHash) external;
}
```

The ERC-7710 redemption path must check this controller before execution. Depending on the delegation framework, that check can live in:

- the Delegation Manager,
- a caveat enforcer,
- a smart-account module,
- or a pre-redemption policy validator controlled by the account.

## Decision Effects

- `continue`: record reviewed window; no policy change.
- `warn`: record warning; optionally require extra evidence next review.
- `constrain`: update constraints hash, such as lower gas cap, fewer txs, disabled actions, or human approval for deployments.
- `revoke`: mark `permissionHash` revoked; all future redemptions fail.
- `escalate`: pause high-risk actions or require human review.

## Periodic Review Demo Cadence

For demos, a one-minute review cadence is acceptable so users can see GenLayer decisions modify or revoke a delegation quickly. For production-style mandates, default to a twenty-four-hour review window or a risk-based cadence. The artifact should include both the demo cadence and the production-style cadence so the trust and latency assumptions are visible.

Periodic review does not replace absolute permission expiry. Keep short spend periods, low caps, emergency owner revoke, and stale-decision checks.

## Failure Cases

Always handle:

- GenLayer decision is not final.
- Relayer submits wrong mandate or permission hash.
- Duplicate relay.
- Stale decision after `expiresAt`.
- Lower score with `continue` decision ambiguity.
- `constrain` cannot be represented by the current policy.
- Revocation controller accepts a forged payload.
- Agent front-runs actions before revocation transaction lands.
- Relayer outage leaves unsafe permission active.

Mitigations: short absolute expiry, emergency revoke, tx/rate limits, pause-on-review-missed, idempotency, and explicit finality delays.

## Output Checklist

When designing the connector, return:

1. Connector mode and trust assumptions.
2. GenLayer decision source contract/method.
3. `GenLayerDelegationDecision` payload.
4. Relay/proof/finality path.
5. EVM revocation controller interface.
6. Where ERC-7710 redemption checks the controller.
7. Decision-to-effect mapping.
8. Failure cases and tests.

## References

- `references/connector-patterns.md` for mode selection and test cases.
