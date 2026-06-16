---
name: okx-x402-payment
description: "DEPRECATED legacy alias — x402 + MPP support has been merged into `okx-agent-payments-protocol` (see `references/exact.md`, `references/aggr_deferred.md`, `references/charge.md`, `references/session.md`). This stub exists only so that legacy invocations referencing the old name resolve to a meaningful redirect. If you land here, immediately load `okx-agent-payments-protocol` via the Skill tool and follow it instead. Do NOT execute any payment logic from this stub. All HTTP 402 / x402 / MPP / channel / voucher / session triggers now route directly to `okx-agent-payments-protocol` (Path A in its SKILL.md)."
license: MIT
metadata:
  author: okx
  version: "3.3.12"
  homepage: "https://web3.okx.com"
  deprecated: true
  successor: okx-agent-payments-protocol
---

# DEPRECATED — merged into `okx-agent-payments-protocol`

This skill has been folded into the unified payment dispatcher. The functionality is unchanged; only the entry point has changed.

**What to do**: load **`okx-agent-payments-protocol`** via the Skill tool and follow that skill instead. The x402 + MPP flows live at:

- `okx-agent-payments-protocol/SKILL.md` — Path A (HTTP 402 detection + dispatch)
- `okx-agent-payments-protocol/references/exact.md` — x402 `exact` scheme (TEE EIP-3009 or local-key fallback)
- `okx-agent-payments-protocol/references/aggr_deferred.md` — x402 `aggr_deferred` scheme (Session Key + sessionCert)
- `okx-agent-payments-protocol/references/charge.md` — MPP `charge` intent (one-shot, tx or hash mode)
- `okx-agent-payments-protocol/references/session.md` — MPP `session` intent (open / voucher / topUp / close)

**Why this stub exists**: legacy transcripts, scripts, and external docs may still reference `okx-x402-payment` by name. This stub catches those references and redirects to the merged skill. It carries no triggers of its own — new conversations mentioning x402 / MPP / 402 / channel operations route directly to `okx-agent-payments-protocol` based on that skill's triggers.
