# Portal Actions — Policy Settings & Wallet Export

> Load when: new user login (`isNew: true`), after `wallet add`, the user asks about Policy / spending limits / whitelist, or the user asks to export wallet / mnemonic / migrate.

Policy configuration and wallet export **must be completed by the user on the Web portal**. The Agent only detects the scenario, explains the risk, gives the jump link, and outputs the verbatim template below. The Agent must **never** display any mnemonic phrase or private key content in the conversation.

## Templates

**IMPORTANT**: Print the matching template verbatim (translated to the user's language). The link and trailing navigation sentence are chosen by `loginType` (from `wallet status`, or the `login` / `verify` response). If `loginType` is unknown, run `onchainos wallet status` first; treat any unrecognized value as `email`.

### Template: Wallet Export

> Wallet export must be completed on the Web portal. Please note: once the export is complete, your current wallet will be permanently unbound from your email, and the Agent will no longer be able to operate this wallet. The system will automatically create a new empty wallet for your account. Before exporting, please transfer your assets to a safe address and stop any running strategies. Go to Wallet Export → {export_url}
>
> {export_hint}

| `loginType` | `{export_url}` | `{export_hint}` |
|---|---|---|
| `email` | `https://web3.okx.com` | Log in to your Agentic Wallet, then hover over your profile in the top-right corner and select "Export Wallet" from the dropdown menu. |
| `ak` | `https://web3.okx.com/onchainos/dev-portal` | Log in the Developer Portal using a plugin wallet or the OKX Wallet App that manages your API Key, and click Agentic Wallet → Wallet Export. |

### Template: Policy Settings

> You can set per-transaction and daily limits for trades and transfers, as well as a transfer whitelist, to prevent excessive operations or transfers to unauthorized addresses. Go to Policy Setting → {policy_url}
>
> {policy_hint}

| `loginType` | `{policy_url}` | `{policy_hint}` |
|---|---|---|
| `email` | `https://web3.okx.com/portfolio/agentic-wallet-policy` | Log in to your Agentic Wallet, then hover over your profile in the top-right corner and select "Policy Setting" from the dropdown menu. |
| `ak` | `https://web3.okx.com/onchainos/dev-portal` | Log in with the EOA wallet that created the Agentic Wallet and open the OKX Web3 Dev platform, and click on the Agentic Wallet - Policy Setting in the upper right corner to set security rules. |

## Available Policy Rules

Policy **only** includes the following rules. Do NOT invent or mention any rules beyond this list (e.g., no "transaction count limit", no "gas limit", no "token blacklist"):

| Rule | Description | Field (from `wallet status`) |
|---|---|---|
| Per-transaction limit | Max USD amount per single transaction or transfer | `singleTxLimit` / `singleTxFlag` |
| Daily transfer limit | Max USD amount for transfers per day (resets at UTC 0:00) | `dailyTransferTxLimit` / `dailyTransferTxFlag` / `dailyTransferTxUsed` |
| Daily trade limit | Max USD amount for trades (swaps) per day (resets at UTC 0:00) | `dailyTradeTxLimit` / `dailyTradeTxFlag` / `dailyTradeTxUsed` |
| Transfer whitelist | Only allow transfers to pre-approved addresses | Configured on Web portal only |

## Trigger flows

The following are **trigger conditions** — when any is met, the Agent **MUST** output the corresponding guidance. Do not skip or omit.

### New user login (`isNew: true`)

Handled in Authentication step 5 (SKILL.md) — output the **Policy Settings template** followed by the **Wallet Export template** (above).

### New account via `wallet add`

After a successful `wallet add`, **MUST** output the **Policy Settings template** (above), prefixed with a short line such as "New account created.".

### User asks about Policy

e.g., "How do I set a spending limit?", "What's my daily limit?", "How to configure whitelist?"
- Run `onchainos wallet status` and check the `policy` field.
- If any flag is true, first display the current settings (limits, used amounts).
- Then output the **Policy Settings template** (above).

### User asks about wallet export

e.g., "How do I export my mnemonic?", "I want to migrate my wallet", "How do I import my wallet into a hardware wallet?"

**Required sequence — follow exactly, no steps may be skipped or reordered:**

**Step 1.** Confirm the user is logged in (so `accountId` is available locally). `onchainos wallet status` will surface it.

**Step 2.** Call `onchainos competition user-status` (no `--activity-id`). The command uses the active session's `accountId` automatically — no wallet args needed.

**Step 3.** Inspect results:
- If **any** entry has `joinStatus=1` → output the warning below and **stop**. Do NOT output export instructions. Wait for explicit user confirmation before proceeding to Step 4.
  > Your wallet is registered for an Agentic Wallet trading competition. Exporting the wallet will forfeit your eligibility for this competition. Please confirm whether you want to proceed with the export.
- If no entry has `joinStatus=1` → proceed directly to Step 4.

**Step 4.** Only after Step 2 and Step 3 complete, output the **Wallet Export template** (above).
