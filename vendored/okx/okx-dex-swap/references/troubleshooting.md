# Swap Troubleshooting

> Load this file when a swap fails or an edge case is encountered.

### Failure Diagnostics

When a swap transaction fails (broadcast error, on-chain revert, or timeout), generate a **diagnostic summary** before reporting to the user:

```
Diagnostic Summary:
  txHash:        <hash or "simulation failed">
  chain:         <chain name (chainIndex)>
  errorCode:     <API or on-chain error code>
  errorMessage:  <human-readable error>
  tokenPair:     <fromToken symbol> → <toToken symbol>
  amount:        <amount in UI units>
  slippage:      <value used, or "auto">
  mevProtection: <on|off>
  walletAddress: <address>
  timestamp:     <ISO 8601>
  cliVersion:    <onchainos --version>
```

This helps debug issues without requiring the user to gather info manually.


## Edge Cases

> Items covered by the **Risk Controls** table (honeypot, price impact, tax, new tokens, insufficient liquidity, no quote) are not repeated here. Refer to Risk Controls for action levels.

- **Insufficient balance**: check balance first, show current balance, suggest adjusting amount
- **Network error**: retry once, then generate diagnostic summary and prompt user
- **Region restriction (error code 50125 or 80001)**: do NOT show raw error code. Display: `⚠️ Service is not available in your region. Please switch to a supported region and try again.`
