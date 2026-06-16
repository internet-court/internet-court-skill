---
name: write-contract
description: Write production-quality GenLayer intelligent contracts. Always pins concrete GenVM runner version hashes and never uses local-only test/latest runner aliases. Covers equivalence principles, storage rules, LLM resilience, and cross-contract interaction.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Write Intelligent Contract

Guidance for writing GenLayer intelligent contracts that pass consensus, handle errors correctly, and survive production.

## Critical: Pin the Runner Version

All GenLayer networks reject `py-genlayer:test`, `py-genlayer:latest`, and
unversioned runner aliases. Every generated contract MUST start with a pinned
runner dependency header.

```python
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
```

`test` and `latest` are local-development aliases for GenLayer runtime
developers. They may work only in a specially configured local Studio
environment with a GenLayer developer environment variable, but they do not work
on GenLayer networks and must not appear in generated user contracts.

Before returning any contract code, verify:

- The first line is a pinned `Depends` runner version hash.
- There is no `py-genlayer:test`.
- There is no `py-genlayer:latest`.
- There is no unversioned `py-genlayer`.

Always lint with `genvm-lint check` after writing or modifying a contract.

## When to Use GenLayer

Before writing code, decide whether the feature actually needs GenLayer consensus. Recent builder feedback shows many projects start by treating GenLayer as a generic AI backend; push them toward a clear on-chain consensus role.

Use GenLayer when the contract must coordinate or settle around a subjective, external, or AI-mediated judgment that multiple validators should verify independently:

- Dispute resolution where evidence must be evaluated and the result affects escrow, payouts, reputation, or access.
- Prediction/oracle-style markets where the contract needs an independently validated outcome from external evidence.
- Compliance, moderation, or scoring workflows where the final decision must be reproducible enough for validator agreement but cannot be reduced to a simple deterministic API call.
- Autonomous agents that need transparent settlement, appeals, and auditable state transitions rather than a private off-chain decision.

Prefer a normal backend, frontend, or off-chain LLM workflow when:

- The frontend already computes the final answer and GenLayer would only rubber-stamp it.
- The contract only stores user-provided data with no validator-verifiable judgment.
- A deterministic smart contract, REST API, or database job can perform the work without AI consensus.
- The data-fetching/prompting step is not tied to an on-chain state transition, escrow, payout, or appealable decision.

For every contract, write down the boundary before implementation:

- **Frontend/backend owns:** UI, user auth, indexing, non-authoritative previews, cached market data, and convenience analytics.
- **GenLayer contract owns:** the minimum state transition that needs consensus, the evidence inputs, the validator comparison rule, the final settlement effect, and any appeal/rotation path.
- **External sources own:** raw facts or documents; do not treat them as trusted unless validators can re-fetch, normalize, and compare them.

If the boundary is unclear, create a one-page architecture note before coding: user action -> evidence source -> nondeterministic call -> equivalence principle -> state update -> user-visible settlement.

## Contract Skeleton

```python
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

class MyContract(gl.Contract):
    # Storage fields — typed, persisted on-chain
    owner: Address
    items: TreeMap[str, Item]
    item_order: DynArray[str]

    def __init__(self, param: str):
        self.owner = gl.message.sender_account

    @gl.public.view
    def get_item(self, item_id: str) -> dict:
        return {"id": item_id, "value": self.items[item_id].value}

    @gl.public.write
    def set_item(self, item_id: str, value: str) -> None:
        if gl.message.sender_account != self.owner:
            raise gl.UserError("Only owner")
        self.items[item_id] = Item(value=value)
        self.item_order.append(item_id)
```

## Runner Dependencies

The first line of a contract declares the GenVM Python runner. Always pin a
specific runner version hash. All GenLayer networks reject `test`, `latest`, and
unversioned runner aliases in generated contracts.

### Single-file Python contracts

```python
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
```

### Multi-file Python contract packages

Use `py-genlayer-multi` when the contract is packaged across multiple files.

```python
# { "Depends": "py-genlayer-multi:06zyvrlivjga0d5jlpdbprksc0pa6jmllxvp8s20hq1l512vh5yk" }
```

### Contracts using embeddings or semantic search

Add `py-lib-genlayer-embeddings` before the main Python runner with a `Seq`
block.

```python
# {
#   "Seq": [
#     { "Depends": "py-lib-genlayer-embeddings:0bmbm3cyfwxsyh454z53vxqjf47wz2q7smcqp1q4g4a6k2kidnyk" },
#     { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
#   ]
# }
```

