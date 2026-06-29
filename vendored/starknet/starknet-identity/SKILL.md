---
name: starknet-identity
description: Register AI agents on-chain using the ERC-8004 Trustless Agents standard. Manage agent identity as NFTs, build reputation through feedback, and request third-party validation.
license: Apache-2.0
metadata: {"author":"starknet-agentic","version":"1.0.0","org":"keep-starknet-strange"}
keywords: [starknet, identity, erc-8004, agent-registry, reputation, validation, nft, trustless, on-chain-identity, agent-registration]
allowed-tools: [Bash, Read, Write, Glob, Grep, Task]
user-invocable: true
---

# Starknet Identity Skill

Register and manage AI agent identities on Starknet using the ERC-8004 standard.

## When to Use

- Registering agents on-chain, updating agent metadata, or managing reputation and validation flows.
- Building features that depend on ERC-8004 identity, feedback, or validator attestations.

## When NOT to Use

- Simple wallet, payment, or DeFi flows that do not depend on ERC-8004 registries.
- Cairo contract authoring, deployment-only tasks, or security auditing.

## Quick Start

1. Install `starknet` and connect a funded account to the target ERC-8004 registry deployment.
2. Use [skills catalog](../README.md) if the flow also needs wallet setup, deployment, or contract auditing.

## Overview

ERC-8004 defines three interconnected on-chain registries for AI agents:

1. **Identity Registry** -- Agents as ERC-721 NFTs with metadata
2. **Reputation Registry** -- Feedback system with cryptographic authorization
3. **Validation Registry** -- Third-party assessments (zkML, TEE, staker)

