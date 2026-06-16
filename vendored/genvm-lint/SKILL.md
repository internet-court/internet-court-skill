---
name: genvm-lint
description: Validate GenLayer intelligent contracts with the GenVM linter.
allowed-tools:
  - Bash
  - Read
---

# GenVM Lint

Validate intelligent contracts for safety, correctness, and SDK compliance.

## Setup

Requires `genvm-linter` (included in `requirements.txt` for boilerplate projects):

```bash
pip install genvm-linter
```

## Workflow

**Always lint before testing.** Run `genvm-lint check` after writing or modifying a contract. Fix all errors before running tests.

```bash
genvm-lint check contracts/my_contract.py
```

`check` runs both lint (AST safety) and validate (SDK semantics) in one pass.

## Commands

### check (recommended)
```bash
genvm-lint check contracts/my_contract.py
genvm-lint check contracts/my_contract.py --json  # Machine-readable output
```

### lint (fast AST checks only, ~50ms)
```bash
genvm-lint lint contracts/my_contract.py
```

Catches:
- Forbidden imports (`os`, `sys`, `subprocess`, `random`, etc.)
- Non-deterministic patterns (bare `float` usage)
- Contract header structure issues

### validate (SDK semantic checks, ~200ms)
```bash
genvm-lint validate contracts/my_contract.py
```

Validates:
- Types exist in SDK (`TreeMap`, `DynArray`, `Address`, etc.)
- Decorators correctly applied (`@gl.public.view`, `@gl.public.write`)
- Storage fields have valid types (no `dict`/`list`)
- Method signatures correct

### schema (extract ABI)
```bash
genvm-lint schema contracts/my_contract.py
genvm-lint schema contracts/my_contract.py --json
genvm-lint schema contracts/my_contract.py --output abi.json
```

### typecheck (Pyright/Pylance)
```bash
genvm-lint typecheck contracts/my_contract.py
genvm-lint typecheck contracts/my_contract.py --json
genvm-lint typecheck contracts/my_contract.py --strict
```

Runs Pyright with SDK paths auto-configured. Catches type mismatches, missing attributes, undefined variables.

### download (pre-download GenVM artifacts)
```bash
genvm-lint download                    # Latest
genvm-lint download --version v0.2.12  # Specific
genvm-lint download --list             # Show cached
```

## Output Formats

### Human (default)
```
✓ Lint passed (3 checks)
✓ Validation passed
  Contract: MyContract
  Methods: 8 (5 view, 3 write)
```

### JSON (`--json`)
```json
{"ok":true,"lint":{"ok":true,"passed":3},"validate":{"ok":true,"contract":"MyContract","methods":8,"view_methods":5,"write_methods":3,"ctor_params":2}}
```

## Exit Codes

- `0` — All checks passed
- `1` — Lint or validation errors found
- `2` — Contract file not found
- `3` — SDK download failed

## Agent Workflow

When fixing lint errors iteratively:
1. Run `genvm-lint check contract.py --json`
2. Parse JSON for specific errors
3. Fix each error in the contract
4. Re-run check until `"ok": true`
5. Proceed to tests
