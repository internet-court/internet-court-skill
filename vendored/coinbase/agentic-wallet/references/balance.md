# Checking Wallet Balances

Use the `npx awal@2.10.0 balance` command to fetch token balances across chains. By default it returns balances for **USDC + the native gas token** on **Base, Polygon, and Solana** in a single call.

If the wallet is not authenticated, see `references/auth.md`. The CLI reads the address from the local wallet session — you do not pass an address argument.

## Command Syntax

```bash
npx awal@2.10.0 balance [--chain <chain>] [--asset <asset>] [--json]
```

## Options

| Option            | Description                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--chain <chain>` | Restrict output to one chain. One of `base`, `base-sepolia`, `polygon`, `solana`, `solana-devnet`. Default: all chains. |
| `--asset <asset>` | Show only one asset across the queried chain(s). One of `usdc`, `eth`, `pol`, `sol`.                                    |
| `--json`          | Emit machine-readable JSON instead of the human table.                                                                  |
| `-h, --help`      | Print built-in help.                                                                                                    |

If both `--chain` and `--asset` are omitted, the command queries every supported mainnet chain (Base, Polygon, Solana) and every native asset on each.

> **Note on `--asset`:** Although the CLI's invalid-asset error message implies a `0x` contract address is accepted, passing one currently fails checksum validation (the CLI uppercases the address). In practice, only the symbolic values `usdc`, `eth`, `pol`, `sol` work. Stick to those.

## Input Validation

Before constructing the command, validate all user-provided values to prevent shell injection:

- **chain**: Must be one of `base`, `base-sepolia`, `polygon`, `solana`, `solana-devnet`. Reject any other value.
- **asset**: Must be one of `usdc`, `eth`, `pol`, `sol`. Reject any other value.
- Reject any value containing spaces, semicolons, pipes, backticks, `$`, or other shell metacharacters.

Do not pass unvalidated user input into the command.

## Asset / Chain Compatibility

Native gas tokens are chain-specific. Behavior on unsupported asset/chain combinations is **inconsistent** — see the warnings below.

| Asset  | Available on chains                                |
| ------ | -------------------------------------------------- |
| `usdc` | base, base-sepolia, polygon, solana, solana-devnet |
| `eth`  | base, base-sepolia                                 |
| `pol`  | polygon                                            |
| `sol`  | solana, solana-devnet                              |

Token decimals: USDC = 6, ETH = 18, POL = 18, SOL = 9.

### Known CLI quirks for `--asset` on incompatible chains

- **`--asset eth` on Solana** prints a raw error inline (e.g. `Unsupported Solana asset: "ETH"`) instead of returning a clean empty `balances` object. Same for other incompatible symbolic assets on Solana.
- **`--asset pol` on Base** incorrectly returns a non-zero `POL` value that is actually the wallet's ETH balance (mislabeled). **Do not trust `pol` readings on Base** — only query `pol` with `--chain polygon`.
- **`--asset sol` on Base** has the same bug — it returns the ETH balance labeled as `SOL`. **Only query `sol` with `--chain solana` or `--chain solana-devnet`.**
- **Always pair non-USDC assets with their correct chain explicitly** (`--asset eth --chain base`, `--asset pol --chain polygon`, `--asset sol --chain solana`). Do not rely on the CLI to filter cross-chain.

## Examples

```bash
# Default — all chains, all native assets + USDC
npx awal@2.10.0 balance

# One chain only (mainnet Base)
npx awal@2.10.0 balance --chain base

# Testnet balance (Base Sepolia)
npx awal@2.10.0 balance --chain base-sepolia

# Just USDC, across every chain
npx awal@2.10.0 balance --asset usdc

# Just ETH on Base
npx awal@2.10.0 balance --chain base --asset eth

# Solana SOL balance
npx awal@2.10.0 balance --chain solana --asset sol

# Machine-readable JSON
npx awal@2.10.0 balance --json
npx awal@2.10.0 balance --chain base --asset usdc --json
```

## Output Format

### Human-readable (default)

```text
Base
────────────────────────
USDC    0.00
ETH     0.00

Polygon
────────────────────────
USDC    0.00
POL     0.00

Solana
────────────────────────
USDC    0.00
SOL     0.00

