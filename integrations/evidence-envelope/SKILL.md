---
name: evidence-envelope
description: >
  Internet Court canonical evidence envelope — the unified schema behind the
  "Adjudicated: signed evidence" trust tier. Use when parties, juries, or
  adjudicators need to submit, authenticate, or validate evidence: delivery
  receipts, timestamped logs, checksums, monitoring archives, chain proofs,
  or signed statements. Replaces free-text 5,000-char testimony slots with a
  machine-verifiable envelope that distinguishes interested-party signatures
  from neutral counter-signatures.
metadata:
  version: 0.1.0
  related:
    - integrations/genlayer-intelligent-contracts/SKILL.md
    - vendored/kleros/kleros-ipfs-upload/SKILL.md
---

# Evidence Envelope — Canonical Schema (v0.1)

> Addresses: "no unified evidence schema behind the Adjudicated: signed
> evidence trust tier" (issue #8). Every submission to an Adjudicated-level
> review MUST use this envelope so a jury can authenticate provenance instead
> of parsing prose.

## 1. Canonical Evidence Envelope

```json
{
  "schema": "internet-court/evidence-envelope/1",
  "envelopeId": "ev_<uuid>",
  "createdAt": "2026-08-01T22:00:00Z",
  "subject": {
    "scopeId": "tx_<id>",          // the transaction / mandate under review
    "actionId": "act_<id>",        // the specific action the evidence concerns
    "claim": "delivered artifact", // the fact this evidence asserts
    "role": "delivery_receipt"     // receipt | timestamp_log | checksum | monitoring_archive | chain_proof | statement
  },
  "payload": {
    "contentHash": "sha256:<64 hex>",       // digest of the raw evidence bytes
    "contentUri": "ipfs://<cid> | https://…", // resolvable content (may be redacted)
    "contentType": "application/pdf | text/plain | application/json"
  },
  "provenance": [
    {
      "type": "chain_proof",                  // chain_proof | timestamp_log | receipt | checksum | monitoring_archive
      "digest": "sha256:<64 hex>",
      "chain": "evm:84532 | solana:… | null", // null for off-chain logs
      "txHash": "0x<64 hex> | null",
      "blockHeight": 1234567,
      "verifyUrl": "https://…/verify/<hash>"
    }
  ],
  "signatures": [
    {
      "role": "interested_party",             // interested_party | neutral_witness | transacting_agent | adjudicator
      "signer": "did:key:… | 0x<address>",
      "counterSignature": false,
      "signedAt": "2026-08-01T22:00:00Z",
      "algorithm": "ed25519 | secp256k1 | eip712",
      "sig": "<base64url>"
    }
  ],
  "integrity": {
    "recursiveHash": "sha256:<64 hex>"       // hash of all fields above, canonical-JSON
  }
}
```

## 2. Signer-Role Semantics

The envelope MUST distinguish who signed and *when they signed relative to the
transaction*. This is the difference between testimony and exhibits.

| Role | Who | Weight | When |
|------|-----|--------|------|
| `interested_party` | one of the transacting agents (has skin in the game) | LOW | anytime |
| `transacting_agent` | the agent whose action is under review | LOW | at action time |
| `neutral_witness` | a non-party that observed the event | HIGH | at transaction time (counter-signature) |
| `adjudicator` | the reviewing authority | FINAL | at verdict time |

Trust tier derivation (machine-readable):

```
no signatures                     -> unverified testimony
interested_party only             -> self-reported (LOW confidence)
+ neutral_witness counter-signature -> witnessed (HIGH confidence)
+ adjudicator signature           -> adjudicated (FINAL)
```

**Rules:**
1. A `neutral_witness` signature MUST have `counterSignature: true` and a
   `signedAt` within the transaction window (else it is demoted to a late
   statement).
2. An `interested_party` signature alone never satisfies an
   "Adjudicated: signed evidence" requirement.
3. Every signature must be over the envelope's `recursiveHash` (sign the
   whole envelope, not a loose payload).

## 3. Validation

```ts
type ValidateResult = {
  ok: boolean;
  errors: string[];
  derivedTrust: "unverified" | "self-reported" | "witnessed" | "adjudicated";
};
```

Validation steps:
1. Schema-validate against `internet-court/evidence-envelope/1`.
2. Verify `payload.contentHash` matches the resolved `contentUri` bytes.
3. Verify each `provenance.digest` (and `txHash` if chain proof).
4. Verify each signature over the canonical-JSON `recursiveHash`.
5. Apply signer-role rules -> derive trust tier.

## 4. Example — witnessed delivery

