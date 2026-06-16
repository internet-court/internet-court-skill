# MEV Protection (contract-call only)

> Load when: the user requests MEV protection, or before a high-value / DEX-swap `wallet contract-call`. MEV protection is a `contract-call` flag only — `wallet send` does not support it.

The `contract-call` command supports MEV (Maximal Extractable Value) protection via the `--mev-protection` flag. When enabled, the broadcast API passes `isMEV: true` in `extraData` to route the transaction through MEV-protected channels, preventing front-running, sandwich attacks, and other MEV exploitation.

> **⚠️ Solana MEV Protection**: On Solana, enabling `--mev-protection` also **requires** the `--jito-unsigned-tx` parameter. Without it, the command will fail. This parameter provides the Jito bundle unsigned transaction data needed for Solana MEV-protected routing.

> 🚨 **Never substitute `--unsigned-tx` for `--jito-unsigned-tx`** — they are completely different parameters. If Jito bundle data is unavailable, stop and ask the user: proceed without MEV protection, or cancel.

## Supported Chains

| Chain | MEV Protection | Additional Requirements |
|---|---|---|
| Ethereum | Yes | — |
| BSC | Yes | — |
| Base | Yes | — |
| Solana | Yes | Must also pass `--jito-unsigned-tx` |
| Other chains | Not supported | — |

## When to Enable

- High-value transfers or swaps where front-running risk is significant
- DEX swap transactions executed via `contract-call`
- When the user explicitly requests MEV protection

## Usage

```bash
# EVM contract call with MEV protection (Ethereum/BSC/Base)
onchainos wallet contract-call --to 0xDef... --chain 1 --input-data 0x... --mev-protection

# Solana contract call with MEV protection (requires --jito-unsigned-tx)
onchainos wallet contract-call --to <program_id> --chain 501 --unsigned-tx <base58_tx> --mev-protection --jito-unsigned-tx <jito_base58_tx>
```
