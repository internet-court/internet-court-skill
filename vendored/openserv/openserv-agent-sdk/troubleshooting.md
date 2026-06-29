# OpenServ SDK Troubleshooting

Common issues and solutions.

---

## "OpenServ API key is required"

**Error:** `Error: OpenServ API key is required. Please provide it in options, set OPENSERV_API_KEY environment variable, or call provision() first.`

**Cause:** The agent was started without credentials being set up.

**Solution:** Pass the agent instance to `provision()` for automatic credential binding:

```typescript
const agent = new Agent({ systemPrompt: '...' })
agent.addCapability({ ... })

await provision({
  agent: {
    instance: agent,  // Binds credentials directly to agent (v2.1+)
    name: 'my-agent',
    description: '...'
  },
  workflow: { ... }
})
await run(agent)  // Credentials already bound
```

The `provision()` function creates the wallet, API key, and auth token on first run. When you pass `agent.instance`, it calls `agent.setCredentials()` automatically, so you don't need to rely on environment variables.

---

## Port already in use (EADDRINUSE)

```bash
lsof -ti:7378 | xargs kill -9
```

Or set a different port in `.env`: `PORT=7379`

---

## "OPENSERV_AUTH_TOKEN is not set" warning

This is a security warning. The `provision()` function auto-generates this token. If missing, re-run provision or manually generate:

```typescript
const { authToken, authTokenHash } = await client.agents.generateAuthToken()
await client.agents.saveAuthToken({ id: agentId, authTokenHash })
// Save authToken to .env as OPENSERV_AUTH_TOKEN
```

---

## Trigger not firing

1. Check workflow is running: `await client.workflows.setRunning({ id: workflowId })`
2. Check trigger is active: `await client.triggers.activate({ workflowId, id: triggerId })`
3. Verify the trigger is connected to the task in the workflow graph

---

## Tunnel connection issues

The `run()` function connects via WebSocket to `agents-proxy.openserv.ai`. If connection fails:

1. Check internet connectivity
2. Verify no firewall blocking WebSocket connections
3. The agent retries with exponential backoff (up to 10 retries)

For production, set `DISABLE_TUNNEL=true` and use `run(agent)` — it will start only the HTTP server without the WebSocket tunnel. The platform reaches your agent directly at its public `endpointUrl`.

To force tunnel mode even when `endpointUrl` is configured, set `FORCE_TUNNEL=true`.

---

## OpenAI API errors (process() only)

`OPENAI_API_KEY` is only needed if you use the `process()` method for direct OpenAI calls. Most agents don't need it—use **runless capabilities** or `generate()` instead, which delegate LLM calls to the platform (no API key required).

If you do use `process()`:

- Verify `OPENAI_API_KEY` is set correctly
- Check API key has credits/billing enabled
- SDK requires `openai@^5.x` as a peer dependency

---

## ERC-8004 registration fails with "insufficient funds"

**Error:** `ContractFunctionExecutionError: insufficient funds for transfer`

**Cause:** The wallet created by `provision()` has no ETH on Base mainnet to pay gas.

**Solution:** Fund the wallet address logged during provisioning (`Created new wallet: 0x...`) with a small amount of ETH on Base. Always wrap `registerOnChain` in a try/catch so the agent can still start via `run(agent)`.

---

## ERC-8004 registration fails with 401 Unauthorized

**Error:** `AxiosError: Request failed with status code 401` during `client.authenticate()`

**Cause:** `WALLET_PRIVATE_KEY` is empty. `provision()` writes it to `.env` at runtime, but `process.env` already loaded the empty value at startup.

**Solution:** Use `dotenv` programmatically and reload after `provision()`:

```typescript
import dotenv from 'dotenv'
dotenv.config()

// ... provision() ...

dotenv.config({ override: true }) // reload to pick up WALLET_PRIVATE_KEY
```

Do **not** use `import 'dotenv/config'` — it only loads `.env` once at import time and cannot be reloaded.

---

## 401 Unauthorized when using PlatformClient for debugging

**Error:** `AxiosError: Request failed with status code 401` when calling `client.tasks.list()` or other `PlatformClient` methods.

**Cause:** You are using the **agent** API key (`OPENSERV_API_KEY`) instead of the **user** API key. These are different:

- **`OPENSERV_API_KEY`** — The agent's API key, set by `provision()`. Used internally by the agent to authenticate with the platform when receiving tasks. **Cannot** be used with `PlatformClient` for management calls.
- **`OPENSERV_USER_API_KEY`** — Your user/account API key. Required for `PlatformClient` calls like listing tasks, managing workflows, etc.

**Solution:** Authenticate `PlatformClient` using your wallet (recommended) or your user API key:

```typescript
// Option 1: Wallet authentication (recommended — uses the wallet from provision)
const client = new PlatformClient()
await client.authenticate(process.env.WALLET_PRIVATE_KEY)

// Option 2: User API key (from platform dashboard, NOT the agent key)
const client = new PlatformClient({
  apiKey: process.env.OPENSERV_USER_API_KEY // NOT OPENSERV_API_KEY
})
```

**Tip:** After `provision()` runs, the `WALLET_PRIVATE_KEY` is stored in `.env`. Use `dotenv.config({ override: true })` to reload it if needed (see the ERC-8004 401 section above).

---

## ESM / CommonJS import errors

**Error:** `SyntaxError: Named export 'Agent' not found` or `ERR_REQUIRE_ESM` or similar module resolution errors.

**Cause:** Mismatch between your project's module system and how you import the packages.

**Solution:** The recommended setup is ESM (`"type": "module"` in `package.json`) with `tsx` as the runtime:

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx src/agent.ts"
  }
}
```

```bash
npm i -D tsx typescript @types/node
```

Use standard ESM imports:

```typescript
import { Agent, run } from '@openserv-labs/sdk'
import { provision, triggers } from '@openserv-labs/client'
```

**If you must use CommonJS** (no `"type": "module"`), use dynamic `import()`:

```typescript
async function main() {
  const { Agent, run } = await import('@openserv-labs/sdk')
  const { provision, triggers } = await import('@openserv-labs/client')
  // ... rest of your code
}
main()
```

**Do not** mix `require()` with ESM-only packages. If you see `ERR_REQUIRE_ESM`, switch to `"type": "module"` or use dynamic imports.
