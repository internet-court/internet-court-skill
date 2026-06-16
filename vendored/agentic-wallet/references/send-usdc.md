# Sending Tokens

Use the `npx awal@2.10.0 send` command to transfer tokens from the wallet to any address on Base, Polygon, or Solana.

If the wallet is not authenticated, see `references/auth.md`.

## Command Syntax

```bash
npx awal@2.10.0 send <amount> <recipient> [--chain <chain>] [--asset <asset>] [--json]
```

## Arguments

| Argument    | Description                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `amount`    | Amount to send: '$1.00', '1.00', or atomic units (1000000 = $1). Always single-quote amounts that use `$` to prevent bash variable expansion. If the number looks like atomic units (no decimal or > 100), treat as atomic units. Assume that people won't be sending more than 100 USDC the majority of the time |
| `recipient` | Ethereum address (0x...), ENS name (vitalik.eth), or Solana address (Base58)                                                                                                                                                         |

## Options

| Option             | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `--chain <name>`   | Blockchain network: base, polygon, solana (default: base)           |
| `--asset <symbol>` | Token to send: usdc, eth, pol, sol (default: usdc)                  |
| `--json`           | Output result as JSON                                               |

## Input Validation

Before constructing the command, validate all user-provided values to prevent shell injection:

- **amount**: Must match `^\$?[\d.]+$` (digits, optional decimal point, optional `$` prefix). Reject if it contains spaces, semicolons, pipes, backticks, or other shell metacharacters.
- **recipient**: Must be a valid `0x` hex address (`^0x[0-9a-fA-F]{40}$`), an ENS name (`^[a-zA-Z0-9.-]+\.eth$`), or a Solana address (`^[1-9A-HJ-NP-Za-km-z]{32,44}$`). Reject any value containing spaces or shell metacharacters.
- **chain**: Must be one of `base`, `polygon`, `solana`. Reject any other value.
- **asset**: Must be one of `usdc`, `eth`, `pol`, `sol`. Reject any other value.

Do not pass unvalidated user input into the command.

## Examples

```bash
# Send $1.00 USDC to an address on Base (default)
npx awal@2.10.0 send 1 0x1234...abcd

# Send $0.50 USDC to an ENS name
npx awal@2.10.0 send 0.50 vitalik.eth

# Send with dollar sign prefix (note the single quotes)
npx awal@2.10.0 send '$5.00' 0x1234...abcd

# Send ETH on Base
npx awal@2.10.0 send 0.01 0x1234...abcd --asset eth

# Send USDC on Polygon
npx awal@2.10.0 send 1 0x1234...abcd --chain polygon

# Send USDC to a Solana address
npx awal@2.10.0 send 1 AxW7...5fGz --chain solana

# Get JSON output
npx awal@2.10.0 send 1 vitalik.eth --json
```

## ENS Resolution

ENS names are automatically resolved to addresses via Ethereum mainnet. The command will:

1. Detect ENS names (any string containing a dot that isn't a hex address)
2. Resolve the name to an address
3. Display both the ENS name and resolved address in the output

## Prerequisites

- Must be authenticated (`npx awal@2.10.0 status` to check; see `references/auth.md`)
- Wallet must have sufficient balance (`npx awal@2.10.0 balance` to check; see `references/fund.md` to top up)

## Error Handling

Common errors:

- "Not authenticated" - See `references/auth.md`
- "Insufficient balance" - Check balance with `npx awal@2.10.0 balance`; see `references/fund.md`
- "Could not resolve ENS name" - Verify the ENS name exists
- "Invalid recipient" - Must be valid 0x address, ENS name, or Solana Base58 address
- "SOL only supported on Solana chains" - Use `--chain solana` when sending SOL
- "ETH/POL only supported on EVM chains" - ETH on base, POL on polygon
