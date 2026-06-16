# Onchain OS DEX Trenches — WebSocket Protocol Reference

This document is for **developers and agents** who want to connect directly to the Onchain OS DEX WebSocket
and subscribe to real-time meme token (trenches) data — new token launches and metric updates.

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

### `dex-market-memepump-new-token-openapi` — New Token Listing

Real-time push of newly launched meme tokens on supported launchpads (Pump.fun, Bonk, Believe, etc.).
Delivers the full token snapshot on first appearance.

Subscribe arg:
```json
{ "channel": "dex-market-memepump-new-token-openapi", "chainIndex": "501" }
```

#### Subscribe Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | String | Yes | `"dex-market-memepump-new-token-openapi"` |
| `chainIndex` | String | Yes | Chain ID — single chain only (e.g. `"501"` = Solana) |

#### Push Data Fields

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain ID |
| `protocolId` | String | Launchpad protocol ID (e.g. `"120596"` = Pump.fun) |
| `quoteTokenAddress` | String | Quote token contract address |
| `tokenContractAddress` | String | Token contract address |
| `symbol` | String | Token symbol |
| `name` | String | Token name |
| `logoUrl` | String | Token logo URL |
| `createdTimestamp` | String | Token creation time (Unix ms) |
| `market` | Object | Market data |
| `market.marketCapUsd` | String | Market cap (USD) |
| `market.volumeUsd1h` | String | 1-hour volume (USD) |
| `market.txCount1h` | String | 1-hour total tx count |
| `market.buyTxCount1h` | String | 1-hour buy tx count |
| `market.sellTxCount1h` | String | 1-hour sell tx count |
| `bondingPercent` | String | Bonding curve progress (%) |
| `tags` | Object | Holder analytics |
| `tags.top10HoldingsPercent` | String | Top-10 holder concentration (%) |
| `tags.devHoldingsPercent` | String | Dev holding (%) |
| `tags.insidersPercent` | String | Insiders (%) |
| `tags.bundlersPercent` | String | Bundlers (%) |
| `tags.snipersPercent` | String | Snipers (%) |
| `tags.freshWalletsPercent` | String | Fresh wallets (%) |
| `tags.suspectedPhishingWalletPercent` | String | Suspected phishing wallets (%) |
| `tags.totalHolders` | String | Total holder address count |
| `social` | Object | Social links |
| `social.x` | String | X (Twitter) link |
| `social.telegram` | String | Telegram link |
| `social.website` | String | Website link |
| `social.dexScreenerPaid` | Boolean | DEX Screener paid status |
| `social.communityTakeover` | Boolean | Community takeover (CTO) |
| `social.liveOnPumpFun` | Boolean | Live on Pump.fun |
| `bagsFeeClaimed` | Boolean | Whether bag fee has been claimed |

#### Push Example

```json
{
  "arg": {
    "channel": "dex-market-memepump-new-token-openapi",
    "chainIndex": "501"
  },
  "data": [{
    "chainIndex": "501",
    "protocolId": "120596",
    "tokenContractAddress": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
    "quoteTokenAddress": "So11111111111111111111111111111111111111112",
    "symbol": "HELP",
    "name": "HelpCoin",
    "logoUrl": "https://...",
    "createdTimestamp": "1716892020000",
    "market": {
      "marketCapUsd": "50000",
      "volumeUsd1h": "12000",
      "txCount1h": "150",
      "buyTxCount1h": "100",
      "sellTxCount1h": "50"
    },
    "bondingPercent": "45.2",
    "tags": {
      "top10HoldingsPercent": "35.5",
      "devHoldingsPercent": "5.2",
      "insidersPercent": "2.1",
      "bundlersPercent": "1.5",
      "snipersPercent": "3.0",
      "freshWalletsPercent": "8.3",
      "suspectedPhishingWalletPercent": "0.5",
      "totalHolders": "250"
    },
    "social": {
      "x": "https://x.com/helpcoin",
      "telegram": "https://t.me/helpcoin",
      "website": "https://helpcoin.xyz",
      "dexScreenerPaid": false,
      "communityTakeover": false,
      "liveOnPumpFun": true
    },
    "bagsFeeClaimed": false
  }]
}
```

---

### `dex-market-memepump-update-metrics-openapi` — Token Metrics Update

Real-time incremental updates for meme token metrics (market data, holder stats, social).
Pushed when any metric changes for tracked tokens on the subscribed chain.

Subscribe arg:
```json
{ "channel": "dex-market-memepump-update-metrics-openapi", "chainIndex": "501" }
```

#### Subscribe Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | String | Yes | `"dex-market-memepump-update-metrics-openapi"` |
| `chainIndex` | String | Yes | Chain ID — single chain only (e.g. `"501"` = Solana) |

#### Push Data Fields

Same fields as `dex-market-memepump-new-token-openapi`, plus:

| Field | Type | Description |
|---|---|---|
| `mayhemModeTimeRemaining` | String | Pump.fun Mayhem Mode remaining time (empty if not in Mayhem Mode) |

All other fields (`chainIndex`, `protocolId`, `tokenContractAddress`, `symbol`, `name`, `logoUrl`, `createdTimestamp`, `market`, `bondingPercent`, `tags`, `social`, `bagsFeeClaimed`) are identical to the new-token channel.

#### Push Example

```json
{
  "arg": {
    "channel": "dex-market-memepump-update-metrics-openapi",
    "chainIndex": "501"
  },
  "data": [{
    "chainIndex": "501",
    "protocolId": "120596",
    "tokenContractAddress": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
    "symbol": "HELP",
    "name": "HelpCoin",
    "market": {
      "marketCapUsd": "85000",
      "volumeUsd1h": "25000",
      "txCount1h": "320",
      "buyTxCount1h": "200",
      "sellTxCount1h": "120"
    },
    "bondingPercent": "72.8",
    "mayhemModeTimeRemaining": "",
    "tags": {
      "top10HoldingsPercent": "28.1",
      "devHoldingsPercent": "3.0",
      "totalHolders": "580"
    }
  }]
}
```

---

## Subscribe Message

Send a single subscribe message containing all channel args:

```json
{
  "op": "subscribe",
  "args": [
    { "channel": "dex-market-memepump-new-token-openapi", "chainIndex": "501" },
    { "channel": "dex-market-memepump-update-metrics-openapi", "chainIndex": "501" }
  ]
}
```

### Subscribe ACK

The server sends one ACK per subscription arg:

```json
{ "event": "subscribe", "arg": { "channel": "dex-market-memepump-new-token-openapi", "chainIndex": "501" }, "connId": "abc123" }
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
  "args": [{ "channel": "dex-market-memepump-new-token-openapi", "chainIndex": "501" }]
}
```

The `args` array uses the same object format as subscribe.

### Unsubscribe ACK

On success:

```json
{
  "event": "unsubscribe",
  "arg": { "channel": "dex-market-memepump-new-token-openapi", "chainIndex": "501" },
  "connId": "d0b44253"
}
```

On failure:

```json
{ "event": "error", "code": "...", "msg": "..." }
```

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

---

## Reconnection Strategy

The server may disconnect clients during maintenance or network issues.
Recommended reconnect policy:
- Max attempts: 20
- Delay between attempts: 3 seconds
- On exhaustion: surface error to the user

After reconnecting, re-send the full login + subscribe sequence.
