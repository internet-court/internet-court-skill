# Shared: Deposit Computation
<!-- Source: curate-v1/curate-light-skill.md §6, curate-v1/pgtcr-stake-curate-skill.md §7A–7C -->

## Hard rules

**Never quote "typical" deposits.** Deposits are governance parameters updated by registry governors;
a cached value that was correct yesterday may revert today. Always compute from live onchain reads.

**UI trap — base deposit is not the full amount.** The Curate UI shows only the base deposit
(e.g. `submissionBaseDeposit`). A transaction sending only the base deposit reverts because the
contract charges base + arbitration cost in a single `msg.value` check. Always add arbitration cost.

**Verification hierarchy:**
1. Source of truth: compute from live reads on the current chain.
2. Optional cross-check: inspect a recent successful `addItem` tx and confirm its `msg.value`
   matches your computed total. Do not use tx inspection as the primary method.

---

## Arbitration cost read

Call these three functions in order before computing any deposit:

1. `registry.arbitrator()` → `arbitratorAddress`
2. `registry.arbitratorExtraData()` → `extraDataBytes`
3. `arbitrator.arbitrationCost(extraDataBytes)` → `costInWei`

(Full IArbitrator signature: [shared-abi-fragments.md](shared-abi-fragments.md))

---

## LGTCR specifics

`msg.value` is paid in the chain's native token: ETH on Ethereum Mainnet/Sepolia, xDAI on Gnosis.

| Action | Formula |
|--------|---------|
| Submit item (`addItem`) | `submissionBaseDeposit() + arbitrationCost` |
| Remove item (`removeItem`) | `removalBaseDeposit() + arbitrationCost` |
| Challenge registration request | `submissionChallengeBaseDeposit() + arbitrationCost` |
| Challenge removal request | `removalChallengeBaseDeposit() + arbitrationCost` |

If you cannot compute the value live: stop. Do not guess or approximate.

(Scout registries use these same LGTCR deposit formulas — see scout-registries.md for Scout-specific context.)

---

## PGTCR specifics

PGTCR uses a two-asset model. **Why:** the ERC20 permanent stake is collateral (locked with the item;
stays in the contract even if the item is later removed); the native token covers the arbitrator fee.
These are separate assets flowing to separate destinations — they cannot be combined into one `msg.value`.

### Submission (`addItem`)

Step 1 — approve ERC20 stake:
```text
ERC20.approve(registryAddress, depositStake)
where depositStake >= submissionMinDeposit()
```
Read `submissionMinDeposit()` live. Submitters may stake more than the minimum — a higher stake
signals confidence and makes spam less attractive. Confirm the user understands the stake is locked.

Step 2 — call addItem with native arbitration cost:
```text
registry.addItem(itemURI, depositStake)
msg.value = arbitrator.arbitrationCost(extraData)
```

Note: PGTCR `addItem` signature is `addItem(string _item, uint256 _deposit)`. This differs from
LGTCR `addItem(string _item)`. There is no shared transaction playbook — write the tx call in each
flavor file (Phase 3).

### Challenge (`challengeItem`)

Step 1 — approve ERC20 challenge stake:
```text
challengeStake = item.stake × challengeStakeMultiplier / MULTIPLIER_DIVISOR
ERC20.approve(registryAddress, challengeStake)
```
Read `item.stake`, `challengeStakeMultiplier()`, and `MULTIPLIER_DIVISOR()` live.

Step 2 — call challengeItem with native arbitration cost:
```text
registry.challengeItem(itemID, evidenceURI)
msg.value = arbitrator.arbitrationCost(extraData)
```

---

## Appeal funding (shared — identical formula in LGTCR and PGTCR)

Compute the required total for the side you are funding:

```text
requiredForSide = appealCost + appealCost × feeStakeMultiplier / MULTIPLIER_DIVISOR
```

Select `feeStakeMultiplier` based on `currentRuling`:
- `currentRuling == 0` (no winner yet): use `sharedStakeMultiplier`
- `side == currentRuling`: use `winnerStakeMultiplier`
- `side != currentRuling`: use `loserStakeMultiplier`

**Loser half-time rule:** the losing side must fund before the halfway point of the appeal window.
Compute `midpoint = (start + end) / 2` from `arbitrator.appealPeriod(disputeID)`. If `now >= midpoint`,
the loser can no longer fund.

Read `appealCost` from `arbitrator.appealCost(disputeID, arbitratorExtraData)`.

The step-by-step `fundAppeal` algorithm (getItemInfo → getRequestInfo → getRoundInfo chain) is
deferred to the flavor-specific files (Phase 3).