Reference implementation: [erc8004-cairo](https://github.com/Akashneelesh/erc8004-cairo)

## Prerequisites

```bash
npm install starknet
```

## Agent Registration

### Register a New Agent

```typescript
import { Account, RpcProvider, Contract, CallData } from "starknet";

const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
const account = new Account({ provider, address, signer: privateKey });

const identityRegistry = new Contract({
  abi: identityRegistryAbi,
  address: registryAddress,
  providerOrAccount: account,
});

// Register with metadata
const metadata = [
  { key: "agentName", value: "MyTradingAgent" },
  { key: "agentType", value: "defi-trader" },
  { key: "version", value: "1.0.0" },
  { key: "model", value: "claude-opus-4-5" },
  { key: "status", value: "active" },
];

const tokenUri = "ipfs://QmYourAgentSpecHash"; // IPFS link to full agent spec

const { transaction_hash } = await account.execute({
  contractAddress: registryAddress,
  entrypoint: "register_with_metadata",
  calldata: CallData.compile({
    token_uri: tokenUri,
    metadata: metadata,
  }),
});

const receipt = await account.waitForTransaction(transaction_hash);
// Parse agent_id from events
```

### Query Agent Information

```typescript
// Check if agent exists
const exists = await identityRegistry.agent_exists(agentId);

// Get total registered agents
const totalAgents = await identityRegistry.total_agents();

// Get agent metadata
const name = await identityRegistry.get_metadata(agentId, "agentName");
const agentType = await identityRegistry.get_metadata(agentId, "agentType");

// Get agent owner (ERC-721)
const owner = await identityRegistry.owner_of(agentId);
```

### Update Agent Metadata

```typescript
// Only the agent owner can update metadata
await account.execute({
  contractAddress: registryAddress,
  entrypoint: "set_metadata",
  calldata: CallData.compile({
    agent_id: agentId,
    key: "status",
    value: "upgraded",
  }),
});
```

## Reputation System

### Authorize and Submit Feedback

The reputation system uses a cryptographic authorization flow:

1. **Agent owner** creates a FeedbackAuth struct and signs it
2. **Client** submits feedback with the authorization

```typescript
// Step 1: Agent owner creates authorization
const feedbackAuth = {
  agent_id: agentId,
  client_address: clientAddress,
  index_limit: 10, // Max feedback entries allowed
  expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  chain_id: chainId,
  identity_registry: registryAddress,
  signer_address: ownerAddress,
};

// Sign the authorization (using agent owner's account)
const messageHash = computePoseidonHash(feedbackAuth); // EIP-712 style
const signature = await ownerAccount.signMessage(messageHash);

// Step 2: Client submits feedback
await clientAccount.execute({
  contractAddress: reputationRegistryAddress,
  entrypoint: "give_feedback",
  calldata: CallData.compile({
    agent_id: agentId,
    score: 85, // 0-100
    tag1: encodedTag("reliability"),
    tag2: encodedTag("speed"),
    fileuri: "",
    filehash: 0,
    feedback_auth: feedbackAuth,
    signature: signature,
  }),
});
```

### Query Reputation

```typescript
const reputationRegistry = new Contract({
  abi: reputationAbi,
  address: reputationAddress,
  providerOrAccount: provider,
});

// Get summary for an agent (count + average score)
const [count, avgScore] = await reputationRegistry.get_summary(
  agentId,
  [], // all client addresses (or filter specific ones)
  0,  // tag1 filter (0 = all)
  0,  // tag2 filter (0 = all)
);

// Read specific feedback
const [score, tag1, tag2, isRevoked] = await reputationRegistry.read_feedback(
  agentId,
  clientAddress,
  feedbackIndex,
);

// Get all clients who gave feedback
const clients = await reputationRegistry.get_clients(agentId);
```

## Validation System

### Request Validation

```typescript
const validationRegistry = new Contract({
  abi: validationAbi,
  address: validationAddress,
  providerOrAccount: account,
});

// Agent owner requests validation from a specific validator
await account.execute({
  contractAddress: validationAddress,
  entrypoint: "validation_request",
  calldata: CallData.compile({
    validator_address: validatorAddress,
    agent_id: agentId,
    request_uri: "ipfs://QmValidationRequestDetails",
    request_hash: 0, // Auto-generated if 0
  }),
});
```

### Submit Validation Response

```typescript
// Validator responds to the request
await validatorAccount.execute({
  contractAddress: validationAddress,
  entrypoint: "validation_response",
  calldata: CallData.compile({
    request_hash: requestHash,
    response: 92, // Score 0-100
    response_uri: "ipfs://QmValidationReport",
    response_hash: reportHash,
    tag: encodedTag("performance"),
  }),
});
```

### Query Validation Status

```typescript
// Get validation summary
const [validationCount, avgValidationScore] = await validationRegistry.get_summary(
  agentId,
  [], // all validators
  0,  // tag filter
);

// Get specific validation
const [validator, agentId_, response, tag, lastUpdate] =
  await validationRegistry.get_validation_status(requestHash);
```

## A2A Agent Card Integration

Combine on-chain identity with A2A Agent Cards for discoverability:

```json
{
  "name": "MyTradingAgent",
  "description": "Autonomous DeFi trading agent on Starknet",
  "url": "https://my-agent.example.com",
  "provider": {
    "organization": "MyOrg"
  },
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "starknet-swap",
      "name": "Token Swap",
      "description": "Execute token swaps on Starknet via avnu"
    }
  ],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain"],
  "authentication": {
    "schemes": ["bearer"]
  },
  "starknetIdentity": {
    "registryAddress": "0x...",
    "agentId": 42,
    "reputationScore": 85,
    "validationCount": 3
  }
}
```

Serve at `/.well-known/agent.json` for A2A discovery.

## Metadata Schema (Recommended)

| Key | Description | Example |
|-----|-------------|---------|
| `agentName` | Display name | `"MyTradingAgent"` |
| `agentType` | Category | `"defi-trader"`, `"nft-curator"`, `"data-analyst"` |
| `version` | Semantic version | `"1.0.0"` |
| `model` | LLM model used | `"claude-opus-4-5"`, `"gpt-4o"` |
| `status` | Current status | `"active"`, `"paused"`, `"deprecated"` |
| `framework` | Agent framework | `"daydreams"`, `"openclaw"`, `"langchain"` |
| `capabilities` | Comma-separated | `"swap,stake,lend"` |
| `a2aEndpoint` | Agent Card URL | `"https://agent.example.com"` |
| `moltbookId` | MoltBook agent ID | `"agent_abc123"` |

## Security Considerations

- Only the agent owner can update metadata and authorize feedback
- Feedback requires cryptographic authorization (prevents spam)
- Self-feedback is prevented (agent owner cannot give feedback to own agent)
- Self-validation is prevented (agent owner cannot validate own agent)
- Signatures include chain ID and expiry to prevent replay attacks
- Agent identity (NFT) is transferable -- new owner inherits reputation

## Error Codes

| Code | Meaning | Likely causes | Recovery | User-facing message |
|-----|---------|---------------|----------|---------------------|
| `REGISTRATION_FAILED` | Initial ERC-8004 registration or metadata write reverted. | Missing fees, duplicate registration, invalid calldata, or stale contract state. | Retry after checking wallet balance, contract state, and constructor/registration inputs. | "Registration failed. Check wallet state and retry." |
| `AUTHORIZATION_DENIED` | Ownership or feedback authorization proof was rejected. | Wrong signer, bad nonce, missing permission, or outdated owner state. | Re-fetch owner/nonce state, verify permissions, and re-sign with the current account. | "Authorization denied. Verify signer permissions and retry." |
| `VALIDATION_TIMEOUT` | Off-chain validation or watcher flow did not complete before the deadline. | Slow relayer, RPC degradation, or downstream A2A service lag. | Retry with a longer timeout after checking chain health, relayer status, and RPC latency. | "Validation timed out. Retry after checking network health." |
| `SIGNATURE_EXPIRED` | Signed payload expired before submission. | Expiry window too short or user approval arrived too late. | Generate a fresh signature with a new expiry and resubmit immediately. | "Signature expired. Re-sign and submit again." |
| `OWNER_TRANSFERRED` | Agent NFT ownership changed while a write or feedback flow was in flight. | NFT transfer, marketplace sale, or custodial wallet rotation. | Refresh ownership state, re-authorize with the new owner, and explain that reputation follows the NFT. | "Ownership changed. Refresh owner state and retry with the new owner." |

## References

- [ERC-8004 EIP](https://eips.ethereum.org/EIPS/eip-8004)
- [ERC-8004 Cairo Implementation](https://github.com/Akashneelesh/erc8004-cairo)
- [A2A Protocol](https://a2a-protocol.org/latest/)
- [Starknet Account Abstraction](https://www.starknet.io/blog/native-account-abstraction/)
