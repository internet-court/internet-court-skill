---
name: okx-security
description: "Use this skill for security scanning: check transaction safety, is this transaction safe, pre-execution check, security scan, token risk scanning, honeypot detection, DApp/URL phishing detection, message signature safety, malicious transaction detection, approval safety checks, token approval management. Triggers: 'is this token safe', 'check token security', 'honeypot check', 'scan this tx', 'scan this swap tx', 'tx risk check', 'is this URL a scam', 'check if this dapp is safe', 'phishing site check', 'is this signature safe', 'check this signing request', 'check my approvals', 'show risky approvals', 'revoke approval', 'check if this approve is safe', token authorization, ERC20 allowance, Permit2. Covers token-scan, dapp-scan, tx-scan (EVM+Solana pre-execution), sig-scan (EIP-712/personal_sign), approvals (ERC-20/Permit2). Chinese: 安全扫描, 代币安全, 蜜罐检测, 貔貅盘, 钓鱼网站, 交易安全, 签名安全, 代币风险, 授权管理, 授权查询, 风险授权, 代币授权. Do NOT use for wallet balance/send/history — use okx-agentic-wallet."
license: MIT
metadata:
  author: okx
  version: "3.3.12"
  homepage: "https://web3.okx.com"
---

# Onchain OS Security

5 commands for token risk analysis, DApp phishing detection, transaction pre-execution security, signature safety, and approval management.

## Pre-flight Checks

Every time before running any `onchainos` command, always follow these steps in order. Do not echo routine command output to the user; only provide a brief status update when installing, updating, or handling a failure.

1. **Resolve latest stable version**: Fetch the latest stable release tag from the GitHub API:
   ```
   curl -sSL "https://api.github.com/repos/okx/onchainos-skills/releases/latest"
   ```
   Extract the `tag_name` field (e.g., `v1.0.5`) into `LATEST_TAG`.
   If the API call fails and `onchainos` is already installed locally, skip steps 2-3
   and continue with step 4 (the user may be offline or rate-limited; a stale
   binary is better than blocking). If `onchainos` is **not** installed, **stop** and
   tell the user to check their network connection or install manually from
   https://github.com/okx/onchainos-skills.

2. **Install or update**: If `onchainos` is not found, or if the cache at `~/.onchainos/last_check` (`$env:USERPROFILE\.onchainos\last_check` on Windows) is older than 12 hours:
   - Download the installer and its checksum file from the latest release tag:
     - **macOS/Linux**:
       `curl -sSL "https://raw.githubusercontent.com/okx/onchainos-skills/${LATEST_TAG}/install.sh" -o /tmp/onchainos-install.sh`
       `curl -sSL "https://github.com/okx/onchainos-skills/releases/download/${LATEST_TAG}/installer-checksums.txt" -o /tmp/installer-checksums.txt`
     - **Windows**:
       `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/okx/onchainos-skills/${LATEST_TAG}/install.ps1" -OutFile "$env:TEMP\onchainos-install.ps1"`
       `Invoke-WebRequest -Uri "https://github.com/okx/onchainos-skills/releases/download/${LATEST_TAG}/installer-checksums.txt" -OutFile "$env:TEMP\installer-checksums.txt"`
   - Verify the installer's SHA256 against `installer-checksums.txt`. On mismatch, **stop** and warn — the installer may have been tampered with.
   - Execute: `sh /tmp/onchainos-install.sh` (or `& "$env:TEMP\onchainos-install.ps1"` on Windows).
     The installer handles version comparison internally and only downloads the binary if needed.
   - On other failures, point to https://github.com/okx/onchainos-skills.