Tokens from x402 payments
────────────────────────
<SYMBOL> (<network>)  <formatted>
```

When `--chain` and `--asset` are both omitted, the CLI appends a **Tokens from x402 payments** section listing arbitrary ERC-20 tokens (by symbol and network) seen during prior `x402 pay` calls that still hold a non-zero balance. The section is omitted entirely if no such balances exist, or when filtering by `--chain` or `--asset`.

Amounts are shown in their human-readable form (e.g. `5.00` USDC, `0.0123` ETH), already converted from atomic units.

### JSON (`--json`)

When `--chain` is omitted, the response is keyed by chain id (`base`, `polygon`, `solana`, etc.):

```json
{
  "base": {
    "address": "0x27cCf9aeD0D12890D4507Ee0A5CDd876C9e3DF39",
    "chain": "Base",
    "balances": {
      "USDC": { "raw": "0", "formatted": "0.00", "decimals": 6 },
      "ETH":  { "raw": "0", "formatted": "0.00", "decimals": 18 }
    },
    "timestamp": "2026-05-07T14:56:07.571Z"
  },
  "polygon": { "...": "..." },
  "solana":  { "...": "..." }
}
```

When `--chain <chain>` is provided, the response is a single chain object (no top-level chain key):

```json
{
  "address": "0x27cCf9aeD0D12890D4507Ee0A5CDd876C9e3DF39",
  "chain": "Base",
  "balances": {
    "USDC": { "raw": "0", "formatted": "0.00", "decimals": 6 },
    "ETH":  { "raw": "0", "formatted": "0.00", "decimals": 18 }
  },
  "timestamp": "2026-05-07T14:56:07.571Z"
}
```

JSON field reference for each balance entry:

| Field       | Type   | Description                                                                                                                            |
| ----------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `raw`       | string | Atomic units as a decimal string (e.g. `"1000000"` = 1.00 USDC). Use a big-int parser; the value can exceed `Number.MAX_SAFE_INTEGER`. |
| `formatted` | string | Human-readable amount, already scaled by `decimals`.                                                                                   |
| `decimals`  | number | Number of decimals for the asset (USDC = 6, ETH/POL = 18, SOL = 9).                                                                    |

Top-level fields:

| Field       | Type   | Description                                                                                                   |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `address`   | string | The wallet address on that chain. EVM (`0x…`) for Base/Base-Sepolia/Polygon, Base58 for Solana/Solana-Devnet. |
| `chain`     | string | Display name of the chain (e.g. `"Base"`, `"Base Sepolia"`).                                                  |
| `balances`  | object | Map keyed by uppercase asset symbol (`USDC`, `ETH`, `POL`, `SOL`).                                            |
| `timestamp` | string | ISO-8601 UTC timestamp of when the balance was read.                                                          |

## Converting Between Atomic Units and Human-Readable

`raw` is in atomic units; `formatted` is the value divided by `10^decimals`.

| Asset | Decimals | Atomic example          | Human   |
| ----- | -------- | ----------------------- | ------- |
| USDC  | 6        | `1000000`               | `1.00`  |
| USDC  | 6        | `100000`                | `0.10`  |
| ETH   | 18       | `1000000000000000`      | `0.001` |
| POL   | 18       | `1000000000000000000`   | `1.00`  |
| SOL   | 9        | `1000000000`            | `1.00`  |

When passing `--max-amount` to `x402 pay`, or atomic amounts to `send`/`trade`, always use the `raw` field — never `formatted`.

## Common Use Cases

### Pre-flight before a send / trade / x402 pay

```bash
# Check whether the wallet has enough USDC on Base before paying / sending
npx awal@2.10.0 balance --chain base --asset usdc --json
```

If `formatted` is below the required amount, see `references/fund.md` to top up.

### Check spendable USDC across all chains

```bash
npx awal@2.10.0 balance --asset usdc --json
```

### Confirm gas (ETH on Base, POL on Polygon) is available before a swap

```bash
npx awal@2.10.0 balance --chain base --asset eth --json
npx awal@2.10.0 balance --chain polygon --asset pol --json
```

ETH/POL are only required when the swap or send is on that chain — most USDC sends/trades on Base are gasless via paymaster, but trades may require small ETH for gas.

### Get only the wallet address

If you only need the address (not balances), prefer the cheaper `address` command:

```bash
# Human-readable, all chains
npx awal@2.10.0 address

# Machine-readable, all chains
npx awal@2.10.0 address --json

# Single-chain (returns just the bare address string with no label)
npx awal@2.10.0 address --chain base
```

**Output shapes — important:**

- `address --json` (no `--chain`) does **not** return a structured per-chain object. It returns a single object whose `address` field is a multi-line string, e.g.:

  ```json
  { "address": "EVM (Base): 0x27cCf9aeD0D12890D4507Ee0A5CDd876C9e3DF39\nSolana: <base58-address>" }
  ```

  If you need separate EVM and Solana addresses programmatically, prefer `balance --json` and read the per-chain `address` field, or split the string on the newline and the `EVM (...): ` / `Solana: ` prefixes.

- `address --chain <chain>` prints just the raw address for that chain with no label or JSON wrapper, even without `--json`. Useful for shell substitution: `ADDR=$(npx awal@2.10.0 address --chain base)`.

## Prerequisites

- Must be authenticated (`npx awal@2.10.0 status` to check; see `references/auth.md`).
- Server reachable — `balance` calls the local wallet companion which talks to CDP.

## Error Handling

| Symptom                                                                       | Resolution                                                                                                                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Not authenticated` / `not signed in`                                         | Run the sign-in flow in `references/auth.md`.                                                                                                                             |
| Hangs on `Fetching balances...`                                               | The wallet companion may be unreachable. Run `npx awal@2.10.0 status` to verify server health.                                                                            |
| `balances` object empty for a chain                                           | The asset filter has no match on that chain (e.g. `--asset eth --chain polygon`). Drop the filter or use a supported asset.                                               |
| Inline `Unsupported Solana asset: "ETH"` (or similar) printed in output       | You passed an incompatible `--asset` for that chain (e.g. `--asset eth --chain solana`). Use a supported asset for the chain — see "Asset / Chain Compatibility" above.   |
| Non-zero `POL` on Base or `SOL` on Base                                       | CLI bug: it's reporting the ETH balance under the wrong symbol. Re-query with the correct chain (`--asset pol --chain polygon`, `--asset sol --chain solana`).            |
| `Invalid chain`                                                               | Use one of `base`, `base-sepolia`, `polygon`, `solana`, `solana-devnet`.                                                                                                  |
| `Invalid token: "<value>". Must be usdc, eth, pol, or a valid 0x address`     | Use one of `usdc`, `eth`, `pol`, `sol`. Despite the message, raw `0x` contract addresses currently fail checksum validation — stick to symbolic values.                   |

## Related References

- Top up the wallet: `references/fund.md`
- Send tokens after confirming sufficient balance: `references/send-usdc.md`
- Swap tokens: `references/trade.md`
- Pay an x402 endpoint (uses USDC on Base): `references/x402-pay.md`
