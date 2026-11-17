# Coverage Gap Proposal

## Use case / user goal
Support agent-to-agent commerce (especially in Vietnamese-language or SEA-focused agent workflows) where multiple agents need to pool funds, negotiate terms in natural language, and have a clear adjudication path if the deal is disputed.

## Layer
Layer 4 (Payment & escrow) + Layer 6 (Verification & disputes)

## What is missing
There is currently no skill that combines:
- Multiparty off-chain settlement (similar to Yellow Network) with
- A clear, pre-agreed adjudication path (GenLayer or Kleros) that can be referenced in natural-language mandates.

The existing `vendored/yellow/yellow-settlement-room` skill handles multiparty settlement but explicitly has no dispute mechanism of its own. There is no connector skill that wires it to an adjudication layer.

## Suggested improvement
Add a lightweight connector skill (or document the recommended pattern) that shows how to:
1. Use Yellow-style multiparty settlement for the happy path.
2. Pre-agree an adjudication venue (GenLayer) in the natural-language mandate.
3. Define the evidence schema and resolution path if the settlement is contested.

This would make Internet Court more usable for real multi-agent commercial deals that need both speed and accountability.