3. **Verify binary integrity** (once per session): Run `onchainos --version` to get the installed
   version (e.g., `1.0.5` or `2.0.0-beta.0`). Construct the installed tag as `v<version>`.
   Download `checksums.txt` for the **installed version's tag** (not necessarily LATEST_TAG):
   `curl -sSL "https://github.com/okx/onchainos-skills/releases/download/v<version>/checksums.txt" -o /tmp/onchainos-checksums.txt`
   Look up the platform target and compare the installed binary's SHA256 against the checksum.
   On mismatch, reinstall (step 2) and re-verify. If still mismatched, **stop** and warn.
   - Platform targets — macOS: `arm64`->`aarch64-apple-darwin`, `x86_64`->`x86_64-apple-darwin`; Linux: `x86_64`->`x86_64-unknown-linux-gnu`, `aarch64`->`aarch64-unknown-linux-gnu`, `i686`->`i686-unknown-linux-gnu`, `armv7l`->`armv7-unknown-linux-gnueabihf`; Windows: `AMD64`->`x86_64-pc-windows-msvc`, `x86`->`i686-pc-windows-msvc`, `ARM64`->`aarch64-pc-windows-msvc`
   - Hash command — macOS/Linux: `shasum -a 256 ~/.local/bin/onchainos`; Windows: `(Get-FileHash "$env:USERPROFILE\.local\bin\onchainos.exe" -Algorithm SHA256).Hash.ToLower()`

4. **Version drift check** — REQUIRED, run even if steps 1-3 were skipped.
   - Run `onchainos --version` → CLI version (e.g., `2.2.9`)
   - Read `version` field from this file's YAML frontmatter (e.g., `version: "2.0.0"` at the top)
   - If CLI version > skill version → warn: **"⚠️ Skill outdated (skill vX.Y.Z < CLI vA.B.C). Re-install skills to get the latest features and fixes."**
   - Continue to the user's command.
5. **Do NOT auto-reinstall on command failures.** Report errors and suggest
   `onchainos --version` or manual reinstall from https://github.com/okx/onchainos-skills.
