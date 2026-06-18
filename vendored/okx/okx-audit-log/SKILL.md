---
name: okx-audit-log
description: "Use this skill when the user asks to export audit logs, find audit log location, view command history, 导出日志, 查看日志, 日志路径, 操作记录, 调用记录, 命令历史. Do NOT use for wallet balance, token search, swap, or any other on-chain operation — use the corresponding skill instead."
license: MIT
metadata:
  author: okx
  version: "3.3.13"
  homepage: "https://web3.okx.com"
---

# Onchain OS Audit Log

Provide the audit log file path for developers to troubleshoot issues offline.

## Response

Tell the user:

1. **Log file path**: `~/.onchainos/audit.jsonl` (or `$ONCHAINOS_HOME/audit.jsonl` if the env var is set)
2. **Format**: JSON Lines, one JSON object per line
3. **First line (device header)**: `{"type":"device","os":"<os>","arch":"<arch>","version":"<cli_version>"}` — written once when the log file is created; preserved across rotations
4. **Entry fields**: `ts` (local time with timezone, e.g. `2026-03-18 +8.0 18:00:00.123`), `source` (cli/mcp), `command`, `ok`, `duration_ms`, `args` (redacted), `error`
5. **Rotation**: max 10,000 lines, auto-keeps the device header + most recent 5,000 entries

Do NOT read or display the file contents in the conversation.
