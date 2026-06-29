---
name: nansen-holder-analysis
description: "Is this token held by quality wallets or retail noise? SM holder ratio, flow breakdown by label, and recent buyer quality."
metadata:
  openclaw:
    requires:
      env:
        - NANSEN_API_KEY
      bins:
        - nansen
    primaryEnv: NANSEN_API_KEY
    install:
      - kind: node
        package: nansen-cli
        bins: [nansen]
allowed-tools: Bash(nansen:*)
---

# Holder Quality

**Answers:** "Is this token held by quality wallets or retail noise?"

```bash
TOKEN=<address> CHAIN=ethereum

nansen research token holders --token $TOKEN --chain $CHAIN --smart-money --limit 20
# → address, address_label, value_usd, ownership_percentage, balance_change_24h/7d/30d

nansen research token flow-intelligence --token $TOKEN --chain $CHAIN
# → net_flow_usd and wallet_count per label: smart_trader, whale, exchange, fresh_wallets

nansen research token who-bought-sold --token $TOKEN --chain $CHAIN --limit 20
# → address, address_label, bought/sold_volume_usd, bought/sold_token_volume, trade_volume_usd
```

Red flag: high fresh_wallets flow + low SM holders. Green flag: Fund/Smart Trader labels in top 20.

Note: holders endpoint does not support native/wrapped tokens. Use a specific token contract address.
