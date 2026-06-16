---
name: genlayer-cli
description: Use the GenLayer CLI to deploy, interact with, and debug intelligent contracts.
allowed-tools:
  - Bash
  - Read
---

# GenLayer CLI

The `genlayer` CLI manages contract deployment, interaction, transaction inspection, and network configuration. Works with GenLayer Studio (local), studio.genlayer.com, and Testnet Bradbury.

## Setup

```bash
npm install -g genlayer
```

## Network Configuration

```bash
genlayer network set                    # Interactive selector
genlayer network set testnet-bradbury   # Direct
genlayer network info                   # Show current network config
genlayer network list                   # List all networks
```

Networks: `localnet`, `studionet`, `testnet-asimov`, `testnet-bradbury`

**Note**: `studionet` is gasless — no tokens are required to deploy or interact with contracts. A 0 GEN balance is expected and does not prevent any operations.

**Note**: `studionet` is rate-limited per IP — **60 req/min, 1000 req/hr, 10000 req/day**. Limits aren't permanent — batching many `deploy`/`write` calls trips `-32429` / HTTP 429 and further requests are rejected until the window resets (next minute / hour / day cycle). `-32028` signals the pending-queue cap — **up to 32 in-flight txs per sender**; a separate cap also applies per contract. Throttle batch scripts, wait for receipts between submissions, or use `localnet` for heavy batches.

**Always use `genlayer network set` instead of `--rpc`** for built-in networks. The `--rpc` flag bypasses the chain configuration (consensus contract ABI, `isStudio` flag, etc.) and will cause transaction polling failures. Only use `--rpc` for custom/private networks not in the built-in list.

## Account Management

```bash
genlayer account                        # Show active account (address, balance, network)
genlayer account list                   # List all accounts
genlayer account create --name dev1     # Create new account
genlayer account use dev1               # Set active account
genlayer account unlock                 # Cache key in OS keychain (no password prompts)
genlayer account lock                   # Remove from keychain

# Import from private key or keystore
genlayer account import --name imported --private-key 0x...
genlayer account import --name imported --keystore ./keystore.json

# Send tokens
genlayer account send 0x123...abc 10gen
```

Amount formats: `"10gen"`, `"0.5gen"`, or raw wei `"1000000000000000000"`

### Non-interactive usage (CI/CD, containers, agents)

`account create`, `account import`, and `account send` accept `--password <password>` to skip interactive prompts:

```bash
genlayer account create --name dev1 --password "mypassword"
genlayer account import --name imported --private-key 0x... --password "mypassword"
```

`account unlock` requires an OS keychain (macOS Keychain, GNOME Keyring, etc.) and will fail in headless containers. When the account is locked, commands that sign transactions (`deploy`, `write`, `appeal`, `account send`) will prompt for the keystore password. To automate these, pipe the password via stdin:

```bash
echo "mypassword" | genlayer deploy --contract contracts/my_contract.py --args "arg1"
```

## Funding Accounts

New accounts start with 0 GEN. Funding requirements depend on the network:

**StudioNet is gasless** — accounts with 0 GEN can deploy and interact with contracts without any funding. A zero balance on StudioNet is expected and normal. Skip funding entirely when using StudioNet.

For **testnets** (Bradbury, Asimov), fund the account before deploying or writing.

