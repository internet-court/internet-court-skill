# AltLLM Portal API Keys — CLI Reference

## Commands

### List keys

```bash
node dist/cli.js list-api-keys \
  --base-url https://platform-api.altllm.ai
```

Alias: `node dist/cli.js keys`

### Create key

```bash
node dist/cli.js create-api-key \
  --base-url https://platform-api.altllm.ai \
  --name "Codex Agent" \
  --model altllm-native-fast \
  --model altllm-standard
```

Flex example:

```bash
node dist/cli.js create-api-key \
  --base-url https://platform-api.altllm.ai \
  --name "Flex Agent" \
  --model altllm-standard \
  --model altllm-flex-gpt-5.5 \
  --model altllm-flex-opus-4.7 \
  --model altllm-flex-gemini-3.1
```

Representative stdout:

```json
{
  "id": "key_123",
  "name": "Codex Agent",
  "key": "sk-alt-abcdefghijklmnopqrstuvwxyz0123456789ABCD",
  "key_prefix": "sk-alt-abcd..."
}
```

### Inspect key

```bash
node dist/cli.js get-api-key \
  --base-url https://platform-api.altllm.ai \
  --key-id <id>
```

Known production limitation:

- The current production Portal backend rejects valid key IDs on single-key routes.
- Expect `get-api-key`, `update-api-key`, and `revoke-api-key` to fail until the backend issue is fixed.
- Avoid creating temporary production smoke keys while `revoke-api-key` is unavailable unless an approved cleanup path exists.

### Update key

```bash
node dist/cli.js update-api-key \
  --base-url https://platform-api.altllm.ai \
  --key-id <id> \
  --name "Codex Agent v2" \
  --status active \
  --model altllm-native-fast
```

### Revoke key

```bash
node dist/cli.js revoke-api-key \
  --base-url https://platform-api.altllm.ai \
  --key-id <id>
```

## Notes

- Keys created through Portal are for the AltLLM OpenAI-compatible gateway at `https://api.altllm.ai/v1`.
- The CLI accepts `altllm-flex-*` model IDs because API-key model validation only requires the `altllm-` prefix.
- Flex model access is still enforced by Portal/Gateway account checks.
- `get-api-key`, `update-api-key`, and `revoke-api-key` are currently blocked by a known production backend issue on the single-key Portal routes.
