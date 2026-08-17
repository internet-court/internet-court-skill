---
name: near-ai-cloud
description: NEAR AI Cloud private inference and verification. Use when integrating NEAR AI Cloud API for verifiable private AI inference, verifying model or gateway TEE attestation (NVIDIA NRAS, Intel TDX), verifying chat message signatures, implementing end-to-end encrypted chat, or using the OpenAI-compatible API with NEAR AI Cloud.
metadata:
  author: near
  version: "1.0.0"
---

# NEAR AI Cloud

Verifiable private AI inference through Trusted Execution Environments (TEEs). All inference runs inside Intel TDX confidential VMs with NVIDIA TEE GPUs — your data stays encrypted and isolated from infrastructure providers, model providers, and NEAR itself.

## Quick Start

The API is OpenAI-compatible. Point any OpenAI SDK at `https://cloud-api.near.ai/v1`:

```python
import openai

client = openai.OpenAI(
    base_url="https://cloud-api.near.ai/v1",
    api_key="YOUR_API_KEY"  # from cloud.near.ai dashboard
)

response = client.chat.completions.create(
    model="deepseek-ai/DeepSeek-V3.1",
    messages=[{"role": "user", "content": "Hello, NEAR AI!"}]
)
print(response.choices[0].message.content)
```

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://cloud-api.near.ai/v1',
    apiKey: 'YOUR_API_KEY',
});

const completion = await openai.chat.completions.create({
    model: 'deepseek-ai/DeepSeek-V3.1',
    messages: [{ role: 'user', content: 'Hello, NEAR AI!' }]
});
console.log(completion.choices[0].message.content);
```

## How It Works

- All inference runs inside **Intel TDX** confidential VMs with **NVIDIA TEE** GPUs
- TLS terminates **inside the TEE**, not at a load balancer — prompts are never exposed in plaintext
- TEEs generate **cryptographic attestation proofs** verifiable via NVIDIA NRAS and Intel TDX
- Every chat response is **signed by a key that never leaves the TEE**
- You can independently verify hardware attestation and bind it to message signatures

## Verification Flow

```
1. Generate nonce
2. Request model attestation  →  get signing_address, nvidia_payload, intel_quote
3. Verify GPU attestation     →  submit nvidia_payload to NVIDIA NRAS, check JWT fields
4. Verify CPU attestation     →  verify intel_quote via dcap-qvl or TEE Explorer
5. Verify GPU-CPU binding     →  signing_address + nonce bound in TDX report data; same nonce in NRAS eat_nonce
6. Make chat request           →  use the API as normal
7. Fetch chat signature       →  GET /v1/signature/{chat_id}
8. Verify signature            →  recover signer, compare to attested signing_address
```

## API Endpoints

Base URL: `https://cloud-api.near.ai`

| Endpoint                               | Method | Description                        |
|----------------------------------------|--------|------------------------------------|
| `/v1/chat/completions`                 | POST   | OpenAI-compatible chat completions |
| `/v1/models`                           | GET    | List available models              |
| `/v1/attestation/report?model={model}` | GET    | Model attestation (GPU + CPU)      |
| `/v1/attestation/report`               | GET    | Gateway attestation                |
| `/v1/signature/{chat_id}`              | GET    | Chat message signature             |

## Critical Knowledge

- Base URL is `https://cloud-api.near.ai/v1` — use with any OpenAI SDK
- `signing_algo` can be `ecdsa` or `ed25519`
- Nonce should be a random 64-char hex string (32 bytes) for attestation freshness
- NRAS response is a two-part array: `[["JWT", "..."], {"GPU-0": "..."}]` — overall JWT + per-GPU JWTs
- The `signing_address` from model attestation **must match** the address that signed chat messages
- Chat signatures are persistent and can be queried at any time after completion

## References

| Topic                            | File                                                                 |
|----------------------------------|----------------------------------------------------------------------|
| **Private vs Anonymised Models** | [references/private-vs-anonymised.md](references/private-vs-anonymised.md) |
| **Model TEE verification**       | [references/model-verification.md](references/model-verification.md) |

**Planned:**

- Gateway verification (TDX attestation for the API gateway + source provenance)
- Chat verification (request/response hashing + signature verification)
- E2E encrypted chat (ECDH key exchange, AES-256-GCM / ChaCha20-Poly1305)
- OpenAI compatibility (streaming, reasoning models, Files API)

## Resources

- NEAR AI Cloud: https://cloud.near.ai
- Documentation: https://docs.near.ai/cloud/introduction
- Verification Example: https://github.com/near-examples/nearai-cloud-verification-example
- Full Verifier: https://github.com/nearai/nearai-cloud-verifier
- NVIDIA NRAS API: https://docs.api.nvidia.com/attestation/reference/attestmultigpu_1
- TEE Attestation Explorer: https://proof.t16z.com/
- DCAP QVL (TDX verification): https://github.com/Phala-Network/dcap-qvl
