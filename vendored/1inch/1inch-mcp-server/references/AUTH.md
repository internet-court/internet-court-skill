# Authentication -- 1inch MCP

## API key

Obtain a key from the [1inch Business Portal](https://business.1inch.com/portal).

Pass it as:

`Authorization: Bearer <YOUR_API_KEY>`

How you set this depends on the client:

- **Cursor plugin (Marketplace / local):** plugin → **Setup → Edit Values** → `ONEINCH_API_KEY` (optional; leave empty for public tools + OAuth)
- **Cursor** (`.cursor/mcp.json`): `headers.Authorization`
- **VS Code** (`.vscode/mcp.json`): `headers.Authorization`
- **Claude Code**: `claude mcp add --header "Authorization: Bearer ..."`
- **Claude Desktop** (stdio via supergateway): add `--header` `Authorization: Bearer ...` to the supergateway args **after** `--streamableHttp` and URL (see product docs).

## OAuth

Initialize HTTP 200 is **not** login — that is the mcp-free / anonymous identity. Public tools work without a real org.

**Before** paid tools (`swap`, `orderbook`, `product_api`, `debug`), call **`authenticate`**:

1. Call `authenticate`.
2. If the host returns **HTTP 401**, complete OAuth (`mcp_auth` / connect this MCP server).
3. Call `authenticate` again until the result is `{ authenticated: true, organizationId, ... }`.

Do **not** treat a PaymentRequired / x402 tool result as login. Do **not** skip `authenticate` because initialize succeeded.

If the user has an API key, pass `Authorization: Bearer <key>` instead (see above). Protected tools (including optional `debug`) need a **non-anonymous** session. `debug` is only available when the server registers it; see [TOOLS.md](TOOLS.md).

## Stdio bridging (Claude Desktop and similar)

When the client only supports stdio:

```bash
npx -y supergateway \
  --streamableHttp https://api.1inch.com/mcp/protocol \
  --outputTransport stdio
```

With API key:

```bash
npx -y supergateway \
  --streamableHttp https://api.1inch.com/mcp/protocol \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --outputTransport stdio
```

Use **absolute paths** to `npx` and ensure `PATH` in the MCP server `env` includes your Node binary directory.

## Security

- Never commit API keys to repositories or skills.
- Treat skills that mention keys as **user-supplied configuration**, not embedded secrets.
