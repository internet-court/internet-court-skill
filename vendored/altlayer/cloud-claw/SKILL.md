---
name: cloud-claw
description: Use this umbrella skill when the request spans multiple Cloud Claw user-facing domains, especially launching a new AltClaw or OpenClaw VM and then managing lifecycle, logs, renewal, or dashboard access through the local altllm cloud-claw-* commands in this repository.
user-invocable: true
---

# Cloud Claw Skills

Use this umbrella skill when the task spans multiple user-facing Cloud Claw workflows.

These skills are hosted in this repository, and the workflow is exposed through local `altllm cloud-claw-*` commands. The product implementation itself still lives in the sibling repository:

- `../cloud-claw`

## Shared Setup

> Before using these skills, read:
> - `../_shared/cloud-claw-preflight.md`
> - `../_shared/cloud-claw-api-surface.md`

## Skill Map

| Skill | Purpose | Use When |
|---|---|---|
| `cloud-claw-launch-agent` | Launch a new OpenClaw, PicoClaw, or Ottie deployment | New deployment, agent selection, launch prerequisites, launch payloads |
| `cloud-claw-manage-vm` | View and operate existing VMs | List, inspect, start, stop, renew, auto-renew, logs, dashboard |

## Rules

- Prefer the focused skill when the request stays within one domain.
- Use this umbrella skill when the workflow spans both deployment creation and later VM management.
- Prefer the local `altllm cloud-claw-*` commands over ad-hoc raw HTTP.
- Stay on the user-facing API routes the UI uses. Do not treat low-level GCP build/image scripts as default workflow.

## Reference

See [references/skill-map.md](references/skill-map.md) for API coverage and file ownership.
