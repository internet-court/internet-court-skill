# Complete Examples

Production-ready example projects demonstrating 0G Compute Network integration.

## Streaming Chat Application

A complete TypeScript project showcasing streaming inference with 0G Compute chatbot providers. This example demonstrates production-grade patterns including error handling, balance checking, and proper response processing.

### Project Structure

```
0g-streaming-chat/
├── src/
│   └── chat-streaming.ts     # Main application
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── .env                     # Environment variables (not committed)
```

### Features

- ✅ Streaming chat completions with real-time output
- ✅ Automatic balance checking before requests
- ✅ Proper chatID extraction (headers + stream fallback)
- ✅ Usage tracking and fee management
- ✅ Command-line argument parsing
- ✅ Comprehensive error handling
- ✅ TypeScript with strict mode

### Setup

#### 1. Create Project Directory

```bash
mkdir 0g-streaming-chat
cd 0g-streaming-chat
```

#### 2. Initialize Project

```bash
npm init -y
```

#### 3. Install Dependencies

Create `package.json`:

```json
{
  "name": "0g-streaming-chat",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "tsx src/chat-streaming.ts",
    "chat": "tsx src/chat-streaming.ts",
    "build": "tsc",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "@0glabs/0g-serving-broker": "^0.6.5",
    "dotenv": "^17.2.3",
    "ethers": "^6.16.0"
  },
  "devDependencies": {
    "@types/node": "^25.0.9",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

Install packages:

```bash
npm install
```

#### 4. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

#### 5. Setup Environment Variables

Create `.env` file (never commit this!):

```bash
# Network RPC URL
RPC_URL=https://evmrpc.0g.ai

# Your wallet private key (NEVER commit this file!)
PRIVATE_KEY=your_private_key_here

# Default provider address (optional)
PROVIDER_ADDRESS=0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C

# Default user message (optional)
USER_MESSAGE=Hello! Can you introduce yourself?
```

#### 6. Create Source Directory

```bash
mkdir src
```

### Complete Source Code

Create `src/chat-streaming.ts`:

```typescript
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration
const RPC_URL = process.env.RPC_URL || "https://evmrpc.0g.ai";