**Faucet**: [https://testnet-faucet.genlayer.foundation/](https://testnet-faucet.genlayer.foundation/)

1. Get your address: `genlayer account` -> copy the `address` field
2. Go to the faucet URL, paste the address, and claim 100 GEN (once per 24 hours)
3. Verify: `genlayer account` should show the updated balance

The faucet uses Cloudflare Turnstile and cannot be automated from CLI -- the user must claim manually in a browser. Works for both Testnet Bradbury and Testnet Asimov.

## Contract Deployment

```bash
# Deploy a specific contract
genlayer deploy --contract contracts/my_contract.py
genlayer deploy --contract contracts/my_contract.py --args "arg1" 42

# Run all deploy scripts in deploy/ folder
genlayer deploy
```

## Contract Interaction

### Read (no transaction)
```bash
genlayer call <address> <method>
genlayer call 0x123...abc get_data --args "key1"
```

### Write (sends transaction)
```bash
genlayer write <address> <method>
genlayer write 0x123...abc set_data --args "hello"
```

### Inspect contract
```bash
genlayer schema <address>   # Method signatures and types
genlayer code <address>     # Source code
```

## Transaction Debugging

The most useful debugging command — inspect what happened in a transaction:

```bash
# Get full receipt (waits for FINALIZED by default)
genlayer receipt <txHash>

# Get just stdout or stderr from execution
genlayer receipt <txHash> --stdout
genlayer receipt <txHash> --stderr

# Wait for a lifecycle status
genlayer receipt <txHash> --status PENDING
genlayer receipt <txHash> --status ACCEPTED
genlayer receipt <txHash> --status FINALIZED

# Custom retry behavior
genlayer receipt <txHash> --retries 50 --interval 3000
```

Transaction lifecycle statuses: `SUBMITTED` -> `PENDING` -> `ACCEPTED` -> `FINALIZED`

### Lifecycle status is not execution success

`ACCEPTED` and `FINALIZED` mean the network accepted or finalized the transaction
outcome. They do not mean the contract code executed successfully.

If contract execution fails, the transaction can still become `ACCEPTED` and
later `FINALIZED`, but state changes are not applied. For deploy transactions,
that means no contract is created. In that case, `genlayer code`,
`genlayer schema`, `eth_getCode`, or `gen_getContractSchema` returning no
contract is expected.

Always inspect the receipt execution result before diagnosing infrastructure:

1. Run `genlayer receipt <txHash> --stdout --stderr`.
2. Check whether execution succeeded or failed.
3. If execution failed, fix the contract/runtime error first.
4. Treat missing code/schema as a possible RPC, indexer, or state-read issue only
   when the receipt shows execution success.

| Observation | Likely meaning |
|-------------|----------------|
| `ACCEPTED`/`FINALIZED` + execution error + no code/schema | Expected failed deploy; fix the contract or runtime error |
| `ACCEPTED`/`FINALIZED` + execution success + no code/schema | Possible RPC, indexer, or state-read issue |
| `PENDING`, missing receipt, or transaction not found | Polling, network, or transaction propagation issue |

## Appeal a Transaction

Challenge a transaction result to trigger re-evaluation by validators:

```bash
genlayer appeal <txHash>
```

## Local Studio Management

```bash
genlayer init                               # Initialize environment
genlayer init --numValidators 10 --headless  # Customize
genlayer up                                 # Start Studio
genlayer up --reset-db                      # Fresh start
genlayer stop                               # Stop all services
```

### Local Validator Management

```bash
genlayer localnet validators get                          # List all
genlayer localnet validators count                        # Count
genlayer localnet validators create --stake 50            # Add one
genlayer localnet validators create-random --count 3      # Add multiple
genlayer localnet validators update 0x... --model gpt-4   # Change model
genlayer localnet validators delete --address 0x...       # Remove
```

## Debugging Workflow

When a transaction fails or produces unexpected results:

1. **Get the receipt**: `genlayer receipt <txHash> --stdout --stderr`
2. **Check execution result**: lifecycle status alone is not enough; `ACCEPTED`/`FINALIZED` can contain execution errors
3. **Check contract schema**: `genlayer schema <address>` (verify method exists, correct args)
4. **Read contract source**: `genlayer code <address>` (verify deployed code matches local)
5. **Try a read call**: `genlayer call <address> <view_method>` (check current state)
6. **Appeal if needed**: `genlayer appeal <txHash>` (re-run consensus)

## Project Scaffolding

```bash
genlayer new myproject          # Create from template
genlayer new myproject --path ./projects/
```

## Configuration

```bash
genlayer config get                         # Show all config
genlayer config get network                 # Specific key
genlayer config set network=testnet-bradbury
genlayer config reset network               # Restore default
```
