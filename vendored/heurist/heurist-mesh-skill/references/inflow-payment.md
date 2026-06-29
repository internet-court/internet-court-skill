# Inflow Payment Platform

Inflow is an agentic payment platform. Heurist acts as a seller, allowing users and AI agents to pay for Mesh services through Inflow's unified payment interface using USDC.

## Required Credentials

Store in `.env`:
```
INFLOW_USER_ID=your-buyer-user-id
INFLOW_PRIVATE_KEY=your-buyer-private-key
```

If you don't have these yet, complete the one-time buyer setup below.

## One-Time Buyer Setup

### Create agentic user

```bash
curl -sS -X POST "https://mesh.heurist.xyz/mesh_signup_inflow" \
  -H "Content-Type: application/json" \
  -d '{"locale":"EN_US","timezone":"US/Pacific"}'
```

Save from response: `data.userId` and `data.privateKey` into `.env`.

### Attach identity/email

Use a real email — the user must confirm via inbox. Password requires: 10+ chars, uppercase, lowercase, number, symbol.

```bash
curl -sS -X POST "https://mesh.heurist.xyz/mesh_signup_inflow_attach" \
  -H "Content-Type: application/json" \
  -d '{
    "privateKey":"<INFLOW_PRIVATE_KEY>",
    "email":"user@example.com",
    "firstName":"John",
    "lastName":"Doe",
    "password":"SecurePass1!"
  }'
```

This is one-time per buyer.

## Payment Flow

Inflow uses a two-call pattern: first call creates a payment request, user approves it, second call executes the tool.

### Step 1: First call — create payment request

Send `mesh_request` with `payment.request_id: null`:

```bash
curl -sS -X POST "https://mesh.heurist.xyz/mesh_request" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "TokenResolverAgent",
    "input": {
      "tool": "token_profile",
      "tool_arguments": {"coingecko_id": "bitcoin"},
      "raw_data_only": true
    },
    "payment": {
      "provider": "INFLOW",
      "user_id": "<INFLOW_USER_ID>",
      "currency": "USDC",
      "request_id": null
    }
  }'
```

Response returns `status: "payment_pending"` and `payment.request_id`. **Save the `request_id` immediately.**

### Step 2: Ask user to approve

Present the `request_id` and ask the user to approve in the Inflow dashboard/email/mobile flow.

Optional status check:

```bash
curl -sS -H "X-API-Key: $INFLOW_PRIVATE_KEY" \
  "https://app.inflowpay.ai/v1/requests/<REQUEST_ID>"
```

### Step 3: Second call — execute with same payload

Send the exact same payload, only setting `payment.request_id` to the saved value. The `agent_id`, `input.tool`, `input.tool_arguments`, and `payment.user_id` **must not change** — Mesh rejects mismatches.

Interpret response:
- Tool result payload → success
- `status: "payment_pending"` → approval not finalized; retry with backoff (3-10s)
- `status: "payment_not_approved"` → declined/expired; restart from Step 1
- `400` with invalid/expired request id → restart from Step 1

## Special Reuse Rule

A previously approved `request_id` can be reused for status-check tools without additional payment:
- `AskHeuristAgent.check_job_status` (same `job_id`)
- `CaesarResearchAgent.get_research_result` (same `research_id`)

Requires same Inflow `user_id` and same agent family.

## Troubleshooting

- **Invalid or expired request_id**: Ensure the second call uses identical payload fields and wasn't delayed past the request TTL.
- **Inflow approved but Mesh still fails**: Check buyer-side status, collect `request_id`, `transactionId`, and Mesh response body, retry once, then surface to platform operator.
- **INSUFFICIENT_FUNDS**: Fund the buyer wallet and restart the payment flow.