## Equivalence Principle — Which One to Use

This is the most critical decision. Pick wrong and consensus will fail or be trivially exploitable.

### Decision Tree

```
Can validators reproduce the exact same normalized output?
├── YES → strict_eq
│         Exact match. Use when outputs are deterministic or can be
│         canonicalized (e.g., JSON with sort_keys=True).
│         Examples: blockchain RPC, stable REST APIs.
│
└── NO  → Write a custom validator function (run_nondet_unsafe)
          Default: produce independent evidence. Usually rerun the same task
          and compare decision fields, derived status, scores, or other stable
          outputs with explicit tolerances. Only skip the second answer when the
          validator can judge the leader output against source data and criteria.
```

GenLayer also provides `prompt_comparative` and `prompt_non_comparative` as convenience wrappers, but most contracts outgrow them quickly. Start with a custom validator function for full flexibility.

### Independent verification by default

For LLM and web operations, never trust the leader. The validator must verify the substance of the leader's answer using evidence other than the leader's answer alone. In practice that means one of:

- Rerun the same LLM/web task and compare the stable decision fields.
- Fetch the same source data and independently derive the status being stored.
- Run an explicit comparative LLM judgment over the leader output and validator output.
- For open-ended outputs, judge the leader output against the same input/source data and explicit criteria.

Do not write validators that only check `leader_result.calldata` for a valid JSON shape, allowed enum value, non-empty summary, or confidence in range. That is leader-output-only validation, not consensus. It trusts the leader's substantive answer 100% and only proves that the leader formatted the answer correctly.

Non-comparative validation does not mean "trust the leader." It means the validator does not produce a second candidate answer. It still must read the same input/source data and ask whether the leader output is valid under clear criteria. A summary validator, for example, should check whether the proposed summary is faithful to the article, covers the material points, avoids hallucinated facts, and satisfies length/style constraints.

Classification, scoring, extraction, authenticity decisions, safety decisions, ranking, and settlement logic almost always need comparative validation: rerun or independently derive the answer, then compare the decision field, extracted fields, score bucket, or derived status. If the validator only checks that the leader chose an allowed label such as `authentic`, `suspicious`, or `inconclusive`, the leader is deciding alone.

### strict_eq — Deterministic calls only

```python
def fetch_balance(self) -> int:
    def call_rpc():
        res = gl.nondet.web.post(rpc_url, body=payload, headers=headers)
        return json.loads(res.body.decode("utf-8"))["result"]
    return gl.eq_principle.strict_eq(call_rpc)
```

Never use for LLM calls or web pages that change between requests.

### Custom Validator Function (most common)

The default choice for non-deterministic operations. You write the leader function and a validator function with your own comparison logic. The validator should independently perform or verify the same substantive task, then compare the result fields that matter.

```python
def score_content(self, content: str) -> dict:
    def leader_fn():
        analysis = gl.nondet.exec_prompt(prompt, response_format="json")
        score = _parse_llm_score(analysis)
        return {"score": score, "analysis": str(analysis.get("analysis", ""))}

    def validator_fn(leaders_res: gl.vm.Result) -> bool:
        if not isinstance(leaders_res, gl.vm.Return):
            return _handle_leader_error(leaders_res, leader_fn)

        validator_result = leader_fn()
        leader_score = leaders_res.calldata["score"]
        validator_score = validator_result["score"]

        # Gate check: if either is zero (reject), both must agree
        if (leader_score == 0) != (validator_score == 0):
            return False

        # Tolerance: within 5x/0.5x bounds
        if leader_score > 0 and validator_score > 0:
            ratio = leader_score / validator_score
            if ratio > 5.0 or ratio < 0.2:
                return False

        return True

    return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```

### Convenience Wrappers

`prompt_comparative` reruns the task and sends both outputs to an LLM with your principle string. `prompt_non_comparative` does not rerun the task; it asks validators to judge the leader output against input data and criteria. Both are convenient for prototyping but limited - for most production contracts, prefer a custom validator function with explicit comparison logic.

Prefer `prompt_comparative` unless you can explain why independently doing the task again would be meaningless and how the validator will still verify the leader output against source data. If the only reason is "outputs may differ," compare the decision fields, normalize the output, derive a status, or use tolerance instead of dropping comparison entirely.

```python
def resolve(self) -> str:
    def analyze():
        page = gl.get_webpage(url, mode="text")
        return gl.exec_prompt(f"Analyze: {page}\nReturn JSON with outcome and reasoning.")

    return gl.eq_principle.prompt_comparative(
        analyze,
        principle="`outcome` field must be exactly the same. All other fields must be similar.",
    )
```

