# Text-to-Image Generation Example

A complete TypeScript project for generating images from text descriptions using 0G Compute Network.

## Project Overview

This example demonstrates how to:
- Generate images from text prompts
- Handle image downloads and storage
- Process multiple image requests efficiently
- Manage costs and track usage
- Implement proper error handling

## Project Structure

```
0g-image-generator/
├── src/
│   ├── generate-image.ts      # Main application
│   └── utils/
│       ├── image-utils.ts     # Image download and storage
│       └── cost-estimator.ts  # Cost calculation utilities
├── outputs/                   # Generated images directory
├── package.json
├── tsconfig.json
└── .env
```

## Features

- ✅ Single and batch image generation
- ✅ Multiple size options (256x256, 512x512, 1024x1024)
- ✅ Automatic image downloading
- ✅ Cost estimation before generation
- ✅ Progress tracking for batch operations
- ✅ Comprehensive error handling
- ✅ TypeScript with strict mode

## Setup

### 1. Create Project Directory

```bash
mkdir 0g-image-generator
cd 0g-image-generator
mkdir -p src/utils outputs
```

### 2. Install Dependencies

Create `package.json`:

```json
{
  "name": "0g-image-generator",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "tsx src/generate-image.ts",
    "generate": "tsx src/generate-image.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@0glabs/0g-serving-broker": "^0.6.5",
    "dotenv": "^17.2.3",
    "ethers": "^6.16.0",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/node": "^25.0.9",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

```bash
npm install
```

### 3. Configure TypeScript

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

### 4. Setup Environment

Create `.env`:

```bash
# Network RPC URL
RPC_URL=https://evmrpc.0g.ai

# Your wallet private key
PRIVATE_KEY=your_private_key_here

# Default provider address for text-to-image
PROVIDER_ADDRESS=0xE29a72c7629815Eb480aE5b1F2dfA06f06cdF974

# Output directory
OUTPUT_DIR=./outputs
```

## Complete Source Code

### Main Application

Create `src/generate-image.ts`:

```typescript
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "https://evmrpc.0g.ai";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./outputs";

