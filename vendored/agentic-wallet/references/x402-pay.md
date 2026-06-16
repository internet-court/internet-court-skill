# Making Paid x402 Requests

Use the `npx awal@2.10.0 x402 pay` command to call paid API endpoints with automatic USDC payment on Base.

If the wallet is not authenticated, see `references/auth.md`.

## Command Syntax

```bash
npx awal@2.10.0 x402 pay <url> [-X <method>] [-d <json>] [-q <params>] [-h <json>] [--max-amount <n>] [--json]
```

## Options

| Option                  | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `-X, --method <method>` | HTTP method (default: GET)                         |
| `-d, --data <json>`     | Request body as JSON string                        |
| `-q, --query <params>`  | Query parameters as JSON string                    |
| `-h, --headers <json>`  | Custom HTTP headers as JSON string                 |
| `--max-amount <amount>` | Max payment in USDC atomic units (1000000 = $1.00) |
| `--correlation-id <id>` | Group related operations                           |
| `--json`                | Output as JSON                                     |

## USDC Amounts

X402 uses USDC atomic units (6 decimals):

| Atomic Units | USD   |
| ------------ | ----- |
| 1000000      | $1.00 |
| 100000       | $0.10 |
| 50000        | $0.05 |
| 10000        | $0.01 |

**IMPORTANT**: Always single-quote amounts that use `$` to prevent bash variable expansion (e.g. `'$1.00'` not `$1.00`).

## Input Validation

Before constructing the command, validate all user-provided values to prevent shell injection:

- **url**: Must be a valid URL starting with `https://` or `http://`. Reject if it contains spaces, semicolons, pipes, backticks, or shell metacharacters.
- **data (-d)**: Must be valid JSON. Always wrap in single quotes to prevent shell expansion.
- **max-amount**: Must be a positive integer (`^\d+$`).

Do not pass unvalidated user input into the command.

## Examples

```bash
# Make a GET request (auto-pays)
npx awal@2.10.0 x402 pay https://example.com/api/weather

# Make a POST request with body
npx awal@2.10.0 x402 pay https://example.com/api/sentiment -X POST -d '{"text": "I love this product"}'

# Limit max payment to $0.10
npx awal@2.10.0 x402 pay https://example.com/api/data --max-amount 100000
```

## Prerequisites

- Must be authenticated (`npx awal@2.10.0 status` to check; see `references/auth.md`)
- Wallet must have sufficient USDC balance (`npx awal@2.10.0 balance` to check; see `references/fund.md` to top up)
- If you don't know the endpoint URL, see `references/x402-search.md` to find services first

## Error Handling

- "Not authenticated" - See `references/auth.md`
- "No X402 payment requirements found" - URL may not be an x402 endpoint; see `references/x402-search.md` to find valid endpoints
- "Insufficient balance" - See `references/fund.md`