## Error Classification

Classify errors so validators know how to compare them. This is critical for consensus on failure paths.

```python
ERROR_EXPECTED  = "[EXPECTED]"   # Business logic (deterministic) — exact match required
ERROR_EXTERNAL  = "[EXTERNAL]"   # External API 4xx (deterministic) — exact match required
ERROR_TRANSIENT = "[TRANSIENT]"  # Network/5xx (non-deterministic) — agree if both transient
ERROR_LLM       = "[LLM_ERROR]"  # LLM misbehavior — always disagree, force rotation
```

### Canonical error handler for validators

```python
def _handle_leader_error(leaders_res, leader_fn) -> bool:
    leader_msg = leaders_res.message if hasattr(leaders_res, 'message') else ''
    try:
        leader_fn()
        return False  # Leader errored, validator succeeded — disagree
    except gl.vm.UserError as e:
        validator_msg = e.message if hasattr(e, 'message') else str(e)
        # Deterministic errors: must match exactly
        if validator_msg.startswith(ERROR_EXPECTED) or validator_msg.startswith(ERROR_EXTERNAL):
            return validator_msg == leader_msg
        # Transient: agree if both hit transient failure
        if validator_msg.startswith(ERROR_TRANSIENT) and leader_msg.startswith(ERROR_TRANSIENT):
            return True
        # LLM or unknown: disagree — forces consensus retry
        return False
    except Exception:
        return False
```

### Applying error prefixes

```python
# Web requests
if response.status >= 400 and response.status < 500:
    raise gl.vm.UserError(f"{ERROR_EXTERNAL} API returned {response.status}")
elif response.status >= 500:
    raise gl.vm.UserError(f"{ERROR_TRANSIENT} API temporarily unavailable")

# LLM responses
if not isinstance(analysis, dict):
    raise gl.vm.UserError(f"{ERROR_LLM} LLM returned non-dict: {type(analysis)}")

# Business logic
if user_balance < amount:
    raise gl.vm.UserError(f"{ERROR_EXPECTED} Insufficient balance")
```

## Storage Rules

### Types — use GenLayer types, not Python builtins

| Python | GenLayer | Notes |
|--------|----------|-------|
| `dict` | `TreeMap[K, V]` | O(log n) lookup, persisted |
| `list` | `DynArray[T]` | Dynamic array, persisted |
| `int` | `u256` / `i256` | Sized integers for on-chain math |
| `float` | use with care | See float guidance below |
| `enum` | `str` | Store `.value`, not the enum itself |

### Floats

- **In nondet blocks**: native floats work, but they're inherently non-deterministic (hardware differences cause rounding variation). Handle this in your validator logic with tolerances or rounding before comparison.
- **In deterministic blocks**: floats are software-emulated — deterministic but slower.
- **For cross-chain interop / money**: use `u256` with atto-scale (value × 10^18) — this is standard across all blockchains.

### Dataclasses for complex state

```python
@allow_storage
@dataclass
class Item:
    name: str
    status: str          # Use str, not Enum
    atto_amount: u256    # Atto-scale (value * 10^18) for money
    created_at: str      # ISO format string
    tags: DynArray[str]
```

### Declaration rules

- **Storage fields are class-level type annotations** — NOT assignments in `__init__`. The type annotation declares the storage slot; `__init__` only sets initial values.

```python
class MyContract(gl.Contract):
    owner: Address            # ← storage field (class-level annotation)
    items: DynArray[str]      # ← storage field
    count: u256               # ← storage field

    def __init__(self):
        self.owner = gl.message.sender_address   # ← initial value only
        # DynArray/TreeMap don't need initialization — they start empty
```

Wrong:
```python
def __init__(self):
    self.owner: Address = gl.message.sender_address  # ← NOT a storage field!
    self.items = []                                    # ← list is not a storage type
```

### Layout rules

- **Append new fields at END only** if using upgradable contracts. Storage layout is order-sensitive — reordering or inserting fields breaks deployed contracts. See the upgradability docs for details.
- **Default values for new fields** — existing storage reads zero/empty for fields added after deployment.
- **Initialize DynArray/TreeMap by appending** in `__init__`, not by assignment. `self.items = [x]` does not work.
- **O(1) stat indexes** — maintain a `TreeMap[str, u256]` counter alongside collections for fast counts.
- **Complex data in DynArray** — for storing structured data (dicts, nested objects), serialize to JSON string: `DynArray[str]` with `json.dumps()`/`json.loads()`.

