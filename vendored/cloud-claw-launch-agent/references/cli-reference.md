# Cloud Claw Launch Agent — CLI Reference

## Check user deployment context

Before creating a VM, inspect:

```bash
node dist/cli.js cloud-claw-me
```

Important fields:

- `altllmConnected`
- `altllmTier`
- `vmLimit`
- `isFreeTier`
- `activePayments`
- `prices`
- `credit`
- `freeSlots`

## Launch OpenClaw

```bash
TELEGRAM_BOT_TOKEN=123456789:ABC... \
node dist/cli.js cloud-claw-deploy \
  --name happy-fox-12 \
  --agent-type openclaw \
  --model altllm/altllm-standard \
  --telegram-bot-token-env TELEGRAM_BOT_TOKEN \
  --telegram-allowed-users 123456789
```

## Launch PicoClaw

```bash
TELEGRAM_BOT_TOKEN=123456789:ABC... \
node dist/cli.js cloud-claw-deploy \
  --name swift-panda-58 \
  --agent-type picoclaw \
  --telegram-bot-token-env TELEGRAM_BOT_TOKEN \
  --telegram-allowed-users 123456789
```

Omit `--telegram-allowed-users` only when you intentionally want a public bot. An explicitly empty value is rejected.

## Launch Ottie

```bash
TELEGRAM_BOT_TOKEN=123456789:ABC... \
node dist/cli.js cloud-claw-deploy \
  --name brave-owl-14 \
  --agent-type aintern \
  --telegram-bot-token-env TELEGRAM_BOT_TOKEN \
  --telegram-allowed-users 123456789
```

## Secret Input Options

For deployment secrets, the CLI supports:

- direct flags such as `--telegram-bot-token`
- environment-variable selectors such as `--telegram-bot-token-env TELEGRAM_BOT_TOKEN`
- file selectors such as `--telegram-bot-token-file /path/to/token.txt`

The same pattern also applies to:

- `--altllm-api-key`
- `--anthropic-api-key`

## Representative success response

```json
{
  "success": true,
  "deployment": {
    "name": "happy-fox-12",
    "vmName": "openclaw-happy-fox-12",
    "url": "/dash/happy-fox-12/"
  }
}
```

## Common launch failures to surface clearly

- `401`: auth failure
- `400`: missing Telegram bot token for PicoClaw or Ottie
- `402`: insufficient balance / payment required
- `409`: VM name already exists
- `429`: VM quota exceeded
