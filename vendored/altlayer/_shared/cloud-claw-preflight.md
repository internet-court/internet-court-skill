# Cloud Claw Shared Preflight

These notes apply when using the Cloud Claw skills from this repository.

1. These skills target the **user-facing Cloud Claw product flows**, not low-level GCP image baking or VM build scripts.
2. The implementation source of truth lives in the sibling repository:
   - `../cloud-claw`
3. Prefer the same backend routes the UI uses:
   - `POST /api/auth/portal-sso`
   - `GET /api/auth/me`
   - `POST /api/vm/deployments`
   - `GET /api/vm/deployments`
   - VM lifecycle, renew, auto-renew, logs, and dashboard routes
4. Assume Cloud Claw and AltLLM share session semantics. For scriptable user workflows, prefer `portal-sso` rather than re-describing the browser OAuth flow.
5. Do not default to internal build/image scripts unless the user explicitly asks for infra maintenance.
6. Do not forward the saved Portal session token to an arbitrary Cloud Claw host by default. If a non-trusted `--cloud-claw-base-url` is truly intended, require an explicit override such as `--allow-cloud-claw-token-forwarding`.
7. When forwarding the saved Portal session token to Cloud Claw, require `https://` for non-local `--cloud-claw-base-url` values. Only loopback local-development targets should use `http://`.