## LLM Resilience

LLMs return unpredictable formats. Always defensively parse.

```python
def _parse_llm_score(analysis: dict) -> int:
    """Extract numeric score from LLM response, handling common variations."""
    if not isinstance(analysis, dict):
        raise gl.vm.UserError(f"{ERROR_LLM} Non-dict response: {type(analysis)}")

    # Key aliasing — LLMs use alternate names
    raw = analysis.get("score")
    if raw is None:
        for alt in ("rating", "points", "value", "result"):
            if alt in analysis:
                raw = analysis[alt]
                break

    if raw is None:
        raise gl.vm.UserError(f"{ERROR_LLM} Missing 'score'. Keys: {list(analysis.keys())}")

    # Coerce aggressively — handles int, float, "3", "3.5", whitespace
    try:
        return max(0, int(round(float(str(raw).strip()))))
    except (ValueError, TypeError):
        raise gl.vm.UserError(f"{ERROR_LLM} Non-numeric score: {raw}")
```

### JSON cleanup from LLM output

```python
def _parse_json(text: str) -> dict:
    """Clean LLM JSON: strip wrapping text, fix trailing commas."""
    import re
    first = text.find("{")
    last = text.rfind("}")
    text = text[first:last + 1]
    text = re.sub(r",(?!\s*?[\{\[\"\'\w])", "", text)  # Remove trailing commas
    return json.loads(text)
```

### Always use response_format="json"

```python
result = gl.nondet.exec_prompt(task, response_format="json")
```

This tells the LLM to return JSON. Still validate and clean — LLMs don't always comply.

## Agentic Pattern — LLM-Generated Code + Deterministic Eval

LLMs can't reliably inspect characters in their input (they hallucinate em dashes, miscount characters, etc.). But they CAN generate correct Python code for these checks. Use `eval()` inside `spawn_sandbox()` to run LLM-generated code deterministically, then feed results back as ground truth.

```python
def check_rules(self, text: str, rules: str) -> dict:
    def run():
        # Step 1: LLM generates Python checks from natural language rules
        checks = gl.nondet.exec_prompt(
            f"""Generate Python expressions to verify these rules.
Variable `text` contains the post. Skip subjective rules.
Rules: {rules}
Output JSON: {{"checks": [{{"rule": "...", "expression": "..."}}]}}""",
            response_format="json",
        ).get("checks", [])

        # Step 2: eval() all checks in one sandbox — deterministic, no hallucination
        def eval_checks():
            results = []
            for c in checks:
                try:
                    ok = eval(c["expression"], {
                        "__builtins__": {"len": len, "any": any, "all": all, "str": str},
                        "text": text,
                    })
                    results.append({"rule": c["rule"], "result": "SATISFIED" if ok else "VIOLATED"})
                except Exception:
                    pass  # skip broken expressions, let LLM handle the rule
            return results

        check_results = gl.vm.unpack_result(gl.vm.spawn_sandbox(eval_checks))

        # Step 3: LLM scores with ground truth — can't hallucinate what code already verified
        ground_truth = "\n".join(f"- {r['rule']}: {r['result']}" for r in check_results)
        score = gl.nondet.exec_prompt(
            f"""GROUND TRUTH (from code — do NOT override): {ground_truth}
For rules not listed, use your judgment.
Post: {text}  Rules: {rules}
Output: {{"analysis": "...", "passed": true/false}}""",
            response_format="json",
        )

        return {"passed": score.get("passed", False), "analysis": score.get("analysis", ""), "checks": check_results}

    return gl.eq_principle.prompt_comparative(run, "Must agree on passed/failed and same rule violations")
```

When to use: any contract where rules are specified in natural language and include character-level or format checks that LLMs are unreliable at (specific punctuation, character counts, URL presence, hashtag limits, etc.).

## Cross-Contract Interaction

### Read from another contract (synchronous)

```python
other = gl.get_contract_at(Address(other_address))
value = other.view().get_data()
```

### Write to another contract (asynchronous)

```python
other = gl.get_contract_at(Address(other_address))
other.emit(on="accepted").process_data(payload)  # Non-blocking
```

`emit()` queues the call — it executes after current transaction. Use `on="accepted"` (fast) or `on="finalized"` (safe).

**Warning:** If the current transaction is appealed after `emit()`, the emitted call still happens but the balance may already be decremented.

### Factory pattern — deploy child contracts

