# TypeScript SDK Reference

For complex workflows that go beyond the CLI (e.g., auto-arbitration listeners, custom barter combinations, bundle escrows), use the TypeScript SDK directly.

## Setup

```typescript
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { makeClient } from "@alkahest/ts-sdk";

const walletClient = createWalletClient({
  account: privateKeyToAccount("0xYOUR_PRIVATE_KEY"),
  chain: baseSepolia,
  transport: http("https://your-rpc-url"),
});

const client = makeClient(walletClient);
```

The client auto-detects the chain and loads the correct contract addresses. To use custom addresses, pass them as the second argument to `makeClient`.

## Buyer Workflow: Create Escrow

### 1. Approve tokens (if ERC20/ERC721/ERC1155)

```typescript
await client.erc20.util.approve(
  { address: TOKEN_ADDRESS, value: amount },
  "escrow"
);
```

### 2. Encode your demand

```typescript
const demand = {
  arbiter: client.contractAddresses.trustedOracleArbiter,
  demand: client.arbiters.general.trustedOracle.encodeDemand({
    oracle: ORACLE_ADDRESS,
    data: "0x",
  }),
};
```

### 3. Create the escrow

```typescript
const { hash, attested } = await client.erc20.escrow.nonTierable.doObligation(
  client.erc20.escrow.nonTierable.encodeObligationRaw({
    token: TOKEN_ADDRESS,
    amount: parseEther("1.0"),
    arbiter: demand.arbiter,
    demand: demand.demand,
  }),
);
const escrowUid = attested.uid;
```

### 4. Wait for fulfillment

```typescript
const result = await client.waitForFulfillment(
  client.contractAddresses.erc20EscrowObligation,
  escrowUid,
);
// result contains: { payment, fulfillment, fulfiller }
```

## Seller Workflow: Fulfill Escrow

### Using StringObligation (off-chain validated work)

```typescript
const { hash, attested } = await client.stringObligation.doObligation(
  "Here is my completed deliverable",
  undefined, // schema (optional)
  escrowUid,  // refUID — links to the escrow
);

// If escrow uses TrustedOracleArbiter, request arbitration
await client.arbiters.general.trustedOracle.arbitrate(
  attested.uid,
  true,
);
```

### Using direct payment (token-for-token barter)

```typescript
const { hash } = await client.erc20.barter.buyErc20ForErc20(
  { address: BID_TOKEN, value: bidAmount },
  { address: ASK_TOKEN, value: askAmount },
  BigInt(Math.floor(Date.now() / 1000) + 3600),
);
```

## Oracle Workflow: Arbitrate

### Manual arbitration

```typescript
await client.arbiters.general.trustedOracle.arbitrate(
  fulfillmentAttestation,
  true,
);
```

### Auto-arbitration (listen and decide)

```typescript
const { decisions, unwatch } = await client.arbiters.general.trustedOracle.arbitrateMany({
  mode: "listen",
  pollingInterval: 5000,
  onAfterArbitrate: (uid, decision) => {
    console.log(`Arbitrated ${uid}: ${decision}`);
  },
});
```

## Commit-Reveal Workflow

```typescript
// 1. Compute commitment hash
const commitment = await client.commitReveal.computeCommitment(
  escrowUid, sellerAddress,
  { payload: "0x...", salt: "0x...", schema: "0x..." },
);

// 2. Commit with bond
await client.commitReveal.commit(commitment);

// 3. Wait at least 1 block, then reveal
const { attested } = await client.commitReveal.doObligation(
  { payload: encodedPayload, salt: randomSalt, schema: schemaTag },
  escrowUid,
);

// 4. Reclaim bond
await client.commitReveal.reclaimBond(attested.uid);
```

## Composing Demands

```typescript
// AllArbiter (AND)
const demand = client.arbiters.logical.all.encodeDemand({
  arbiters: [ARBITER_1, ARBITER_2],
  demands: [DEMAND_1, DEMAND_2],
});

// AnyArbiter (OR)
const demand = client.arbiters.logical.any.encodeDemand({
  arbiters: [ARBITER_1, ARBITER_2],
  demands: [DEMAND_1, DEMAND_2],
});

// Nesting: (conditionA AND conditionB) OR conditionC
const innerDemand = client.arbiters.logical.all.encodeDemand({
  arbiters: [ARBITER_A, ARBITER_B],
  demands: [DEMAND_A, DEMAND_B],
});
const outerDemand = client.arbiters.logical.any.encodeDemand({
  arbiters: [client.contractAddresses.allArbiter, ARBITER_C],
  demands: [innerDemand, DEMAND_C],
});
```

## Confirmation Arbiters

```typescript
await client.arbiters.confirmation.exclusiveRevocable.confirm(escrowUid, fulfillmentUid);
await client.arbiters.confirmation.exclusiveRevocable.revokeConfirmation(escrowUid, fulfillmentUid);
const confirmed = await client.arbiters.confirmation.exclusiveRevocable.isConfirmed(escrowUid, fulfillmentUid);
```

Variants: `exclusiveRevocable`, `exclusiveUnrevocable`, `nonexclusiveRevocable`, `nonexclusiveUnrevocable`.

## Decoding Attestations

```typescript
const attestation = await client.getAttestation(uid);
const data = client.extractObligationData(erc20EscrowObligationAbi, attestation);
const demandData = client.extractDemandData(trustedOracleArbiterDemandAbi, escrowAttestation);
const decoded = client.decodeDemand({ arbiter: arbiterAddress, demand: demandBytes });
```