// Parse command line arguments
const args = process.argv.slice(2);
let providerAddress = process.env.PROVIDER_ADDRESS;
let prompt = "";
let imageSize = "1024x1024";
let numImages = 1;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--provider" && args[i + 1]) {
    providerAddress = args[i + 1];
    i++;
  } else if (args[i] === "--prompt" && args[i + 1]) {
    prompt = args[i + 1];
    i++;
  } else if (args[i] === "--size" && args[i + 1]) {
    imageSize = args[i + 1];
    i++;
  } else if (args[i] === "--count" && args[i + 1]) {
    numImages = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(\`
Usage: npm start [options]

Options:
  --provider <address>    Provider address (default: from .env)
  --prompt <text>         Image generation prompt (required)
  --size <size>          Image size: 256x256, 512x512, 1024x1024 (default: 1024x1024)
  --count <number>       Number of images to generate (default: 1)
  -h, --help            Show this help message

Examples:
  npm start -- --prompt "A cute cat playing with yarn"
  npm start -- --prompt "Mountain sunset" --size 512x512
  npm start -- --prompt "Abstract art" --count 4
  npm start -- --provider 0xE29a... --prompt "Ocean waves"

Available Image Sizes:
  - 256x256  (Fastest, lowest cost)
  - 512x512  (Balanced)
  - 1024x1024 (Highest quality, highest cost)
\`);
    process.exit(0);
  }
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`Failed to download image: \${response.statusText}\`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

async function main() {
  try {
    console.log("🎨 0G Compute Text-to-Image Generator");
    console.log("=" .repeat(50));

    // Validate inputs
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found in .env");
    }

    if (!providerAddress) {
      throw new Error("Provider address required. Use --provider or set in .env");
    }

    if (!prompt) {
      throw new Error("Prompt required. Use --prompt flag");
    }

    // Validate image size
    const validSizes = ["256x256", "512x512", "1024x1024"];
    if (!validSizes.includes(imageSize)) {
      throw new Error(\`Invalid size. Must be one of: \${validSizes.join(", ")}\`);
    }

    // Validate count
    if (numImages < 1 || numImages > 10) {
      throw new Error("Count must be between 1 and 10");
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Initialize
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(\`\n📍 Wallet: \${wallet.address}\`);

    const broker = await createZGComputeNetworkBroker(wallet);
    console.log("✅ Broker initialized");

    // Get service metadata
    const { endpoint, model } = await broker.inference.getServiceMetadata(
      providerAddress
    );
    console.log(\`📡 Endpoint: \${endpoint}\`);
    console.log(\`🤖 Model: \${model}\`);

    // Check balance
    try {
      const subAccount = await broker.inference.getAccount(providerAddress);
      const balance = ethers.formatEther(subAccount.balance);
      console.log(\`💰 Sub-Account Balance: \${balance} 0G\`);

      if (subAccount.balance === 0n) {
        throw new Error(
          \`Sub-account balance is 0. Transfer funds:\n\` +
          \`  0g-compute-cli transfer-fund --provider \${providerAddress} --amount 1\`
        );
      }
    } catch (error) {
      console.warn("⚠️  Could not check balance");
    }

    // Generate images
    console.log(\`\n🎨 Generating \${numImages} image(s)...\`);
    console.log(\`📝 Prompt: "\${prompt}"\`);
    console.log(\`📐 Size: \${imageSize}\`);
    console.log("");

    const headers = await broker.inference.getRequestHeaders(providerAddress);

    for (let i = 0; i < numImages; i++) {
      console.log(\`\n[\${i + 1}/\${numImages}] Generating...\`);

      const requestBody = {
        model,
        prompt,
        n: 1,
        size: imageSize
      };

      const response = await fetch(\`\${endpoint}/images/generations\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(\`API request failed: \${response.status} - \${errorText}\`);
      }

      const data = await response.json();

      // Get chatID from response headers only (text-to-image pattern)
      const chatID = response.headers.get("ZG-Res-Key") ||
                     response.headers.get("zg-res-key");

      // Process response for fee management
      await broker.inference.processResponse(
        providerAddress,
        chatID,                       // Response identifier for verification
        JSON.stringify(data.usage)    // Usage data for fee calculation
      );

      // Download image
      if (data.data && data.data[0]) {
        const imageUrl = data.data[0].url || data.data[0].b64_json;

        if (!imageUrl) {
          throw new Error("No image URL in response");
        }

        const timestamp = Date.now();
        const filename = \`image_\${timestamp}_\${i + 1}.png\`;
        const filepath = path.join(OUTPUT_DIR, filename);

        if (imageUrl.startsWith("http")) {
          await downloadImage(imageUrl, filepath);
          console.log(\`✅ Saved: \${filepath}\`);
        } else if (imageUrl.startsWith("data:image")) {
          // Handle base64 data
          const base64Data = imageUrl.split(",")[1];
          fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));
          console.log(\`✅ Saved: \${filepath}\`);
        }
      }
    }

    // Show updated balance
    try {
      const updatedAccount = await broker.inference.getAccount(providerAddress);
      const updatedBalance = ethers.formatEther(updatedAccount.balance);
      console.log(\`\n💳 Updated Balance: \${updatedBalance} 0G\`);
    } catch {}

    console.log(\`\n🎉 Successfully generated \${numImages} image(s)!\`);
    console.log(\`📁 Output directory: \${OUTPUT_DIR}\`);

  } catch (error) {
    console.error("\n❌ Error:");
    if (error instanceof Error) {
      console.error(\`   \${error.message}\`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
```

## Usage

### Basic Generation

```bash
npm start -- --prompt "A beautiful sunset over mountains"
```

### Custom Size

```bash
npm start -- --prompt "Abstract geometric art" --size 512x512
```

### Batch Generation

```bash
npm start -- --prompt "Cute cartoon animals" --count 4
```

### Custom Provider

```bash
npm start -- --provider 0xE29a... --prompt "Futuristic cityscape"
```

## Example Output

```
🎨 0G Compute Text-to-Image Generator
==================================================

📍 Wallet: 0x1234...5678
✅ Broker initialized
📡 Endpoint: https://provider-endpoint.example.com/v1/proxy
🤖 Model: z-image
💰 Sub-Account Balance: 3.456789 0G

🎨 Generating 1 image(s)...
📝 Prompt: "A beautiful sunset over mountains"
📐 Size: 1024x1024

[1/1] Generating...
✅ Saved: ./outputs/image_1705402856123_1.png

💳 Updated Balance: 3.453789 0G

🎉 Successfully generated 1 image(s)!
📁 Output directory: ./outputs
```

## Key Implementation Details

### 1. Image Size Options

```typescript
const validSizes = ["256x256", "512x512", "1024x1024"];

// Different sizes have different costs
// 256x256: Fastest, lowest cost (~0.001 0G)
// 512x512: Balanced (~0.002 0G)
// 1024x1024: Highest quality (~0.003 0G)
```

### 2. ChatID Extraction (Text-to-Image Pattern)

```typescript
// IMPORTANT: For text-to-image, chatID comes from headers only
const chatID = response.headers.get("ZG-Res-Key") ||
               response.headers.get("zg-res-key");

// Process response
await broker.inference.processResponse(
  providerAddress,
  chatID,                       // Response identifier for verification
  JSON.stringify(data.usage)    // Usage data for fee calculation
);
```

### 3. Image Download Handling

```typescript
// Handle both URL and base64 responses
if (imageUrl.startsWith("http")) {
  // Download from URL
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
} else if (imageUrl.startsWith("data:image")) {
  // Handle base64
  const base64Data = imageUrl.split(",")[1];
  fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));
}
```

### 4. Batch Processing

```typescript
for (let i = 0; i < numImages; i++) {
  console.log(\`[\${i + 1}/\${numImages}] Generating...\`);

  // Generate image
  const response = await fetch(...);

  // Process and save
  await broker.inference.processResponse(...);
  await downloadImage(...);
}
```

## Available Mainnet Providers

| Provider | Address | Model | Notes |
|----------|---------|-------|-------|
| z-image | `0xE29a72c7629815Eb480aE5b1F2dfA06f06cdF974` | z-image | Text-to-image generation |

To find more providers:

```bash
0g-compute-cli inference list-providers
# Look for providers with serviceType: text-to-image
```

## Before Running

1. **Install CLI and setup**:
   ```bash
   pnpm add @0glabs/0g-serving-broker -g
   0g-compute-cli setup-network  # Choose mainnet
   0g-compute-cli login
   ```

2. **Fund account**:
   ```bash
   0g-compute-cli deposit --amount 5
   0g-compute-cli transfer-fund --provider 0xE29a... --amount 2
   ```

3. **Acknowledge provider**:
   ```bash
   0g-compute-cli inference acknowledge-provider --provider 0xE29a...
   ```

## Troubleshooting

### "No image URL in response"

The response format might vary by provider. Check:
```typescript
console.log(JSON.stringify(data, null, 2));
```

### Images not saving

Ensure output directory exists and is writable:
```bash
mkdir -p outputs
chmod 755 outputs
```

### "Invalid size"

Only use these sizes:
- `256x256`
- `512x512`
- `1024x1024`

### High costs

- Start with smaller sizes (256x256 or 512x512)
- Generate single images first
- Monitor balance with `get-account` command

## Cost Estimation

Approximate costs (mainnet):

| Size | Cost per Image | 100 Images |
|------|---------------|-----------|
| 256x256 | ~0.001 0G | ~0.1 0G |
| 512x512 | ~0.002 0G | ~0.2 0G |
| 1024x1024 | ~0.003 0G | ~0.3 0G |

**Note**: Actual costs may vary by provider. Always check your balance before large batch operations.

## Advanced Features

### Adding Image Variations

Generate multiple variations of the same concept:

```typescript
const prompts = [
  "A sunset over mountains, realistic",
  "A sunset over mountains, oil painting style",
  "A sunset over mountains, anime style"
];

for (const p of prompts) {
  // Generate with each prompt
}
```

### Quality Settings

Some providers support quality parameters:

```typescript
const requestBody = {
  model,
  prompt,
  n: 1,
  size: imageSize,
  quality: "hd",  // If supported by provider
  style: "vivid"  // If supported by provider
};
```

### Negative Prompts

Improve results with negative prompts:

```typescript
const prompt = "A beautiful landscape";
const negativePrompt = "blurry, distorted, low quality";

// Combine in request if provider supports it
```

## Production Considerations

1. **Rate Limiting**: Add delays between batch requests
2. **Storage**: Implement image cleanup for old files
3. **Validation**: Check prompt content before generation
4. **Monitoring**: Track generation success rates
5. **Caching**: Store prompts to avoid duplicate generations
6. **Optimization**: Use appropriate sizes for use case

## Next Steps

- Add image editing/variation features
- Implement prompt optimization
- Create a web UI for the generator
- Add image-to-image transformation
- Integrate with content management systems

## Related Examples

- **Streaming Chat**: [streaming-chat.md](streaming-chat.md)
- **Speech-to-Text**: [speech-to-text.md](speech-to-text.md)