```json
{
  "schema": "internet-court/evidence-envelope/1",
  "envelopeId": "ev_9f2c1a",
  "createdAt": "2026-08-01T20:00:00Z",
  "subject": {
    "scopeId": "tx_a1",
    "actionId": "act_7",
    "claim": "artifact delivered to buyer",
    "role": "delivery_receipt"
  },
  "payload": {
    "contentHash": "sha256:aaaa…",
    "contentUri": "ipfs://Qm…",
    "contentType": "application/json"
  },
  "provenance": [
    { "type": "receipt", "digest": "sha256:bbbb…", "chain": null, "txHash": null, "verifyUrl": null }
  ],
  "signatures": [
    { "role": "transacting_agent", "signer": "0x1111…", "counterSignature": false, "signedAt": "2026-08-01T20:00:00Z", "algorithm": "eip712", "sig": "sig-a" },
    { "role": "neutral_witness", "signer": "0x2222…", "counterSignature": true, "signedAt": "2026-08-01T20:00:05Z", "algorithm": "eip712", "sig": "sig-b" }
  ],
  "integrity": { "recursiveHash": "sha256:cccc…" }
}
// derivedTrust: "witnessed" (neutral counter-signature present)
```

## 5. Compatibility

- Consumed by `integrations/genlayer-intelligent-contracts/SKILL.md` as the
  `evidenceBundleHash` input (the envelope's `recursiveHash` is the bundle hash).
- `vendored/kleros/kleros-ipfs-upload/SKILL.md` can carry the envelope as an
  IPFS `contentUri`.
- Future: registry contract that records `envelopeId -> recursiveHash` for
  on-chain verification.

## 6. Security Constraints (mandatory)

Cross-audit (TriForge v3 + MiniMax M3) surfaced 5 design gaps. A conformant
envelope MUST satisfy all of the following:

### SC-1 — Role is bound to signer (fixes role spoofing, CRITICAL)

`signatures[].role` is self-asserted text; an attacker could label themselves
`adjudicator` and mint the top trust tier. **Required:**

- The role MUST be included inside the signed payload (part of
  `recursiveHash`), not just adjacent to it.
- The signer's public key MUST be registered in a role registry
  (on-chain or verifiable allowlist) before validation; an unregistered
  signer is demoted to `interested_party` regardless of declared role.
- Validator MUST reject any envelope whose `signatures[].role` conflicts
  with the registry binding.

### SC-2 — Replay resistance (fixes window replay, CRITICAL)

A captured signed envelope could be resubmitted against a different
`scopeId` inside the transaction window. **Required:**

- `integrity.recursiveHash` MUST cover a monotonic `chainEpoch` / nonce
  supplied by the chain or registry (not just `envelopeId`).
- Validators MUST persist consumed `recursiveHash` values and reject
  duplicates (idempotent adjudication).

### SC-3 — contentUri integrity (fixes payload swap, HIGH)

`contentUri` and `contentHash` are decoupled: an attacker could repoint the
URI to different bytes that happen to match the committed hash. **Required:**

- A neutral witness or adjudicator MUST fetch `contentUri` and recompute
  `contentHash` at validation time, comparing to the committed digest.
- Prefer content-addressed URIs (IPFS CID); if HTTP is used, the response
  must carry a signature or TLS pin accepted by the validator.

### SC-4 — verifyUrl multi-source (fixes oracle hijack, HIGH)

A hostile `verifyUrl` could return forged chain state. **Required:**

- `verifyUrl` SHOULD resolve through ≥2 independent sources
  (e.g. two RPC endpoints or explorer + indexer).
- The returned data itself must be verifiable (transaction receipt hash,
  block inclusion proof), not trusted from a single URL.

### SC-5 — Canonical serialization (fixes hash collision, MEDIUM)

JSON canonicalization must be unambiguous. **Required:**

- Use RFC 8785 (JCS) canonical JSON for computing `recursiveHash`
  (key order, Unicode normalization, number formatting).
- Validators MUST canonicalize before hashing and before verifying any
  signature; non-canonical envelopes are rejected outright.

### Compliance

| Constraint | Missing ⇒ derived trust |
|-----------|--------------------------|
| SC-1 role registry | never above `self-reported` |
| SC-2 replay nonce | reject duplicate envelope |
| SC-3 content re-hash | never above `self-reported` |
| SC-4 multi-source verifyUrl | `chain_proof` provenance dropped |
| SC-5 canonical JCS | envelope invalid |

### SC-6 — Algorithm & media pinning (2nd-pass hardening)

Second cross-audit (MiniMax M3) flagged remaining edge cases. **Required:**

- **Fixed digest algorithm**: `contentHash` MUST be SHA-256 only. Supporting
  multiple algorithms reopens hash-ambiguity; reject any non-SHA-256 digest.
- **Media-type binding**: the envelope MUST carry `contentType` and validators
  MUST check it against the fetched bytes' actual media type. Hash collision
  across different media types (e.g. HTML vs PNG with same digest) must not
  silently pass.
- **Witness independence**: multi-source `verifyUrl` sources MUST NOT share
  the same DNS/CDN/cloud provider; otherwise Sybil/majority attacks and
  single-infrastructure outages defeat multi-sourcing.
- **Consumed-hash store**: replay registry MUST be bounded/partitioned per
  `scopeId` (window-scoped), preventing unbounded growth and store-DoS.

> Without SC-1..SC-5 the whole arbitration can be forged to `adjudicated`
> by any party (audit score 4/10); with them, evidence is machine-verifiable.