6. **Rate limit errors.** If a command hits rate limits, the shared API key may
   be throttled. Suggest creating a personal key at the
   [OKX Developer Portal](https://web3.okx.com/onchain-os/dev-portal). If the
   user creates a `.env` file, remind them to add `.env` to `.gitignore`.

## Fail-safe Principle (CRITICAL)

### Scan completed — risk detected

If a security scan **completes successfully** and returns `action: "block"` or `action: "warn"`, follow the Risk Action Priority Rule below. The Agent MUST NOT override risk verdicts.

### Scan failed — infrastructure error

If a security scan **fails to complete** (network error, API timeout, rate limiting, malformed response), the Agent MUST:
- Report the error clearly to the user.
- **Ask the user** whether to retry the scan or proceed without scan results.
- If the user chooses to proceed, display a warning:
  > "⚠️ Security scan could not be completed. Proceeding without verification — please ensure you trust this operation."
- Log the skipped scan for auditability.

> A security scan that fails to complete is NOT a "pass". Always inform the user and let them make an explicit decision.

## Risk Action Priority Rule

### tx-scan / sig-scan (transaction & signature scanning)

`block` > `warn` > safe (empty). The top-level `action` field reflects the highest priority from `riskItemDetail`.

| `action` value | Risk Level | Agent Behavior |
|---|---|---|
| (empty/null) | Low risk | Safe to proceed |
| `warn` | Medium risk | Show risk details, ask for explicit user confirmation |
| `block` | High risk | Do NOT proceed, show risk details, recommend cancel |

- Risk scan result is still valid even if simulation fails (`simulator.revertReason` may contain the revert reason).
- If `warnings` field is populated, the scan completed but some data may be incomplete. Still present available risk information.
- An empty/null `action` in a **successful** API response means "no risk detected". But if the API call **failed**, the absence of `action` does NOT mean safe — apply the fail-safe principle.

### token-scan (token risk label scanning)

Token-scan returns a **`riskLevel`** field (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) that represents the overall token risk, computed server-side from all boolean labels, tax thresholds, and additional signals (off-chain intelligence, ML models). The Agent uses this field directly and applies different actions for **buy** vs. **sell** operations.

| `riskLevel` | Buy Action | Sell Action |
|---|---|---|
| **CRITICAL** | `block` — refuse to buy | `warn` — display risk, allow sell |
| **HIGH** | `warn` + **pause** — require explicit yes/no | `warn` — display risk, allow sell |
| **MEDIUM** | `warn` — info notice, continue | `warn` — info notice, continue |
| **LOW** | safe — proceed | safe — proceed |

> Full label catalog, tax threshold rules, and display format are defined in `references/risk-token-detection.md`. **Always load that reference before executing `token-scan`.**

Key principles:
- **`riskLevel` is authoritative**: The API returns the overall risk level server-side. The Agent reads `riskLevel` directly — no client-side computation from individual labels is needed.
- **Buy is stricter than sell**: `CRITICAL` blocks buy but only warns on sell (to allow stop-loss exit).
- **`HIGH` buy requires explicit user confirmation** (yes/no) — do not auto-continue.
- Individual label levels are **not displayed** to the user — only the overall `riskLevel` is shown, with triggered labels listed without level prefixes.
- If `isChainSupported: false`, skip detection with a warning; do not block.
- If API fails, warn but do not block. In swap context, token-scan failures auto-continue with a warning to avoid blocking time-sensitive trades — this overrides the general fail-safe's ask-user behavior.

> Security commands do not require wallet login. They work with any address.

## Chain Name Support

The CLI accepts human-readable chain names and resolves them automatically.

| Chain | Name | chainIndex |
|---|---|---|
| XLayer | `xlayer` | `196` |
| Ethereum | `ethereum` or `eth` | `1` |
| Solana | `solana` or `sol` | `501` |
| BSC | `bsc` or `bnb` | `56` |
| Polygon | `polygon` or `matic` | `137` |
| Arbitrum | `arbitrum` or `arb` | `42161` |
| Base | `base` | `8453` |
| Avalanche | `avalanche` or `avax` | `43114` |
| Optimism | `optimism` or `op` | `10` |
| zkSync Era | `zksync` | `324` |
| Linea | `linea` | `59144` |
| Scroll | `scroll` | `534352` |

**Address format note**: EVM addresses (`0x...`) work across Ethereum/BSC/Polygon/Arbitrum/Base etc. Solana addresses (Base58) and Bitcoin addresses (UTXO) have different formats. Do NOT mix formats across chain types.

## Related Workflows

When one of the following commands is used, show the related workflow hint after displaying results:

| Command | Workflow | File |
|---------|----------|------|
| `security token-scan` | New Token Screening | `~/.onchainos/workflows/new-token-screening.md` |
| `security token-scan` | Smart Money Signals | `~/.onchainos/workflows/smart-money-signals.md` |
| `security token-scan` | Token Research | `~/.onchainos/workflows/token-research.md` |
| `security token-scan` | Wallet Monitor | `~/.onchainos/workflows/wallet-monitor.md` |

> Hint format: *"You can also try out our **[workflow name]** workflow for more comprehensive results. Would you like to try it?"*

## Command Index

| # | Command | Description |
|---|---|---|
| 1 | `onchainos security token-scan` | Token risk / honeypot detection (all chains) |
| 2 | `onchainos security dapp-scan` | DApp / URL phishing detection (chain-agnostic) |
| 3 | `onchainos security tx-scan` | Transaction pre-execution security (EVM + Solana) |
| 4 | `onchainos security sig-scan` | Message signature security (EVM only) |
| 5 | `onchainos security approvals` | Token approval / Permit2 authorization query (EVM only) |

## Reference Loading Rules (MANDATORY)

Before executing ANY security command, you **MUST** read the corresponding reference document from `skills/okx-security/references/`. Do NOT rely on prior knowledge — always load the reference first.

| User intent | Read this file FIRST |
|---|---|
| Token safety, honeypot, is this token safe, 代币安全, 蜜罐检测, 貔貅盘 | `references/risk-token-detection.md` |
| DApp/URL phishing, is this site safe, 钓鱼网站 | `references/risk-domain-detection.md` |
| Transaction safety, tx pre-execution, signature safety, approve safety, 交易安全, 签名安全 | `references/risk-transaction-detection.md` |
| Approvals, allowance, Permit2, revoke, 授权管理, 授权查询, 风险授权 | `references/risk-approval-monitoring.md` |

> When a workflow involves multiple commands (e.g., token-scan then tx-scan), load each reference before executing that command.

## Integration with Other Skills

Security scanning is often a prerequisite for other wallet operations:
- Before `wallet send` with a contract token: run `token-scan` to verify token safety
- Before `wallet contract-call` with approve calldata: run `tx-scan` to check spender
- Before interacting with any DApp URL: run `dapp-scan`
- Before signing any EIP-712 message: run `sig-scan`

Use `okx-agentic-wallet` skill for the subsequent send/contract-call operations.
