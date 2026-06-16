# Cloud Claw Skill Map

## Skills

| Skill | Coverage | Notes |
|---|---|---|
| `cloud-claw-launch-agent` | `cloud-claw-deploy`, `cloud-claw-me` | wraps deployment form semantics and pre-launch checks |
| `cloud-claw-manage-vm` | `cloud-claw-deployments`, `cloud-claw-deployment`, `cloud-claw-start`, `cloud-claw-stop`, `cloud-claw-restart`, `cloud-claw-renew`, `cloud-claw-auto-renew`, `cloud-claw-delete`, `cloud-claw-logs` | wraps the user-facing Cloud Claw API |

## Source Files In The Cloud Claw Repo

- [cloud-claw/AGENTS.md](https://github.com/alt-research/cloud-claw/blob/master/AGENTS.md)
- [cloud-claw/README.md](https://github.com/alt-research/cloud-claw/blob/master/README.md)
- [cloud-claw/server/src/routes/auth.ts](https://github.com/alt-research/cloud-claw/blob/master/server/src/routes/auth.ts)
- [cloud-claw/server/src/routes/vm-deployment.ts](https://github.com/alt-research/cloud-claw/blob/master/server/src/routes/vm-deployment.ts)
- [cloud-claw/server/src/services/vm.ts](https://github.com/alt-research/cloud-claw/blob/master/server/src/services/vm.ts)
- [cloud-claw/server/src/services/altllm.ts](https://github.com/alt-research/cloud-claw/blob/master/server/src/services/altllm.ts)
- [cloud-claw/server/src/services/portal-store.ts](https://github.com/alt-research/cloud-claw/blob/master/server/src/services/portal-store.ts)
- [cloud-claw/web/src/App.tsx](https://github.com/alt-research/cloud-claw/blob/master/web/src/App.tsx)
