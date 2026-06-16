# Inference Reference

Complete guide for using 0G Compute Network inference services.

## SDK Integration Patterns

### Initialize Broker

#### Node.js Environment

```typescript
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

const RPC_URL = process.env.NODE_ENV === 'production'
  ? "https://evmrpc.0g.ai"  // Mainnet
  : "https://evmrpc-testnet.0g.ai";  // Testnet

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const broker = await createZGComputeNetworkBroker(wallet);
```

#### Browser Environment

```typescript
import { BrowserProvider } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

// Check if MetaMask is installed
if (typeof window.ethereum === "undefined") {
  throw new Error("Please install MetaMask");
}

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const broker = await createZGComputeNetworkBroker(signer);
```

### Browser Polyfills

When using the SDK in browser environments, you need polyfills:

```bash
pnpm add -D vite-plugin-node-polyfills
```

```javascript
// vite.config.js
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default {
  plugins: [
    nodePolyfills({
      include: ['crypto', 'stream', 'util', 'buffer', 'process'],
      globals: { Buffer: true, global: true, process: true }
    })
  ]
};
```

## Service Discovery

```typescript
// List all available services
const services = await broker.inference.listService();

// Each service contains: provider, serviceType, url, inputPrice, outputPrice, updatedAt, model, verifiability
services.forEach(service => {
  console.log(`Provider: ${service.provider}`);
  console.log(`Service Type: ${service.serviceType}`);
  console.log(`Model: ${service.model}`);
  console.log(`Verifiability: ${service.verifiability}`); // 'TeeML' or empty
});

// Filter by service type
const chatbotServices = services.filter(s => s.serviceType === 'chatbot');
const imageServices = services.filter(s => s.serviceType === 'text-to-image');
const speechServices = services.filter(s => s.serviceType === 'speech-to-text');

// Pagination and filtering options
const servicesPage2 = await broker.inference.listService(50, 50); // offset=50, limit=50
const withUnacknowledged = await broker.inference.listService(0, 50, true); // include unacknowledged providers
```

### Provider Selection

Filter services by type and choose based on pricing:

```typescript
// Filter by service type
const chatbotServices = services.filter(s => s.serviceType === 'chatbot');
const imageServices = services.filter(s => s.serviceType === 'text-to-image');

// Sort by input price (cheapest first)
const sortedByPrice = [...chatbotServices].sort((a, b) =>
  Number(a.inputPrice) - Number(b.inputPrice)
);

const bestProvider = sortedByPrice[0];
console.log(`Best chatbot: ${bestProvider.model} at ${bestProvider.provider}`);
```

## Account Management

```typescript
// Get account info
const account = await broker.ledger.getLedger();

// Deposit funds to main account
await broker.ledger.depositFund(10);

// Acknowledge provider (required before first use)
await broker.inference.acknowledgeProviderSigner(providerAddress);
```

## Chatbot Inference

### Standard Chat Completion

```typescript
const messages = [{ role: "user", content: "Hello!" }];

// Get service metadata
const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);

// Generate auth headers
const headers = await broker.inference.getRequestHeaders(providerAddress);

// Make request
const response = await fetch(`${endpoint}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify({ messages, model })
});

const data = await response.json();
const answer = data.choices[0].message.content;

// Process response for fee management and verification
let chatID = response.headers.get("ZG-Res-Key") || response.headers.get("zg-res-key");
if (!chatID) {
  chatID = data.id;  // Use completion.id from response body
}

