# Cloud Claw Shared API Surface

Primary user-facing backend routes used by the Cloud Claw UI.

## Auth

- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `POST /api/auth/portal-sso`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## VM Deployments

- `POST /api/vm/deployments`
- `GET /api/vm/deployments`
- `GET /api/vm/deployments/:name`
- `POST /api/vm/deployments/:name/start`
- `POST /api/vm/deployments/:name/stop`
- `POST /api/vm/deployments/:name/renew`
- `POST /api/vm/deployments/:name/auto-renew`
- `DELETE /api/vm/deployments/:name`
- `GET /api/vm/deployments/:name/logs`
- `GET /api/vm/deployments/:name/logs/stream`
- `GET /dash/:vmName/...`

## Launch Payload Fields

`POST /api/vm/deployments` accepts:

- `name`
- `agentType`
  - `openclaw`
  - `picoclaw`
  - `aintern`
- `env`
  - `OPENCLAW_MODEL`
  - `PICOCLAW_MODEL`
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_ALLOWED_USERS`
  - `ALTLLM_API_KEY`
  - `ALTLLM_API_BASE`
  - `ANTHROPIC_API_KEY`
