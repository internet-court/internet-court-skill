# Onchain OS DEX Token — WebSocket Protocol Reference

This document is for **developers and agents** who want to connect directly to the Onchain OS DEX WebSocket
and subscribe to real-time token data (detailed price info, trades).

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

## Channels

### `price-info` — Token Price Info (Detailed)

Retrieve detailed price data including market cap, price changes, volume, liquidity, and holder count.
Maximum push frequency: once per second.

Subscribe arg:
```json
{ "channel": "price-info", "chainIndex": "1", "tokenContractAddress": "0x382bb..." }
```

#### Subscribe Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | String | Yes | `"price-info"` |
| `chainIndex` | String | Yes | Chain ID (e.g. `"1"` = Ethereum, `"501"` = Solana) |
| `tokenContractAddress` | String | Yes | Token contract address (EVM: all lowercase) |

#### Push Data Fields

| Field | Type | Description |
|---|---|---|
| `time` | String | Unix timestamp in milliseconds |
| `price` | String | Latest token price |
| `marketCap` | String | Token market capitalization (USD) |
| `priceChange5M` | String | 5-minute price change (%) |
| `priceChange1H` | String | 1-hour price change (%) |
| `priceChange4H` | String | 4-hour price change (%) |
| `priceChange24H` | String | 24-hour price change (%) |
| `volume5M` | String | 5-minute trading volume (USD) |
| `volume1H` | String | 1-hour trading volume (USD) |
| `volume4H` | String | 4-hour trading volume (USD) |
| `volume24H` | String | 24-hour trading volume (USD) |
| `txs5M` | String | 5-minute transaction count |
| `txs1H` | String | 1-hour transaction count |
| `txs4H` | String | 4-hour transaction count |
| `txs24H` | String | 24-hour transaction count |
| `maxPrice` | String | 24-hour highest price |
| `minPrice` | String | 24-hour lowest price |
| `liquidity` | String | Token liquidity in the pool (USD) |
| `circSupply` | String | Token circulating supply |
| `holders` | String | Token holder address count |
| `tradeNum` | String | 24-hour trade quantity |

#### Push Example

```json
{
  "arg": {
    "channel": "price-info",
    "chainIndex": "501",
    "tokenContractAddress": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC"
  },
  "data": [{
    "time": "1716892020000",
    "price": "0.019960839902217294",
    "marketCap": "19960839",
    "priceChange5M": "0.5",
    "priceChange1H": "-1.2",
    "priceChange4H": "3.8",
    "priceChange24H": "12.5",
    "volume5M": "50000",
    "volume1H": "250000",
    "volume4H": "1000000",
    "volume24H": "5000000",
    "liquidity": "3923952.461979153265333544895656917",
    "holders": "37241"
  }]
}
```

---

### `trades` — Recent Trades

Retrieve recent trade data. Data is pushed whenever there is a trade.

Subscribe arg:
```json
{ "channel": "trades", "chainIndex": "501", "tokenContractAddress": "HeLp6N..." }
```

#### Subscribe Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | String | Yes | `"trades"` |
| `chainIndex` | String | Yes | Chain ID (e.g. `"1"` = Ethereum, `"501"` = Solana) |
| `tokenContractAddress` | String | Yes | Token contract address (EVM: all lowercase) |

#### Push Data Fields

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique trade identifier |
| `txHashUrl` | String | On-chain transaction hash URL |
| `userAddress` | String | Address of the trader |
| `dexName` | String | DEX name where the trade occurred |
| `poolLogoUrl` | String | Pool logo URL |
| `type` | String | `"buy"` or `"sell"` |
| `changedTokenInfo` | Array | Token exchange details |
| `changedTokenInfo[].amount` | String | Token amount exchanged |
| `changedTokenInfo[].tokenSymbol` | String | Token symbol |
| `changedTokenInfo[].tokenContractAddress` | String | Token contract address |
| `price` | String | Token price at trade time |
| `volume` | String | USD value of the trade |
| `time` | String | Unix timestamp in milliseconds |
| `isFiltered` | String | `"0"` = not filtered, `"1"` = filtered for price/K-line calculation |

#### Push Example

```json
{
  "arg": {
    "channel": "trades",
    "chainIndex": "501",
    "tokenContractAddress": "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC"
  },
  "data": [{
    "id": "1739439633000!@#120!@#14731892839",
    "txHashUrl": "https://solscan.io/tx/5x...",
    "userAddress": "7xKX...",
    "dexName": "Raydium",
    "poolLogoUrl": "https://...",
    "type": "sell",
    "changedTokenInfo": [
      { "amount": "1000", "tokenSymbol": "USDC", "tokenContractAddress": "EPjF..." },
      { "amount": "50.5", "tokenSymbol": "HeLp", "tokenContractAddress": "HeLp6N..." }
    ],
    "price": "26.458143090226812",
    "volume": "519.788163",
    "time": "1739439633000",
    "isFiltered": "0"
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
    { "channel": "price-info", "chainIndex": "1", "tokenContractAddress": "0xabc..." },
    { "channel": "trades", "chainIndex": "1", "tokenContractAddress": "0xabc..." }
  ]
}
```

### Subscribe ACK

The server sends one ACK per subscription arg:

```json
{ "event": "subscribe", "arg": { "channel": "price-info", "chainIndex": "1", "tokenContractAddress": "0xabc..." }, "connId": "abc123" }
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
  "args": [{ "channel": "price-info", "chainIndex": "1", "tokenContractAddress": "0xabc..." }]
}
```

The `args` array uses the same object format as subscribe.

### Unsubscribe ACK

On success:

```json
{
  "event": "unsubscribe",
  "arg": { "channel": "price-info", "chainIndex": "1", "tokenContractAddress": "0x382bb369d343125bfb2117af9c149795c6c65c50" },
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
