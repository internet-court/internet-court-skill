# GenLayer to ERC-7710 Connector Patterns

Use this reference when selecting how a GenLayer Intelligent Contract decision affects an EVM-side ERC-7710 delegation.

## Pattern A: Demo Relay

Use when the goal is to show the full workflow without claiming production-grade trust minimization.

Flow:

```text
1. GenLayer supervisor stores decision.
2. UI reads decision after finality.
3. Operator clicks "Apply revocation".
4. EVM transaction calls RevocationController.applyGenLayerDecision.
5. Future ERC-7710 redemptions fail.
```

Trust assumption: the operator/UI relays the decision honestly.

## Pattern B: Trusted Watcher

Use for MVPs.

Flow:

```text
1. Watcher subscribes to GenLayer supervisor transactions.
2. Watcher waits for finality.
3. Watcher builds GenLayerDelegationDecision payload.
4. Watcher signs payload and submits EVM transaction.
5. EVM controller verifies allowlisted signer and freshness.
```

Controls:

- allowlisted relayer keys,
- replay-protected nonce,
- event logs for every applied decision,
- delegator emergency revoke,
- absolute permission expiry.

## Pattern B2: GenLayer Studio Bridge

Use for Base Sepolia demos that need a real bidirectional bridge path.

Flow:

```text
1. Base reporter reads permission/accounting state.
2. Reporter calls BridgeSender.sol to send a snapshot to GenLayer.
3. Bridge service relays to BridgeReceiver.py.
4. BridgeReceiver.py dispatches process_bridge_message() on the supervisor IC.
5. Supervisor IC sends an encoded decision through BridgeSender.py.
6. Bridge service relays to Base BridgeReceiver.sol.
7. BridgeReceiver.sol calls a decision receiver's processBridgeMessage().
8. Decision receiver applies the decision to RevocationController.
```

Controls:

- Base decision receiver checks `msg.sender == BridgeReceiver.sol`;
- Base decision receiver checks GenLayer source chain id and supervisor IC address;
- RevocationController allowlists the decision receiver as a relayer;
- snapshot includes `permissionHash`, review window id, evidence hash, and controller nonce;
- ERC-7710 redemption checks revocation, pause, and constraints before execution.

## Pattern C: Optimistic Anyone-Can-Relay

Use when wrong revocation is expensive but a challenge window is acceptable.

Flow:

```text
1. Anyone submits decision payload.
2. Controller starts pending state.
3. Challenge window opens.
4. If unchallenged, decision becomes active.
5. If challenged, Internet Court or owner resolves.
```

Use `pause` during the challenge window only if front-running risk is high.

## Pattern D: Verified Bridge

Use only when a real GenLayer-to-EVM proof or bridge integration is available.

Flow:

```text
1. GenLayer decision is finalized.
2. Bridge emits/verifies message on EVM chain.
3. RevocationController verifies bridge origin and supervisor address.
4. Controller applies revoke/constrain effect.
```

Do not use this pattern in docs or demos unless the bridge details are implemented.

## Minimal Controller State

```solidity
mapping(bytes32 => bool) public revoked;
mapping(bytes32 => bytes32) public constraintsHash;
mapping(bytes32 => bool) public consumedDecision;
mapping(bytes32 => uint256) public nonce;
```

`consumedDecision` should key by decision hash. The controller should be idempotent: replaying an already applied revocation should not corrupt state or reopen authority.

## Tests

- `continue` leaves permission active.
- `warn` emits event but does not block redemption.
- `constrain` updates constraints hash and blocks actions outside the tighter policy.
- `revoke` makes `isRevoked(permissionHash)` true.
- stale `expiresAt` reverts.
- duplicate decision is idempotent.
- wrong supervisor address reverts.
- wrong target permission hash reverts.
- non-allowlisted relayer reverts in trusted-watcher mode.
- missed review triggers pause if the mandate requires pause-on-review-missed.
