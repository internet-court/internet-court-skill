# Shared Preflight

Use these rules before the first `altllm` command in a fresh checkout or after changing CLI code.

1. Default to the production Portal API:
   - `https://platform-api.altllm.ai`
   - Only use `http://localhost:7040` when the task is explicitly about local development.
   - Commands that reuse a saved Portal session token must use `https://` for non-local base URLs.
2. Build the local CLI before first use in a fresh checkout:
   - `npm install`
   - `npm run typecheck` when TypeScript changed
   - `npm run build`
3. Prefer repo-local execution:
   - `node dist/cli.js ...`
4. Keep stdout machine-readable JSON.
5. Treat `~/.altllm/portal-cli-session.json` as sensitive local state.
6. Do not print private keys or full API keys except when the command intentionally returns a newly created key.
7. If the task touches a live command, run a real check against the intended environment when practical.
8. Do not forward a saved Portal session token to a different `--base-url` host by default. Require an explicit override such as `--allow-token-host-mismatch` when that mismatch is truly intended.
