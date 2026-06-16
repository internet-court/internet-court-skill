# Alkahest Arbiter Reference

Arbiters are contracts that validate whether a fulfillment satisfies an escrow's demand. Every arbiter implements:

```solidity
function checkObligation(
    Attestation memory obligation,
    bytes memory demand,
    bytes32 fulfilling
) external view returns (bool)
```

## General Arbiters

### TrivialArbiter

Always returns true. Use when no validation is needed (e.g., anyone can claim).

**Demand data:** none (empty bytes `0x`)

```typescript
const demand = {
  arbiter: client.contractAddresses.trivialArbiter,
  demand: "0x",
};
```

### IntrinsicsArbiter

Validates attestation is not expired and not revoked.

**Demand data:** none (empty bytes `0x`)

```typescript
const demand = {
  arbiter: client.contractAddresses.intrinsicsArbiter,
  demand: "0x",
};
```

### IntrinsicsArbiter2

Validates intrinsics (not expired, not revoked) AND that the fulfillment's schema matches.

**Demand data:** `{ schema: bytes32 }`

```typescript
const demand = {
  arbiter: client.contractAddresses.intrinsicsArbiter2,
  demand: client.arbiters.general.intrinsics2.encodeDemand({
    schema: "0x...", // required schema UID
  }),
};
```

### TrustedOracleArbiter

Asynchronous arbitration — an oracle submits a decision on-chain.

**Demand data:** `{ oracle: address, data: bytes }`

```typescript
// Encode demand
const demand = {
  arbiter: client.contractAddresses.trustedOracleArbiter,
  demand: client.arbiters.general.trustedOracle.encodeDemand({
    oracle: "0xOracleAddress",
    data: "0x", // optional extra data for the oracle
  }),
};

// Decode demand
const decoded = client.arbiters.general.trustedOracle.decodeDemand(demandBytes);
// => { oracle: "0x...", data: "0x..." }

// Oracle submits decision
await client.arbiters.general.trustedOracle.arbitrate(
  fulfillmentAttestation, // attestation UID
  true,                    // decision
);

// Auto-arbitrate (listen for requests)
await client.arbiters.general.trustedOracle.arbitrateMany({
  mode: "listen",
  pollingInterval: 5000,
  onAfterArbitrate: (uid, decision) => console.log(uid, decision),
});
```

### ERC8004Arbiter

Validates against an ERC-8004 ValidationRegistry.

**Demand data:** `{ validationRegistry: address, validatorAddress: address, minResponse: uint8 }`

## Attestation Property Arbiters

These arbiters validate individual properties of EAS attestations.

| Arbiter | Demand data | Validates |
|---------|------------|-----------|
| `AttesterArbiter` | `{ attester: address }` | `attestation.attester == attester` |
| `RecipientArbiter` | `{ recipient: address }` | `attestation.recipient == recipient` |
| `SchemaArbiter` | `{ schema: bytes32 }` | `attestation.schema == schema` |
| `UidArbiter` | `{ uid: bytes32 }` | `attestation.uid == uid` |
| `RefUidArbiter` | `{ refUID: bytes32 }` | `attestation.refUID == refUID` |
| `RevocableArbiter` | `{ revocable: bool }` | `attestation.revocable == revocable` |
| `TimeAfterArbiter` | `{ time: uint64 }` | `attestation.time >= time` |
| `TimeBeforeArbiter` | `{ time: uint64 }` | `attestation.time <= time` (0 = no constraint) |
| `TimeEqualArbiter` | `{ time: uint64 }` | `attestation.time == time` |
| `ExpirationTimeAfterArbiter` | `{ expirationTime: uint64 }` | `attestation.expirationTime >= expirationTime` |
| `ExpirationTimeBeforeArbiter` | `{ expirationTime: uint64 }` | `attestation.expirationTime <= expirationTime` |
| `ExpirationTimeEqualArbiter` | `{ expirationTime: uint64 }` | `attestation.expirationTime == expirationTime` |

### Encoding attestation property demands (TS SDK)

Each property arbiter has an `encodeDemand`/`decodeDemand` pair under `client.arbiters.attestationProperties`:

```typescript
// Encode
const demand = client.arbiters.attestationProperties.attester.encodeDemand({
  attester: "0xRequiredAttester",
});

// Decode
const decoded = client.arbiters.attestationProperties.attester.decodeDemand(demandBytes);
// => { attester: "0x..." }

// Available: attester, recipient, schema, uid, refUid, revocable,
//            timeAfter, timeBefore, timeEqual,
//            expirationTimeAfter, expirationTimeBefore, expirationTimeEqual
```

## Logical Arbiters

### AllArbiter (AND)

