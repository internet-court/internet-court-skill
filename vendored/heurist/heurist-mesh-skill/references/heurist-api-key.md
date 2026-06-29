# Heurist API Key (Credit Payment)

## Get Credits

Option 1. Visit https://heurist.ai/credits to buy credits and manage API keys.

Option 2. Claim 100 free credits by posting a verification tweet (only once per user allowed):

1. Call `POST https://mesh.heurist.xyz/claim_credits/initiate` — returns a `verification_code` and `tweet_text`.
2. Post the tweet text on X (must include `@heurist_ai` and `verification: <code>`).
3. Call `POST https://mesh.heurist.xyz/claim_credits/verify` with:
   ```json
   {"tweet_url": "https://x.com/<user>/status/<id>", "verification_code": "<code>"}
   ```
4. Returns `api_key`, `credits` (100), and `twitter_handle`. One claim per Twitter handle. Code expires in 10 minutes.

## Use the API Key

Pass as Bearer token or in request body:

```
POST /mesh_request
Authorization: Bearer <api_key>

{"agent_id": "TokenResolverAgent", "input": {"tool": "resolve_token", "tool_arguments": {"symbol": "ETH"}, "raw_data_only": true}}
```

## Pricing

Each agent defines credit cost per tool call. Defaults to 1 credit. Check agent metadata for `credits` field — it may have per-tool pricing:
```json
{"credits": {"default": 1, "expensive_tool": 3}}
```