// Parse command line arguments
const args = process.argv.slice(2);
let providerAddress = process.env.PROVIDER_ADDRESS;
let userMessage = process.env.USER_MESSAGE;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--provider" && args[i + 1]) {
    providerAddress = args[i + 1];
    i++;
  } else if (args[i] === "--message" && args[i + 1]) {
    userMessage = args[i + 1];
    i++;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(\`
Usage: npm start [options]

Options:
  --provider <address>    Provider address (default: from .env PROVIDER_ADDRESS)
  --message <text>        User message (default: from .env USER_MESSAGE)
  -h, --help             Show this help message

Examples:
  npm start
  npm start -- --provider 0xBB3f5b0b5062CB5B3245222C5917afD1f6e13aF6
  npm start -- --message "Tell me about blockchain"
  npm start -- --provider 0xBB3f... --message "Hello!"

Available Providers (Mainnet):
  Provider 1:          0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C
  Provider 2:          0xBB3f5b0b5062CB5B3245222C5917afD1f6e13aF6
  Provider 3:          0x4415ef5CBb415347bb18493af7cE01f225Fc0868
  Provider 4:          0x1B3AAef3ae5050EEE04ea38cD4B087472BD85EB0
\`);
    process.exit(0);
  }
}

async function main() {
  try {
    console.log("🚀 Initializing 0G Compute Network (Streaming Mode)...");

    // Validate environment variables
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found in environment variables");
    }

    if (!providerAddress) {
      throw new Error(
        "Provider address not specified. Use --provider flag or set PROVIDER_ADDRESS in .env"
      );
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(\`📍 Connected to network with wallet: \${wallet.address}\`);

    // Create broker instance
    console.log("🔧 Creating broker instance...");
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log("✅ Broker created successfully");

    // Get service metadata
    console.log(
      \`🔍 Fetching service metadata for provider: \${providerAddress}\`
    );
    const { endpoint, model } = await broker.inference.getServiceMetadata(
      providerAddress
    );
    console.log(\`📡 Endpoint: \${endpoint}\`);
    console.log(\`🤖 Model: \${model}\`);

    // Check account balances before making request
    console.log("\\n💰 Checking account balances...");

    try {
      // Get provider sub-account balance
      const subAccount = await broker.inference.getAccount(providerAddress);
      const subBalance = ethers.formatEther(subAccount.balance);
      console.log(\`📊 Provider Sub-Account Balance: \${subBalance} 0G\`);

      // Warn if sub-account balance is too low
      const minRecommendedBalance = ethers.parseEther("1");
      if (subAccount.balance < minRecommendedBalance) {
        console.warn(
          \`\\n⚠️  WARNING: Sub-account balance is low (\${subBalance} 0G)\`
        );
        console.warn(
          \`   Recommended: Transfer funds to continue using this provider\`
        );
        console.warn(
          \`   Command: 0g-compute-cli transfer-fund --provider \${providerAddress} --amount 1\\n\`
        );

        if (subAccount.balance === 0n) {
          throw new Error(
            \`Sub-account balance is 0. Please transfer funds first:\\n\` +
            \`  0g-compute-cli transfer-fund --provider \${providerAddress} --amount 1\`
          );
        }
      }
    } catch (balanceError) {
      console.error("Failed to check balances:", balanceError);
      console.warn("Continuing anyway...\\n");
    }

    // Get request headers
    const headers = await broker.inference.getRequestHeaders(providerAddress);

    // Use custom message or default
    const finalMessage =
      userMessage ||
      "Hello! Can you introduce yourself and tell me what you can do?";

    // Prepare chat request
    const messages = [
      {
        role: "system",
        content: "You are a helpful AI assistant.",
      },
      {
        role: "user",
        content: finalMessage,
      },
    ];

    console.log(\`\\n💬 Sending streaming chat request to \${model}...\`);
    console.log(\`📝 User message: \${finalMessage}\`);

    // Make streaming inference request
    const response = await fetch(\`\${endpoint}/chat/completions\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true, // Enable streaming
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(\`API request failed: \${response.status} - \${errorText}\`);
    }

    // Get chatID from response headers first
    let chatID = response.headers.get("ZG-Res-Key") || "";

    console.log("\\n" + "=".repeat(80));
    console.log(\`🤖 \${model} Streaming Response:\`);
    console.log("=".repeat(80));

    // Process streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let usageData: any = null;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              // Extract chatID from stream if not in headers (use completion.id)
              if (!chatID && parsed.id) {
                chatID = parsed.id;
              }

              // Accumulate content
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                process.stdout.write(content);
                fullResponse += content;
              }

              // Capture usage data
              if (parsed.usage) {
                usageData = parsed.usage;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    console.log("\\n" + "=".repeat(80));

    // Display usage information
    if (usageData) {
      console.log("\\n📊 Usage Statistics:");
      console.log(\`   Input tokens: \${usageData.prompt_tokens}\`);
      console.log(\`   Output tokens: \${usageData.completion_tokens}\`);
      console.log(\`   Total tokens: \${usageData.total_tokens}\`);
    }

    console.log("\\n💰 Processing response for fee management...");
    const isValid = await broker.inference.processResponse(
      providerAddress,
      chatID,                          // Response identifier for verification
      JSON.stringify(usageData)        // Usage data for fee calculation
    );

    console.log("✅ Response is valid:", isValid);

    // Show updated balances after inference
    try {
      const updatedSubAccount = await broker.inference.getAccount(
        providerAddress
      );
      const updatedSubBalance = ethers.formatEther(updatedSubAccount.balance);
      console.log(\`\\n💳 Updated Sub-Account Balance: \${updatedSubBalance} 0G\`);
    } catch (e) {
      // Ignore balance check errors
    }

    console.log("\\n🎉 Streaming chat completed successfully!");
  } catch (error) {
    console.error("\\n❌ Error occurred:");
    if (error instanceof Error) {
      console.error(\`   \${error.message}\`);
      if (error.stack) {
        console.error("\\nStack trace:");
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the main function
main();
```

### Usage

#### Basic Usage

```bash
# Using default provider from .env
npm start

# Or with pnpm
pnpm start
```

#### With Custom Provider

```bash
# Provider 1
npm start -- --provider 0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C

# Provider 2
npm start -- --provider 0xBB3f5b0b5062CB5B3245222C5917afD1f6e13aF6
```

#### With Custom Message

```bash
npm start -- --message "Explain quantum computing in simple terms"
```

#### Combined Options

```bash
npm start -- --provider 0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C --message "Write a haiku about AI"
```

#### Show Help

```bash
npm start -- --help
```

### Example Output

```
🚀 Initializing 0G Compute Network (Streaming Mode)...
📍 Connected to network with wallet: 0x1234...5678
🔧 Creating broker instance...
✅ Broker created successfully
🔍 Fetching service metadata for provider: 0xd9966e...
📡 Endpoint: https://provider-endpoint.example.com/v1/proxy
🤖 Model: provider-model-name

💰 Checking account balances...
📊 Provider Sub-Account Balance: 5.247834 0G

💬 Sending streaming chat request to provider-model-name...
📝 User message: Hello! Can you introduce yourself?

================================================================================
🤖 AI Model Streaming Response:
================================================================================
Hello! I'm an AI assistant running on 0G Compute Network. I'm designed
to help with a wide range of tasks including answering questions, providing
explanations, assisting with coding, creative writing, and much more...
================================================================================

📊 Usage Statistics:
   Input tokens: 23
   Output tokens: 156
   Total tokens: 179

💰 Processing response for fee management...
✅ Response is valid: true

💳 Updated Sub-Account Balance: 5.247756 0G

🎉 Streaming chat completed successfully!
```

### Key Implementation Details

#### 1. Balance Checking

The application checks sub-account balance before making requests:

```typescript
const subAccount = await broker.inference.getAccount(providerAddress);
const minRecommendedBalance = ethers.parseEther("1");

if (subAccount.balance < minRecommendedBalance) {
  console.warn(`⚠️  WARNING: Sub-account balance is low`);
  // Provide helpful transfer command
}
```

#### 2. ChatID Extraction

Implements the correct pattern for streaming chatbot responses:

```typescript
// First, try to get from response headers
let chatID = response.headers.get("ZG-Res-Key") || "";

// During stream processing, fallback to stream data (use completion.id)
if (!chatID && parsed.id) {
  chatID = parsed.id;
}
```

#### 3. Streaming Processing

Handles Server-Sent Events (SSE) format properly:

```typescript
const lines = chunk.split("\\n").filter((line) => line.trim() !== "");

for (const line of lines) {
  if (line.startsWith("data: ")) {
    const data = line.slice(6);
    if (data === "[DONE]") continue;

    const parsed = JSON.parse(data);
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) {
      process.stdout.write(content); // Real-time output
    }
  }
}
```

#### 4. Response Processing

Always processes response for fee management:

```typescript
await broker.inference.processResponse(
  providerAddress,
  chatID,                          // Response identifier for verification
  JSON.stringify(usageData)        // Usage data for fee calculation
);
```

### Example Mainnet Providers

| Provider | Address | Type |
|----------|---------|------|
| Provider 1 | `0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C` | Chatbot |
| Provider 2 | `0xBB3f5b0b5062CB5B3245222C5917afD1f6e13aF6` | Chatbot |
| Provider 3 | `0x4415ef5CBb415347bb18493af7cE01f225Fc0868` | Chatbot (Vision) |
| Provider 4 | `0x1B3AAef3ae5050EEE04ea38cD4B087472BD85EB0` | Chatbot |

### Before Running

1. **Install CLI and setup account**:
   ```bash
   pnpm add @0glabs/0g-serving-broker -g
   0g-compute-cli setup-network  # Choose mainnet
   0g-compute-cli login
   ```

2. **Fund your account**:
   ```bash
   0g-compute-cli deposit --amount 10
   0g-compute-cli transfer-fund --provider 0xd9966e... --amount 5
   ```

3. **Acknowledge provider** (first time only):
   ```bash
   0g-compute-cli inference acknowledge-provider --provider 0xd9966e...
   ```

### Troubleshooting

#### "PRIVATE_KEY not found"

Ensure `.env` file exists and contains:
```bash
PRIVATE_KEY=your_private_key_here
```

#### "Provider address not specified"

Either add to `.env`:
```bash
PROVIDER_ADDRESS=0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C
```

Or use `--provider` flag:
```bash
npm start -- --provider 0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C
```

#### "Sub-account balance is 0"

Transfer funds to provider:
```bash
0g-compute-cli transfer-fund --provider <PROVIDER_ADDRESS> --amount 5
```

#### Type errors during build

Ensure TypeScript and type definitions are installed:
```bash
npm install --save-dev typescript @types/node
```

### Production Considerations

1. **Error Handling**: The example includes comprehensive error handling for:
   - Missing environment variables
   - Network failures
   - Balance checks
   - API errors

2. **Security**:
   - Never commit `.env` file
   - Use environment variables for sensitive data
   - Add `.env` to `.gitignore`

3. **Balance Monitoring**:
   - Checks balance before requests
   - Shows warnings when low
   - Displays updated balance after usage

4. **User Experience**:
   - Real-time streaming output
   - Progress indicators
   - Usage statistics
   - Helpful error messages

### Next Steps

- Add conversation history for multi-turn chats
- Implement retry logic for failed requests
- Add cost tracking across multiple requests
- Create a web interface using this as backend
- Add support for other service types (text-to-image, speech-to-text)

## Related Examples

Explore other service types:

- **Text-to-Image**: [text-to-image.md](text-to-image.md) - Generate images from text prompts
- **Speech-to-Text**: [speech-to-text.md](speech-to-text.md) - Transcribe audio files
- **API Reference**: [../inference.md](../inference.md) - Detailed SDK documentation
- **Fine-tuning**: [../fine-tuning.md](../fine-tuning.md) - Train custom models
