# Shared Session And Target Notes

- Portal commands target the AltLLM Portal API. Cloud Claw commands target Cloud Claw through Portal SSO. The `altllm` CLI commands do not operate the OpenAI-compatible gateway; generated API keys are used there separately.
- Use the saved Portal session for follow-up commands unless the user overrides `--session-file`.
- The default session file is `~/.altllm/portal-cli-session.json`.
- API keys created through Portal are meant for the AltLLM OpenAI-compatible gateway at `https://api.altllm.ai/v1`.
- Current wallet login still requires an EVM address and Ethereum-style signature verification on the backend.
