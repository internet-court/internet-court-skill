---
name: altllm-portal-auth
description: Use this skill when the user asks to log in or out with a wallet session, fetch a wallet sign-in challenge, verify an externally signed challenge, or troubleshoot AltLLM Portal wallet login for the local altllm CLI. Do NOT use for API key management, billing history, or payment links.
user-invocable: true
---

# AltLLM Portal Auth

Wallet login and session bootstrap for the local `altllm` CLI, including external signers such as Privy.

## Shared Setup

> Before the first `altllm` command in a fresh checkout, read and follow:
> - `../_shared/preflight.md`
> - `../_shared/session-and-target.md`

## Command Index

| Command | Purpose |
|---|---|
| `login-wallet --private-key-env <name>` | Sign in with a locally available private key from an environment variable |
| `login-wallet --private-key-file <path>` | Sign in with a locally available private key from a file |
| `login-wallet --private-key <hex> --allow-unsafe-private-key-argv` | Sign in with an inline private key when argv exposure is explicitly accepted |
| `login-wallet --prepare` | Fetch a challenge for external signing |
| `login-wallet --nonce <nonce> --signature <sig>` | Verify an externally signed challenge and save the session |
| `status` | Show saved Portal session user and target URL status without exposing the token |
| `logout` | Remove the local saved Portal session file |

## Rules

- Do not assume the CLI must control the wallet private key.
- If the wallet can sign the challenge message, use the prepare + verify flow.
- External signers such as Privy are valid as long as they return a standard wallet signature for the challenge.
- If neither a local private key nor `--signature` is available, return the challenge payload and stop.
- Before local auto-signing, validate that the returned challenge matches the requested wallet, chain, and expected AltLLM login challenge structure.
- For non-default, non-loopback API hosts, prefer `--prepare` and external signing instead of local auto-signing.
- Current backend support is still limited to EVM addresses and Ethereum-style signatures.
- Save the resulting session to `~/.altllm/portal-cli-session.json` unless overridden.
- Use `status` or its `whoami` alias to confirm the saved user and target URL before running live commands.
- `logout` only removes the local session file. It does not revoke API keys.

## Reference

See [references/cli-reference.md](references/cli-reference.md) for commands, payloads, and troubleshooting notes.
