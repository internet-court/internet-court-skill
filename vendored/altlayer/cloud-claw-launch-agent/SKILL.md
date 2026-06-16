---
name: cloud-claw-launch-agent
description: Use this skill when the user wants to launch a new AltClaw, OpenClaw, PicoClaw, or Ottie deployment through Cloud Claw. Covers the same user-facing fields and constraints exposed in the Cloud Claw UI, using the local altllm cloud-claw-* commands. Do NOT use for post-launch lifecycle tasks like start/stop/delete/logs; use cloud-claw-manage-vm.
user-invocable: true
---

# Launch Cloud Claw Agent

Use this skill for the **new deployment** workflow exposed in the Cloud Claw UI, via the local CLI commands in this repository.

The implementation source of truth is the sibling repository:

- `../cloud-claw`

## Shared Setup

> Before using this skill, read:
> - `../_shared/cloud-claw-preflight.md`
> - `../_shared/cloud-claw-api-surface.md`

## Supported Agent Types

| Agent Type | Internal Value | User-facing Notes |
|---|---|---|
| OpenClaw | `openclaw` | paid-tier path, Telegram + web dashboard |
| PicoClaw | `picoclaw` | Telegram-only |
| Ottie | `aintern` | Telegram-only, self-evolving fork path |

## Launch Rules

- Use `altllm cloud-claw-deploy`.
- Deployment `name` must match `^[a-z0-9-]+$` and max length 63.
- `agentType` must be one of:
  - `openclaw`
  - `picoclaw`
  - `aintern`
- `picoclaw` and `aintern` require `TELEGRAM_BOT_TOKEN`.
- `openclaw` uses `OPENCLAW_MODEL`.
- UI-supported OpenClaw model choices are:
  - `altllm/altllm-standard`
  - `altllm/altllm-mega`
- The backend may inject an AltLLM API key automatically for the signed-in user.
- Launch success depends on quota, free-slot availability, active credits, and payment state.

## Reference

See [references/cli-reference.md](references/cli-reference.md) for payload examples and expected responses.
