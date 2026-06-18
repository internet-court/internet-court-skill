---
name: okx-a2a-payment
description: "DEPRECATED legacy alias — a2a-pay support has been merged into `okx-agent-payments-protocol` (see `references/a2a_charge.md`). This stub exists only so that legacy invocations referencing the old name resolve to a meaningful redirect. If you land here, immediately load `okx-agent-payments-protocol` via the Skill tool and follow it instead. Do NOT execute any payment logic from this stub. All paymentId / a2a_... / payment-link / payment-status triggers now route directly to `okx-agent-payments-protocol` (Path B in its SKILL.md)."
license: MIT
metadata:
  author: okx
  version: "3.3.13"
  homepage: "https://web3.okx.com"
  deprecated: true
  successor: okx-agent-payments-protocol
---

# DEPRECATED — merged into `okx-agent-payments-protocol`

This skill has been folded into the unified payment dispatcher. The functionality is unchanged; only the entry point has changed.

**What to do**: load **`okx-agent-payments-protocol`** via the Skill tool and follow that skill instead. The a2a-pay flow lives at:

- `okx-agent-payments-protocol/SKILL.md` — Path B (paymentId-based, no 402)
- `okx-agent-payments-protocol/references/a2a_charge.md` — full create / pay / status playbook

**Why this stub exists**: legacy transcripts, scripts, and external docs may still reference `okx-a2a-payment` by name. This stub catches those references and redirects to the merged skill. It carries no triggers of its own — new conversations mentioning paymentId / `a2a_...` / "create payment link" / "payment status" route directly to `okx-agent-payments-protocol` based on that skill's triggers.
