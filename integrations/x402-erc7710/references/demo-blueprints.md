# x402 + ERC-7710 Demo Blueprints

## Blueprint A: Agent Research Pass

Goal: demonstrate an agent making repeated paid HTTP calls without asking the user to approve every request.

Actors:

- User: owns the smart account and grants permission.
- Buyer agent: calls the paid API and holds the delegated permission context.
- Evidence provider: serves x402-protected reports.
- Facilitator: verifies and settles x402 payments.
- Internet Court: receives disputes.

Policy:

- Token: USDC testnet token.
- Network: Base Sepolia or selected demo chain.
- Merchant: provider wallet only.
- Route: `GET /api/evidence/report/*`.
- Max per request: 0.25 USDC.
- Max per week: 5 USDC.
- Expiry: seven days after grant.

Happy path:

1. User signs one permission.
2. Agent calls protected report endpoint.
3. Provider returns payment requirements.
4. Agent validates requirements against policy.
5. Agent pays through x402.
6. Provider returns report and settlement receipt.

Failure paths:

- Amount exceeds cap: agent refuses payment.
- Merchant mismatch: agent refuses payment.
- Expired permission: agent asks for renewal.
- Paid but malformed report: evidence package goes to dispute.
- Settlement failed: retry only with idempotency key.

## Blueprint B: Oracle Resolution Credits

Goal: let a prediction-market operator pay for resolution attempts while limiting total spend.

Flow:

1. Market operator grants resolver agent a monthly budget.
2. Resolver calls paid data APIs through x402.
3. Resolver creates an Intelligent Oracle or submits an evidence URL.
4. If resolution is `UNDETERMINED`, the agent can retry until budget or expiry.

## Blueprint C: Escrowed Subscription Setup

Goal: charge setup fees only if a subscription connector works.

Flow:

1. Buyer escrows setup fee in Arkhai.
2. Seller deploys x402 resource server and returns endpoint metadata.
3. Buyer agent runs a test payment using its ERC-7710 delegation.
4. Fulfillment attestation records successful paid request and response.
5. Arbiter releases setup fee.