```python
def __init__(self, num_workers: int):
    with open("/contract/Worker.py", "rt") as f:
        worker_code = f.read()

    for i in range(num_workers):
        addr = gl.deploy_contract(
            code=worker_code.encode("utf-8"),
            args=[i, gl.message.contract_address],
            salt_nonce=i + 1,
            on="accepted",
        )
        self.worker_addresses.append(addr)
```

Workers are immutable after deployment. Code changes require redeploying the factory.

### Cross-chain RPC verification

```python
def verify_deposit(self, rpc_url: str, contract_addr: str, call_data: bytes) -> bytes:
    """Verify state on another chain via eth_call."""
    payload = {
        "jsonrpc": "2.0", "id": 1,
        "method": "eth_call",
        "params": [{"to": contract_addr, "data": "0x" + call_data.hex()}, "latest"],
    }

    def fetch():
        res = gl.nondet.web.post(rpc_url, body=json.dumps(payload).encode(),
                                  headers={"Content-Type": "application/json"})
        if res.status != 200:
            raise gl.vm.UserError(f"{ERROR_EXTERNAL} RPC failed: {res.status}")
        data = json.loads(res.body.decode("utf-8"))
        if "error" in data:
            raise gl.vm.UserError(f"{ERROR_EXTERNAL} RPC error: {data['error']}")
        hex_result = data.get("result", "0x")[2:]
        return bytes.fromhex(hex_result) if hex_result else b""

    return gl.eq_principle.strict_eq(fetch)
```

## Web Requests

### Extracting stable fields for consensus

External APIs return variable data (timestamps, counts). Extract only stable fields:

```python
def leader_fn():
    res = gl.nondet.web.get(api_url)
    data = json.loads(res.body.decode("utf-8"))
    # Only return fields that won't change between leader and validator calls
    return {"id": data["id"], "login": data["login"], "status": data["status"]}
    # NOT: follower_count, updated_at, online_status
```

### Deriving status from variable data

When raw data may differ (e.g., CI check counts change), compare derived summaries:

```python
def validator_fn(leaders_res: gl.vm.Result) -> bool:
    validator_checks = leader_fn()

    def derive(checks):
        if not checks: return "pending"
        for c in checks:
            if c.get("conclusion") != "success": return "failing"
        return "success"

    return derive(leaders_res.calldata) == derive(validator_checks)
```

## Anti-Patterns

| Don't | Do Instead | Why |
|-------|-----------|-----|
| `py-genlayer:test`, `py-genlayer:latest`, or unversioned `py-genlayer` | Pin the documented runner version hash | All GenLayer networks reject runner aliases and unpinned dependencies |
| `strict_eq()` for LLM calls | Custom validator function | LLM outputs are non-deterministic — strict_eq always fails consensus |
| Store `list` or `dict` | `DynArray[T]` or `TreeMap[K, V]` | Python builtins aren't persistable |
| Use native `float` for money | Atto-scale `u256` (value * 10^18) | Standard across blockchains for cross-chain interop |
| Insert fields in the middle of a dataclass | Append at END only (for upgradable contracts) | Storage layout is positional — insertion shifts all subsequent fields |
| Store `Enum` directly | Store `enum.value` as `str` | Enum type not supported in storage |
| Ignore LLM response format | Validate type, sanitize JSON, alias keys | LLMs return unpredictable formats |
| Schema-only or leader-output-only validator for LLM/web output | Rerun the task, independently derive the result, or verify against source data | Format checks prove only that JSON is well-formed; they do not verify the leader's answer |
| `prompt_non_comparative` for classification/scoring/extraction decisions | Comparative validator with field-level comparison or tolerance | Decisions need agreement on the substantive result; allowed-label checks let one leader decide alone |
| Let validator agree on LLM errors | Return `False` (disagree) to force rotation | Agreeing on broken LLM output locks bad state |
| Use bare `Exception` in contracts | Use `gl.vm.UserError` with error prefix | Bare exceptions become unrecoverable VMError |
| Compare variable API fields in validators | Extract stable fields or derive status | Timestamps, counts change between calls |
| O(n) scans over large collections | Maintain TreeMap indexes for O(1) lookups | Transactions have compute limits |

## Testing Strategy

1. **Lint first**: `genvm-lint check contracts/my_contract.py`
2. **Direct mode tests**: Fast (30ms), no server. Tests business logic, validation, state transitions. Validator logic NOT exercised.
3. **Integration tests**: Slow (seconds-minutes), full consensus. Tests validator agreement, real web/LLM calls. Run before deployment.
