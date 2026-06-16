# Onchain OS DEX Market — WebSocket Protocol Reference

This document is for **developers and agents** who want to connect directly to the Onchain OS DEX WebSocket
and subscribe to real-time market data (prices, candlesticks).

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

### `price` — Token Price

Retrieve the latest price of a token. Data is pushed whenever there is an update.

Subscribe arg:
```json
{ "channel": "price", "chainIndex": "1", "tokenContractAddress": "0x382bb..." }
```

#### Subscribe Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | String | Yes | `"price"` |
| `chainIndex` | String | Yes | Chain ID (e.g. `"1"` = Ethereum, `"501"` = Solana) |
| `tokenContractAddress` | String | Yes | Token contract address (EVM: all lowercase) |

#### Push Data Fields

| Field | Type | Description |
|---|---|---|
| `time` | String | Unix timestamp in milliseconds |
| `price` | String | Latest token price (USD) |

#### Push Example

```json
{
  "arg": {
    "channel": "price",
    "chainIndex": "1",
    "tokenContractAddress": "0x382bb369d343125bfb2117af9c149795c6c65c50"
  },
  "data": [{
    "time": "1716892020000",
    "price": "26.458143090226812"
  }]
}
```

---

### `dex-token-candle{period}` — Candlestick

Retrieve candlestick (K-line) data for a token. Maximum push frequency: once per second.

#### Available Channel Names

| Channel | Period |
|---|---|
| `dex-token-candle1s` | 1 second |
| `dex-token-candle1m` | 1 minute |
| `dex-token-candle3m` | 3 minutes |
| `dex-token-candle5m` | 5 minutes |
| `dex-token-candle15m` | 15 minutes |
| `dex-token-candle30m` | 30 minutes |
| `dex-token-candle1H` | 1 hour |
| `dex-token-candle2H` | 2 hours |
| `dex-token-candle4H` | 4 hours |
| `dex-token-candle6H` | 6 hours |
| `dex-token-candle12H` | 12 hours |
| `dex-token-candle1D` | 1 day |
| `dex-token-candle2D` | 2 days |
| `dex-token-candle3D` | 3 days |
| `dex-token-candle5D` | 5 days |
| `dex-token-candle1W` | 1 week |
| `dex-token-candle1M` | 1 month |
| `dex-token-candle3M` | 3 months |
| `dex-token-candle6Hutc` | 6 hours (UTC) |
| `dex-token-candle12Hutc` | 12 hours (UTC) |
| `dex-token-candle1Dutc` | 1 day (UTC) |
| `dex-token-candle2Dutc` | 2 days (UTC) |
| `dex-token-candle3Dutc` | 3 days (UTC) |
| `dex-token-candle5Dutc` | 5 days (UTC) |
| `dex-token-candle1Wutc` | 1 week (UTC) |
| `dex-token-candle1Mutc` | 1 month (UTC) |
| `dex-token-candle3Mutc` | 3 months (UTC) |

Subscribe arg:
```json
{ "channel": "dex-token-candle1m", "chainIndex": "1", "tokenContractAddress": "0x382bb..." }
```

#### Subscribe Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | String | Yes | One of the candle channel names above |
| `chainIndex` | String | Yes | Chain ID (e.g. `"1"` = Ethereum, `"501"` = Solana) |
| `tokenContractAddress` | String | Yes | Token contract address (EVM: all lowercase) |

#### Push Data Fields

| Field | Type | Description |
|---|---|---|
| `ts` | String | Opening time, Unix timestamp in milliseconds |
| `o` | String | Open price |
| `h` | String | Highest price |
| `l` | String | Lowest price |
| `c` | String | Close price |
| `vol` | String | Volume in base currency |
| `volUsd` | String | Volume in USD |
| `confirm` | String | `"0"` = incomplete (still forming), `"1"` = completed |

#### Push Example

```json
{
  "arg": {
    "channel": "dex-token-candle1m",
    "chainIndex": "1",
    "tokenContractAddress": "0x382bb369d343125bfb2117af9c149795c6c65c50"
  },
  "data": [{
    "ts": "1716892020000",
    "o": "26.1",
    "h": "26.8",
    "l": "25.9",
    "c": "26.5",
    "vol": "123456.78",
    "volUsd": "3267890.12",
    "confirm": "0"
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
    { "channel": "price", "chainIndex": "1", "tokenContractAddress": "0xabc..." },
    { "channel": "dex-token-candle1m", "chainIndex": "1", "tokenContractAddress": "0xabc..." }
  ]
}
```

### Subscribe ACK

The server sends one ACK per subscription arg:

```json
{ "event": "subscribe", "arg": { "channel": "price", "chainIndex": "1", "tokenContractAddress": "0xabc..." }, "connId": "abc123" }
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
  "args": [{ "channel": "price", "chainIndex": "1", "tokenContractAddress": "0xabc..." }]
}
```

The `args` array uses the same object format as subscribe.

### Unsubscribe ACK

On success:

```json
{
  "event": "unsubscribe",
  "arg": { "channel": "price", "chainIndex": "1", "tokenContractAddress": "0x382bb369d343125bfb2117af9c149795c6c65c50" },
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