await broker.inference.processResponse(
  providerAddress,
  chatID,                       // Response identifier for verification
  JSON.stringify(data.usage)    // Usage data for fee calculation
);
```

### Streaming Chat Completion

```typescript
const response = await fetch(`${endpoint}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify({
    messages,
    model,
    stream: true
  })
});

// For chatbot streaming: check headers first, then try stream data
let chatID = response.headers.get("ZG-Res-Key") || response.headers.get("zg-res-key");
let usage = null;
let streamChatID = null;

const decoder = new TextDecoder();
const reader = response.body.getReader();
let rawBody = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  rawBody += decoder.decode(value, { stream: true });

  // Process chunks in real-time
  console.log(decoder.decode(value, { stream: true }));
}

// Parse usage and chatID from stream
for (const line of rawBody.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed === 'data: [DONE]') continue;

  try {
    const jsonStr = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
    const message = JSON.parse(jsonStr);

    // For chatbot, try to get ID from stream data (use completion.id)
    if (!streamChatID && message.id) {
      streamChatID = message.id;
    }
    if (message.usage) {
      usage = message.usage;
    }
  } catch {}
}

// Use chatID from header if available, otherwise use chatID from stream data
const finalChatID = chatID || streamChatID;

await broker.inference.processResponse(
  providerAddress,
  finalChatID,                        // Response identifier for verification
  JSON.stringify(usage || {})         // Usage data for fee calculation
);
```

## Text-to-Image Generation

```typescript
const prompt = "A cute baby sea otter playing in the water";

// Get service metadata
const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);

const requestBody = {
  model,
  prompt,
  n: 1,
  size: "1024x1024"
};

// Generate auth headers
const headers = await broker.inference.getRequestHeaders(
  providerAddress,
  JSON.stringify(requestBody)
);

// Make request
const response = await fetch(`${endpoint}/images/generations`, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify(requestBody)
});

const data = await response.json();
const imageUrl = data.data[0].url;

// Get chatID from response headers only
const chatID = response.headers.get("ZG-Res-Key") || response.headers.get("zg-res-key");

const isValid = await broker.inference.processResponse(
  providerAddress,
  chatID,                       // Response identifier for verification
  JSON.stringify(data.usage)    // Usage data for fee calculation
);
console.log("Response valid:", isValid);
```

## Speech-to-Text Transcription

### Standard Transcription

```typescript
const formData = new FormData();
formData.append('file', audioFile); // audioFile is a File or Blob
formData.append('model', model);
formData.append('response_format', 'json');

// Get service metadata
const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);

// Generate auth headers
const headers = await broker.inference.getRequestHeaders(providerAddress);

// Make request
const response = await fetch(`${endpoint}/audio/transcriptions`, {
  method: "POST",
  headers: { ...headers },
  body: formData
});

const data = await response.json();
const transcription = data.text;

// Get chatID from response headers
const chatID = response.headers.get("ZG-Res-Key") || response.headers.get("zg-res-key");

const isValid = await broker.inference.processResponse(
  providerAddress,
  chatID,                       // Response identifier for verification
  JSON.stringify(data.usage)    // Usage data for fee calculation
);
console.log("Response valid:", isValid);
```

### Streaming Transcription

```typescript
const response = await fetch(`${endpoint}/audio/transcriptions`, {
  method: "POST",
  headers: { ...headers },
  body: formData
});

// For speech-to-text streaming, get chatID from headers
const chatID = response.headers.get("ZG-Res-Key") || response.headers.get("zg-res-key");

let usage = null;
const decoder = new TextDecoder();
const reader = response.body.getReader();
let rawBody = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  rawBody += decoder.decode(value, { stream: true });
}

// Parse usage from stream data
for (const line of rawBody.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed === 'data: [DONE]') continue;

  try {
    const jsonStr = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
    const message = JSON.parse(jsonStr);
    if (message.usage) {
      usage = message.usage;
    }
  } catch {}
}

// Process with chatID for verification if available
const isValid = await broker.inference.processResponse(
  providerAddress,
  chatID,                             // Response identifier for verification
  JSON.stringify(usage || {})         // Usage data for fee calculation
);
console.log("Audio streaming response valid:", isValid);
```

## Direct API Usage (cURL)

### Get API Secret

```bash
0g-compute-cli inference get-secret --provider <PROVIDER_ADDRESS>
```

This generates a Bearer token: `app-sk-<SECRET>`

### Chatbot API

```bash
curl <service_url>/v1/proxy/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer app-sk-<YOUR_SECRET>" \
  -d '{
    "model": "<MODEL_NAME>",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'
```

### Text-to-Image API

```bash
curl <service_url>/v1/proxy/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer app-sk-<YOUR_SECRET>" \
  -d '{
    "model": "<MODEL_NAME>",
    "prompt": "A cute baby sea otter playing in the water",
    "n": 1,
    "size": "1024x1024"
  }'
```

### Speech-to-Text API

```bash
curl <service_url>/v1/proxy/audio/transcriptions \
  -H "Authorization: Bearer app-sk-<YOUR_SECRET>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.ogg" \
  -F "model=whisper-large-v3" \
  -F "response_format=json"
```

## Local Proxy Server

Run a local OpenAI-compatible server:

```bash
# Start server on port 3000 (default)
0g-compute-cli inference serve --provider <PROVIDER_ADDRESS>

# Custom port
0g-compute-cli inference serve --provider <PROVIDER_ADDRESS> --port 8080
```

Then use any OpenAI-compatible client to connect to `http://localhost:3000`.

## Python Examples

### Chatbot

```python
from openai import OpenAI

client = OpenAI(
    base_url=f"{service_url}/v1/proxy",
    api_key='app-sk-<YOUR_SECRET>'
)

completion = client.chat.completions.create(
    model=model,
    messages=[
        {
            'role': 'system',
            'content': 'You are a helpful assistant.'
        },
        {
            'role': 'user',
            'content': 'Hello!'
        }
    ]
)

print(completion.choices[0].message)
```

### Text-to-Image

```python
from openai import OpenAI

client = OpenAI(
    base_url=f"{service_url}/v1/proxy",
    api_key='app-sk-<YOUR_SECRET>'
)

response = client.images.generate(
    model=model,
    prompt='A cute baby sea otter playing in the water',
    n=1,
    size='1024x1024'
)

print(response.data)
```

### Speech-to-Text

```python
from openai import OpenAI

client = OpenAI(
    base_url=f"{service_url}/v1/proxy",
    api_key='app-sk-<YOUR_SECRET>'
)

with open('audio.ogg', 'rb') as audio_file:
    transcription = client.audio.transcriptions.create(
        file=audio_file,
        model='whisper-large-v3',
        response_format='json'
    )

print(transcription.text)
```

## Key Points

### Response Verification

- Always call `processResponse()` after receiving responses
- The SDK automatically handles fund transfers to prevent service interruptions
- For verifiable TEE services, the method also validates response integrity

### chatID Retrieval

**Principle**: Always prioritize `ZG-Res-Key` from response headers. Only use fallback methods when header is not present.

- **Chatbot**: First try `ZG-Res-Key` header, then check `data.id` (completion ID from response body) as fallback
- **Text-to-Image & Speech-to-Text**: Always get chatID from `ZG-Res-Key` response header
- **Streaming responses**:
  - **Chatbot streaming**: Check headers first, then try to get `id` from stream data as fallback
  - **Speech-to-text streaming**: Get chatID from `ZG-Res-Key` header immediately

### Usage Data

Usage data format varies by service type but typically includes token counts or request metrics.
