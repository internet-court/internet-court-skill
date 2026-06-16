---
name: integration-tests
description: Write and run integration tests against a GenLayer environment.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Integration Tests

Run contracts against a real GenLayer environment (GLSim, Studio, or testnet) with full consensus validation.

## Running Tests

```bash
# Against default network (from gltest.config.yaml)
gltest tests/integration/ -v -s

# Against specific network
gltest tests/integration/ -v -s --network localnet
gltest tests/integration/ -v -s --network studionet
gltest tests/integration/ -v -s --network testnet_bradbury
```

Always use `-v -s` for visible output during development.

## Test Pattern

```python
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

def test_full_flow():
    factory = get_contract_factory("MyContract")
    contract = factory.deploy(args=[])

    # Write methods return transaction receipts
    tx_receipt = contract.set_data(args=["hello"]).transact()
    assert tx_execution_succeeded(tx_receipt)

    # Read methods return values directly
    result = contract.get_data(args=[contract.address]).call()
    assert result == "hello"
```

`ACCEPTED` and `FINALIZED` are transaction lifecycle states, not proof that
contract execution succeeded. A transaction can be accepted and finalized with
an execution error, and failed execution applies no state changes. For deploy
transactions, failed execution means no contract is created.

Always assert `tx_execution_succeeded(receipt)` before reading state, checking
schema/code, or treating a missing contract as an infrastructure issue.

## Key Differences from Direct Mode

| | Direct Mode | Integration Tests |
|---|---|---|
| Speed | ~30ms | ~seconds to minutes |
| Server required | No | Yes (GLSim, Studio, or testnet) |
| Consensus | Leader only | Full leader + validators |
| Write methods | Return values directly | Return transaction receipts |
| Read methods | Return values directly | Use `.call()` |
| Mocking | `mock_web()` / `mock_llm()` | Real web/LLM calls |

## Write vs Read Calls

**Write methods** (state-changing):
```python
# .transact() submits and waits for consensus
tx_receipt = contract.method_name(args=[arg1, arg2]).transact()
assert tx_execution_succeeded(tx_receipt)
```

**Read methods** (view-only):
```python
# .call() reads without transaction
result = contract.view_method(args=[arg1]).call()
```

## Configuration (gltest.config.yaml)

```yaml
contract_path: contracts/

networks:
  localnet:
    # GenLayer Studio running locally
  studionet:
    # studio.genlayer.com — gasless, no funding needed (0 GEN balance is fine)
  testnet_bradbury:
    accounts:
      - "${ACCOUNT_PRIVATE_KEY_1}"
      - "${ACCOUNT_PRIVATE_KEY_2}"
```

## Test Markers

```python
import pytest

@pytest.mark.slow
def test_expensive_operation():
    """Excluded by default. Run with: gltest -m slow"""
    pass
```

## Environments

- **GLSim** (`pip install genlayer-test[sim]`, `glsim --port 4000 --validators 5`) — lightweight, no Docker, ~1s startup. Runs Python natively, not in GenVM. Good for fast iteration.
- **Studio local** (`genlayer up`) — full GenVM, real consensus, Docker required. Validates runtime compatibility.
- **studio.genlayer.com** (StudioNet) — hosted Studio, no setup, rate-limited (see Common Issues). **Gasless: no tokens required.** Accounts with 0 GEN balance can deploy and run tests normally.
- **Testnet Bradbury** — real network, requires funded accounts.

## When to Use Integration Tests

- Validating consensus (leader + validators agree)
- Testing real web requests and LLM calls
- Pre-deployment smoke tests
- Verifying contract works in actual GenVM (not just Python runner)

Direct mode should cover most logic testing. Use integration tests for final validation before deploying.

## Common Issues

### "Transaction not found" errors
Clear cache: `rm -rf .gltest_cache`

### Slow tests
Run single tests during development:
```bash
gltest tests/integration/test_file.py::test_specific -v -s
```

### JSON serialization
When working with mock validators, convert to dicts:
```python
transaction_context = {"validators": [v.to_dict() for v in mock_validators]}
```

### Studio rate limits (HTTP 429 / -32429)
`studio.genlayer.com` enforces per-IP limits: **60 req/min, 1000 req/hr, 10000 req/day**. Limits aren't permanent — once tripped, further requests are rejected until the current window resets (next minute / hour / day cycle). Throttle batch tests, run heavy suites against `localnet` (GLSim or local Studio), or pace `.transact()` calls.

`-32028` is the related pending-queue cap — **up to 32 in-flight txs per sender**; a separate cap also applies per contract to prevent flooding the shared Studio. Wait for receipts before submitting the next batch instead of firing in parallel.