All sub-arbiters must return true.

**Demand data:** `{ arbiters: address[], demands: bytes[] }`

```typescript
// Encode
const demand = client.arbiters.logical.all.encodeDemand({
  arbiters: [ARBITER_A, ARBITER_B],
  demands: [DEMAND_A, DEMAND_B],
});

// Decode
const decoded = client.arbiters.logical.all.decodeDemand(demandBytes);
// => { arbiters: [...], demands: [...] }

// Recursive decode (resolves nested arbiters)
const tree = client.arbiters.logical.all.decodeDemandRecursive(demandBytes, {
  [ARBITER_A]: (bytes) => ({ type: "attester", ...decodeAttesterDemand(bytes) }),
  // ... decoders for each arbiter address
});
```

### AnyArbiter (OR)

At least one sub-arbiter must return true. Continues on errors (a reverting sub-arbiter counts as false).

**Demand data:** `{ arbiters: address[], demands: bytes[] }` (same as AllArbiter)

```typescript
const demand = client.arbiters.logical.any.encodeDemand({
  arbiters: [ARBITER_A, ARBITER_B],
  demands: [DEMAND_A, DEMAND_B],
});
```

### Nesting example

```typescript
// (attester is Alice AND time > deadline) OR (oracle approves)
const innerDemand = client.arbiters.logical.all.encodeDemand({
  arbiters: [
    client.contractAddresses.attesterArbiter,
    client.contractAddresses.timeAfterArbiter,
  ],
  demands: [
    client.arbiters.attestationProperties.attester.encodeDemand({
      attester: ALICE,
    }),
    client.arbiters.attestationProperties.timeAfter.encodeDemand({
      time: BigInt(deadline),
    }),
  ],
});

const outerDemand = client.arbiters.logical.any.encodeDemand({
  arbiters: [
    client.contractAddresses.allArbiter,
    client.contractAddresses.trustedOracleArbiter,
  ],
  demands: [
    innerDemand,
    client.arbiters.general.trustedOracle.encodeDemand({
      oracle: ORACLE,
      data: "0x",
    }),
  ],
});
```

## Confirmation Arbiters

Confirmation arbiters require the escrow creator (buyer) to manually confirm fulfillment.

| Variant | Multiple fulfillments? | Can revoke? |
|---------|----------------------|-------------|
| `ExclusiveRevocable` | No (one only) | Yes |
| `ExclusiveUnrevocable` | No (one only) | No |
| `NonexclusiveRevocable` | Yes (many) | Yes |
| `NonexclusiveUnrevocable` | Yes (many) | No |

**Demand data:** none (confirmation state is stored in the arbiter contract)

```typescript
// Use as demand (no demand data needed)
const demand = {
  arbiter: client.contractAddresses.exclusiveRevocableConfirmationArbiter,
  demand: "0x",
};

// Buyer confirms fulfillment
await client.arbiters.confirmation.exclusiveRevocable.confirm(escrowUid, fulfillmentUid);

// Buyer revokes (revocable variants only)
await client.arbiters.confirmation.exclusiveRevocable.revokeConfirmation(escrowUid, fulfillmentUid);

// Check status
const isConfirmed = await client.arbiters.confirmation.exclusiveRevocable.isConfirmed(
  escrowUid,
  fulfillmentUid,
);
```

## CommitRevealObligation as Arbiter

`CommitRevealObligation` implements `IArbiter` — it verifies that the fulfiller committed to their data in an earlier block.

**Demand data:** none (empty bytes `0x`)

Use with `AllArbiter` to combine commit-reveal protection with other conditions:

```typescript
const demand = client.arbiters.logical.all.encodeDemand({
  arbiters: [
    client.contractAddresses.commitRevealObligation, // verifies commitment
    client.contractAddresses.trustedOracleArbiter,    // verifies quality
  ],
  demands: [
    "0x",
    client.arbiters.general.trustedOracle.encodeDemand({
      oracle: ORACLE,
      data: "0x",
    }),
  ],
});
```

## Payment Obligations as Arbiters

`ERC20PaymentObligation`, `ERC721PaymentObligation`, etc. also implement `IArbiter`. They validate that the fulfillment attestation was created by the corresponding payment contract with matching token/amount/payee data.

This is how barter (token-for-token) works: the escrow's arbiter is the payment obligation contract, and the demand encodes what payment is expected.

```typescript
// Escrow ERC20, demand ERC721 payment as fulfillment
const demand = {
  arbiter: client.contractAddresses.erc721PaymentObligation,
  demand: client.erc721.payment.encodeObligation(
    { address: NFT_ADDRESS, id: tokenId },
    escrowCreator, // payee must be the escrow creator
  ),
};
```
