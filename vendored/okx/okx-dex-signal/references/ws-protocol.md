# Onchain OS DEX Signal — WebSocket Protocol Reference

This document is for **developers and agents** who want to connect directly to the Onchain OS DEX WebSocket
and subscribe to real-time data.

---

## Endpoint

```
wss://wsdex.okx.com/ws/v6/dex
```

Uses TLS. Connect with any standard WebSocket client that supports TLS.

---

## Authentication

The Onchain OS DEX WebSocket uses HMAC-SHA256 API key authentication, which is the same scheme
as the OKX REST API. Full documentation:
👉 https://web3.okx.com/onchainos/dev-docs/market/websocket-login

### Credentials

Obtain your API Key, Secret Key, and Passphrase from the
[OKX Developer Portal](https://web3.okx.com/onchain-os/dev-portal).

> **Security**: Never hardcode credentials in source code. Use environment variables or a `.env` file.
> Ensure `.env` is listed in `.gitignore` — never commit it to version control.

### Login Message

After connecting, send a login message before subscribing:

```json
{
  "op": "login",
  "args": [{
    "apiKey":     "<your_api_key>",
    "passphrase": "<your_passphrase>",
    "timestamp":  "<unix_seconds_as_string>",
    "sign":       "<base64_hmac_signature>"
  }]
}
```

**Signature algorithm**:

```
prehash = timestamp + "GET/users/self/verify"
sign    = Base64( HMAC-SHA256(secret_key, prehash) )
```

- `timestamp`: current Unix time in **seconds** (string)
- `secret_key`: your Secret Key (used as the HMAC key)
- `prehash`: string concatenation of timestamp and the literal `GET/users/self/verify`

**Example (Python)**:

```python
import hmac, hashlib, base64, time

def make_sign(secret_key: str) -> tuple[str, str]:
    ts = str(int(time.time()))
    prehash = ts + "GET/users/self/verify"
    sig = base64.b64encode(
        hmac.new(secret_key.encode(), prehash.encode(), hashlib.sha256).digest()
    ).decode()
    return ts, sig

ts, sign = make_sign("YOUR_SECRET_KEY")
login_msg = {
    "op": "login",
    "args": [{"apiKey": "YOUR_API_KEY", "passphrase": "YOUR_PASSPHRASE",
              "timestamp": ts, "sign": sign}]
}
```

**Example (JavaScript/Node)**:

```js
const crypto = require('crypto');

function makeSign(secretKey) {
  const ts = String(Math.floor(Date.now() / 1000));
  const prehash = ts + 'GET/users/self/verify';
  const sign = crypto.createHmac('sha256', secretKey)
    .update(prehash).digest('base64');
  return { ts, sign };
}
```

### Login ACK

The server responds with:

```json
{ "event": "login", "code": "0", "msg": "" }
```

`code` = `"0"` means success. Any other code means failure — check `msg` for details.
Wait for this ACK before sending subscribe messages. Recommended timeout: 10 seconds.

---

## Push Message Envelope

Every push message from the server uses the same envelope structure:

```json
{ "arg": { "channel": "...", ... }, "data": [{ ... }] }
```

- `arg`: echoes back the subscription parameters (channel, chainIndex, etc.)
- `data`: array containing the actual push payload — the fields described per channel below

The "Push Data Fields" tables below describe the contents of each object inside the `data` array, **not** the top-level message.

---

## Channels

### `dex-market-new-signal-openapi` — Signal Alerts

Retrieve real-time aggregated buy signal alerts from smart money, KOL, and whale wallets.
Single-chain subscription only.

Subscribe arg:
```json
{ "channel": "dex-market-new-signal-openapi", "chainIndex": "1" }
```

#### Subscribe Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | String | Yes | `"dex-market-new-signal-openapi"` |
| `chainIndex` | String | Yes | Chain ID — single chain only (e.g. `"1"` = Ethereum, `"501"` = Solana) |

#### Push Data Fields

| Field | Type | Description |
|---|---|---|
| `timestamp` | String | Signal trigger time (Unix ms) |
| `chainIndex` | String | Chain ID |
| `token` | Object | Token info |
| `token.tokenAddress` | String | Token contract address |
| `token.symbol` | String | Token symbol |
| `token.name` | String | Token name |
| `token.logo` | String | Token logo URL |
| `token.marketCapUsd` | String | Market cap (USD) |
| `token.holders` | String | Holder address count |
| `token.top10HolderPercentage` | String | Top-10 holder concentration (%) |
| `price` | String | Token price at signal time (USD) |
| `walletType` | String | Wallet type: `"1"` = Smart Money, `"2"` = KOL/Influencer, `"3"` = Whale (comma-separated for multiple) |
| `triggerWalletCount` | String | Number of wallets that triggered the signal |
| `triggerWalletAddress` | String | Wallet addresses (comma-separated) |
| `amountUsd` | String | Total trade amount (USD) |
| `soldRatioPercentage` | String | Sell ratio (%) — lower means wallets are still holding |

#### Push Example

```json
{
  "arg": {
    "channel": "dex-market-new-signal-openapi",
    "chainIndex": "1"
  },
  "data": [{
    "timestamp": "1716892020000",
    "chainIndex": "1",
    "token": {
      "tokenAddress": "0x6982508145454ce325ddbe47a25d4ec3d2311933",
      "symbol": "PEPE",
      "name": "Pepe",
      "logo": "https://...",
      "marketCapUsd": "5200000000",
      "holders": "250000",
      "top10HolderPercentage": "45.2"
    },
    "price": "0.00001234",
    "walletType": "1",
    "triggerWalletCount": "5",
    "triggerWalletAddress": "0xabc...,0xdef...,0x123...",
    "amountUsd": "250000",
    "soldRatioPercentage": "10.5"
  }]
}
```

---

### `kol_smartmoney-tracker-activity` (Public)

Aggregated real-time trade feed from KOL wallets and smart money tracked by OKX.
No wallet address parameter needed.

Subscribe arg:
```json
{ "channel": "kol_smartmoney-tracker-activity" }
```

### `address-tracker-activity` (Per-address)

Real-time trade feed for a custom wallet address.
Send **one subscription arg per address** (up to 200 addresses per connection). If you need to track more than 200 addresses, create additional WebSocket connections.

Subscribe arg:
```json
{ "channel": "address-tracker-activity", "walletAddress": "0xYourAddress" }
```

Supports both EVM addresses (`0x...`) and Solana addresses (base58).

---

## Subscribe Message

Send a single subscribe message containing all channel args:

```json
{
  "op": "subscribe",
  "args": [
    { "channel": "kol_smartmoney-tracker-activity" },
    { "channel": "address-tracker-activity", "walletAddress": "0xAAA..." },
    { "channel": "address-tracker-activity", "walletAddress": "0xBBB..." }
  ]
}
```

### Subscribe ACK

The server sends one ACK per subscription arg:

```json
{ "event": "subscribe", "arg": { "channel": "kol_smartmoney-tracker-activity" } }
```

Wait for N ACKs (one per arg) before considering the session active.
If any arg fails, you receive:

```json
{ "event": "error", "code": "...", "msg": "..." }
```

---

## Unsubscribe Message

To cancel one or more channel subscriptions without disconnecting:

```json
{
  "op": "unsubscribe",
  "args": [{ "channel": "kol_smartmoney-tracker-activity" }]
}
```

The `args` array uses the same object format as subscribe.

### Unsubscribe ACK

On success:

```json
{
  "event": "unsubscribe",
  "arg": { "channel": "kol_smartmoney-tracker-activity" },
  "connId": "d0b44253"
}
```

On failure:

```json
{ "event": "error", "code": "...", "msg": "..." }
```

---

## Push Data Format

When a trade event occurs, the server pushes:

```json
{
  "arg": {
    "channel": "kol_smartmoney-tracker-activity"
  },
  "data": [
    {
      "walletAddress":        "0xabc...",
      "tokenSymbol":          "PEPE",
      "tokenContractAddress": "0x6982...",
      "chainIndex":           "1",
      "tokenPrice":           "0.00001234",
      "marketCap":            "520000000",
      "quoteTokenSymbol":     "USDT",
      "quoteTokenAmount":     "50000",
      "realizedPnlUsd":       "1200.5",
      "tradeType":            "1",
      "tradeTime":            "1742700000000",
      "trackerType":          [1, 2],
      "txHash":               "0xdeadbeef..."
    }
  ]
}
```

For `address-tracker-activity`, the `arg` also includes `walletAddress`:

```json
{
  "arg": {
    "channel": "address-tracker-activity",
    "walletAddress": "0xAAA..."
  },
  "data": [...]
}
```

### Trade Event Fields

| Field | Type | Description |
|---|---|---|
| `walletAddress` | String | Wallet that made the trade |
| `tokenSymbol` | String | Traded token symbol |
| `tokenContractAddress` | String | Token contract address |
| `chainIndex` | String | Chain: `"1"` = Ethereum, `"501"` = Solana, `"56"` = BSC, etc. |
| `tokenPrice` | String | Token price in USD at trade time |
| `marketCap` | String | Token market cap in USD |
| `quoteTokenSymbol` | String | Quote token (e.g. `"USDT"`, `"SOL"`, `"ETH"`) |
| `quoteTokenAmount` | String | Amount of quote token |
| `realizedPnlUsd` | String | Realized PnL for this trade (USD) |
| `tradeType` | String | `"1"` = Buy, `"2"` = Sell |
| `tradeTime` | String | Unix milliseconds |
| `trackerType` | Array\<Number\> | Wallet tags: `1` = Smart Money, `2` = KOL |
| `txHash` | String | Transaction hash (may be absent) |

---

## Heartbeat

Send `"ping"` as a plain text frame every **25 seconds**.
The server responds with `"pong"`. If no pong is received within 25 seconds, reconnect.

```
client → "ping"
server → "pong"
```

---

## Connection Lifecycle

```
1. connect (TLS WebSocket)
2. send login message
3. wait for login ACK  ← timeout 10s
4. send subscribe message
5. wait for N subscribe ACKs  ← timeout 10s
6. receive push data frames
7. send ping every 25s, expect pong
8. on disconnect: reconnect and repeat from step 1
```

### Service Upgrade Notice

Before a server upgrade, you may receive:

```json
{ "event": "notice", ... }
```

Treat this as a signal to gracefully disconnect and reconnect after a short delay.

---

## Reconnection Strategy

The server may disconnect clients during maintenance or network issues.
Recommended reconnect policy:
- Max attempts: 20
- Delay between attempts: 3 seconds
- On exhaustion: surface error to the user

After reconnecting, re-send the full login + subscribe sequence.

