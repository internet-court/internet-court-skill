# Gas Station — FAQ (Solana)

> Load on demand: read this when the user asks a Gas Station FAQ-style question (what is it / how it works / fees / supported networks-tokens / which scenarios don't trigger / why a tiny amount of SOL was received in the transaction). All answers are user-facing reply templates — render per the `<output-discipline>` rule in `gas-station.md`. Never expose internal mechanism terms.

<faq-scope>
**"Gas Station" always means the OKX Agentic Wallet feature shipped by this CLI + skill (Solana variant).** When the user asks any FAQ-style question:

- DO use the verbatim templates below.
</faq-scope>

<faq-no-extras>
**Output the template alone. Nothing before, nothing after.**

- If the template doesn't already contain the fact you want to add, the answer is: don't add it. The PRD copy is intentionally curated; extra context dilutes it.

**Do NOT layer the "never call Gas Station free" rule onto FAQ answers.** That rule governs successful broadcast replies (where a `serviceCharge` is present in the response) and does NOT mean every FAQ answer must add a service-charge caveat. Transaction-time fee disclosure happens at transaction time, not at FAQ time.

The only allowed deviation is translating the template into the user's language at output time while keeping the structure and every sentence.
</faq-no-extras>

### Q: What is Gas Station?

```
Gas Station aggregates third-party services,
  automatically comparing rates and picking the cheapest one to pay Gas for you.
  You can pay with USDT, USDC, or USDG —
  no need to hold SOL or any other native token.
  ──────────────────────────────
  Supported network and tokens: Solana (USDT, USDC, USDG)
  ──────────────────────────────
```

### Q: How does Gas Station work under the hood?

```
[Solana] Gas Station needs no account upgrade or setup.
A third-party service pays the network fee on your behalf,
and the fee is automatically deducted from the stablecoin you choose.
```

### Q: Are there extra fees for enabling Gas Station?

```
[Solana] No. Gas Station on Solana requires no account upgrade;
you can pay Gas with a stablecoin on the very first use.
```

### Q: Does each network need to be upgraded before use?

```
No. Solana has no setup step;
once Gas Station is enabled it can be used directly.
```

### Q: Which tokens can be used to pay Gas?

```
USDC, USDT, USDG. By default the token with the highest balance is used;
when balances tie, the order is USDT > USDC > USDG.
You can also pin a specific token as the default Gas token.
```

### Q: Which networks are supported?

```
Solana only, for now.
```

### Q: Which transaction types does Gas Station support?

```
Gas Station currently lets you pay gas with a stablecoin for two transaction types:
- Transfers
- Swaps
Other types (e.g. deposits, staking) are not supported yet and must pay gas with SOL.
```

### Q: Which scenarios do NOT trigger Gas Station?

```
- Native SOL transfers (Gas Station only covers SPL token transfers and contract interactions).
- Transaction types other than transfers and swaps (e.g. deposits, staking).
- Transactions sent via Jito Bundle.
- A single transaction value above 100,000 U.
- A previous Gas Station transaction is still being processed.
```

### Q: Why did I receive a small amount of SOL from this transaction?

**Render gate** — this template is **scoped to Gas Station rent-settlement transactions only**. Do NOT render on the keyword alone. Before rendering:

1. Resolve the candidate tx — use the txHash from context if the user gave one; otherwise run `onchainos wallet history --chain solana` and pick the recent SOL-inflow record(s) the user is asking about.
2. Fetch the detail — `onchainos wallet history --chain solana --tx-hash <hash>` (or `--order-id <id>`).
3. Require **both** markers on that detail:
   - `serviceChargeSymbol` ∈ {USDT, USDC, USDG}  (Gas Station settled the fee in stablecoin)
   - `networkFeeLabel == "Network fee and Rent fee"`  (rent was involved in this tx)

**Markers present** → render the template below verbatim.

**Markers absent** → do NOT render this template. The SOL inflow is unrelated to Gas Station rent. Explain from the actual tx data:
- Real swap (e.g., `USDC → SOL` in the asset change) — describe it as a normal swap result.
- Dusting (1 lamport from an unknown address, `txHash` often `null`) — Solana network noise, not user-driven, ignorable.

Do not invent a Gas Station explanation when the markers don't match.

```
[Solana] This transaction was settled via Gas Station and involves an account rent (rent):
- Within the same transaction, the Relayer first sends a small amount of SOL to cover the account rent for this transaction.
- Within the same transaction, you repay the Relayer in the stablecoin you selected (covering both the rent and the network fee).
- The small amount of SOL you ended up receiving is the leftover after the rent was paid.
```
