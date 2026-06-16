# Speech-to-Text Transcription Example

A complete TypeScript project for transcribing audio files to text using 0G Compute Network.

## Project Overview

This example demonstrates how to:
- Transcribe audio files in various formats
- Handle both single file and batch processing
- Extract timestamps and metadata
- Manage file uploads efficiently
- Track costs and usage

## Project Structure

```
0g-audio-transcriber/
├── src/
│   ├── transcribe.ts          # Main application
│   └── utils/
│       ├── audio-utils.ts     # Audio file validation
│       └── format-utils.ts    # Output formatting
├── audio/                     # Input audio files
├── transcripts/               # Output transcriptions
├── package.json
├── tsconfig.json
└── .env
```

## Features

- ✅ Multiple audio format support (MP3, WAV, OGG, M4A, FLAC)
- ✅ Single file and batch transcription
- ✅ Multiple output formats (JSON, TXT, SRT subtitles)
- ✅ Timestamp generation
- ✅ Automatic language detection
- ✅ Progress tracking
- ✅ Comprehensive error handling
- ✅ TypeScript with strict mode

## Setup

### 1. Create Project Directory

```bash
mkdir 0g-audio-transcriber
cd 0g-audio-transcriber
mkdir -p src/utils audio transcripts
```

### 2. Install Dependencies

Create `package.json`:

```json
{
  "name": "0g-audio-transcriber",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "tsx src/transcribe.ts",
    "transcribe": "tsx src/transcribe.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@0glabs/0g-serving-broker": "^0.6.5",
    "dotenv": "^17.2.3",
    "ethers": "^6.16.0",
    "form-data": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^25.0.9",
    "@types/form-data": "^2.5.0",
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

# Default provider address for speech-to-text
PROVIDER_ADDRESS=0x36aCffCEa3CCe07cAdd1740Ad992dB16Ab324517

# Directories
AUDIO_DIR=./audio
TRANSCRIPT_DIR=./transcripts
```

## Complete Source Code

### Main Application

Create `src/transcribe.ts`:

```typescript
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "https://evmrpc.0g.ai";
const AUDIO_DIR = process.env.AUDIO_DIR || "./audio";
const TRANSCRIPT_DIR = process.env.TRANSCRIPT_DIR || "./transcripts";

// Parse command line arguments
const args = process.argv.slice(2);
let providerAddress = process.env.PROVIDER_ADDRESS;
let audioFile = "";
let outputFormat = "json";
let language = "en";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--provider" && args[i + 1]) {
    providerAddress = args[i + 1];
    i++;
  } else if (args[i] === "--file" && args[i + 1]) {
    audioFile = args[i + 1];
    i++;
  } else if (args[i] === "--format" && args[i + 1]) {
    outputFormat = args[i + 1];
    i++;
  } else if (args[i] === "--language" && args[i + 1]) {
    language = args[i + 1];
    i++;
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(\`
Usage: npm start [options]

Options:
  --provider <address>    Provider address (default: from .env)
  --file <path>          Audio file path (required)
  --format <type>        Output format: json, text, srt (default: json)
  --language <code>      Language code: en, zh, es, etc. (default: en)
  -h, --help            Show this help message

Examples:
  npm start -- --file audio/podcast.mp3
  npm start -- --file audio/meeting.wav --format text
  npm start -- --file audio/interview.m4a --format srt
  npm start -- --provider 0x36aC... --file audio.ogg

Supported Audio Formats:
  MP3, WAV, OGG, M4A, FLAC, WEBM

Output Formats:
  - json: Detailed JSON with timestamps
  - text: Plain text transcription
  - srt: SubRip subtitle format
\`);
    process.exit(0);
  }
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return \`\${hours.toString().padStart(2, "0")}:\${minutes.toString().padStart(2, "0")}:\${secs.toString().padStart(2, "0")},\${ms.toString().padStart(3, "0")}\`;
}

function formatAsSRT(segments: any[]): string {
  let srt = "";
  segments.forEach((segment, index) => {
    srt += \`\${index + 1}\n\`;
    srt += \`\${formatTimestamp(segment.start)} --> \${formatTimestamp(segment.end)}\n\`;
    srt += \`\${segment.text.trim()}\n\n\`;
  });
  return srt;
}

async function transcribeAudio(
  broker: any,
  providerAddress: string,
  endpoint: string,
  model: string,
  audioFilePath: string
): Promise<any> {
  const formData = new FormData();

  // Add audio file
  const fileStream = fs.createReadStream(audioFilePath);
  const fileName = path.basename(audioFilePath);
  formData.append("file", fileStream, fileName);

  // Add parameters
  formData.append("model", model);
  formData.append("response_format", "verbose_json");
  formData.append("language", language);

  // Get request headers
  const headers = await broker.inference.getRequestHeaders(providerAddress);

  // Make transcription request
  const response = await fetch(\`\${endpoint}/audio/transcriptions\`, {
    method: "POST",
    headers: {
      ...headers,
      ...formData.getHeaders()
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(\`Transcription failed: \${response.status} - \${errorText}\`);
  }

  const data = await response.json();

  // Get chatID from response headers
  const chatID = response.headers.get("ZG-Res-Key") ||
                 response.headers.get("zg-res-key");

  // Process response for fee management
  await broker.inference.processResponse(
    providerAddress,
    chatID,                       // Response identifier for verification
    JSON.stringify(data.usage)    // Usage data for fee calculation
  );

  return data;
}

async function main() {
  try {
    console.log("🎙️  0G Compute Speech-to-Text Transcriber");
    console.log("=" .repeat(50));

    // Validate inputs
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found in .env");
    }

    if (!providerAddress) {
      throw new Error("Provider address required");
    }

    if (!audioFile) {
      throw new Error("Audio file required. Use --file flag");
    }

    // Check if file exists
    if (!fs.existsSync(audioFile)) {
      throw new Error(\`File not found: \${audioFile}\`);
    }

    // Validate format
    const validFormats = ["json", "text", "srt"];
    if (!validFormats.includes(outputFormat)) {
      throw new Error(\`Invalid format. Must be one of: \${validFormats.join(", ")}\`);
    }

    // Ensure transcript directory exists
    if (!fs.existsSync(TRANSCRIPT_DIR)) {
      fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
    }

    // Get file info
    const fileStat = fs.statSync(audioFile);
    const fileSizeMB = (fileStat.size / (1024 * 1024)).toFixed(2);

    console.log(\`\n📁 File: \${path.basename(audioFile)}\`);
    console.log(\`📊 Size: \${fileSizeMB} MB\`);

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
          \`Balance is 0. Transfer funds:\n\` +
          \`  0g-compute-cli transfer-fund --provider \${providerAddress} --amount 1\`
        );
      }
    } catch (error) {
      console.warn("⚠️  Could not check balance");
    }

    // Transcribe
    console.log(\`\n🎙️  Transcribing...\`);
    const startTime = Date.now();

    const result = await transcribeAudio(
      broker,
      providerAddress,
      endpoint,
      model,
      audioFile
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(\`✅ Transcription completed in \${duration}s\`);

    // Format output
    let outputContent: string;
    let outputExt: string;

    if (outputFormat === "json") {
      outputContent = JSON.stringify(result, null, 2);
      outputExt = "json";
    } else if (outputFormat === "text") {
      outputContent = result.text || result.segments?.map((s: any) => s.text).join(" ");
      outputExt = "txt";
    } else if (outputFormat === "srt") {
      if (!result.segments) {
        throw new Error("No segments available for SRT format");
      }
      outputContent = formatAsSRT(result.segments);
      outputExt = "srt";
    } else {
      throw new Error("Invalid output format");
    }

    // Save transcript
    const baseName = path.basename(audioFile, path.extname(audioFile));
    const timestamp = Date.now();
    const outputFile = path.join(
      TRANSCRIPT_DIR,
      \`\${baseName}_\${timestamp}.\${outputExt}\`
    );

    fs.writeFileSync(outputFile, outputContent);
    console.log(\`\n📄 Transcript saved: \${outputFile}\`);

    // Display statistics
    if (result.duration) {
      console.log(\`\n📊 Statistics:\`);
      console.log(\`   Audio duration: \${result.duration.toFixed(2)}s\`);

      if (result.segments) {
        console.log(\`   Segments: \${result.segments.length}\`);
      }

      if (result.language) {
        console.log(\`   Detected language: \${result.language}\`);
      }
    }

    // Show usage
    if (result.usage) {
      console.log(\`\n💰 Usage:\`);
      if (result.usage.prompt_tokens) {
        console.log(\`   Input tokens: \${result.usage.prompt_tokens}\`);
      }
      if (result.usage.completion_tokens) {
        console.log(\`   Output tokens: \${result.usage.completion_tokens}\`);
      }
      if (result.usage.total_tokens) {
        console.log(\`   Total tokens: \${result.usage.total_tokens}\`);
      }
    }

    // Show updated balance
    try {
      const updatedAccount = await broker.inference.getAccount(providerAddress);
      const updatedBalance = ethers.formatEther(updatedAccount.balance);
      console.log(\`\n💳 Updated Balance: \${updatedBalance} 0G\`);
    } catch {}

    console.log(\`\n🎉 Transcription completed successfully!\`);

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

### Basic Transcription

```bash
npm start -- --file audio/podcast.mp3
```

### Plain Text Output

```bash
npm start -- --file audio/meeting.wav --format text
```

### SRT Subtitles

```bash
npm start -- --file audio/video.m4a --format srt
```

### Specific Language

```bash
npm start -- --file audio/spanish.mp3 --language es
```

### Custom Provider

```bash
npm start -- --provider 0x36aC... --file audio/interview.ogg
```

## Example Output

### JSON Format

```json
{
  "text": "Hello, welcome to this podcast episode...",
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 3.5,
      "text": "Hello, welcome to this podcast episode",
      "tokens": [1234, 5678, ...],
      "temperature": 0.0,
      "avg_logprob": -0.25
    },
    ...
  ],
  "language": "en",
  "duration": 120.5,
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 450,
    "total_tokens": 600
  }
}
```

### Text Format

```
Hello, welcome to this podcast episode. Today we'll be discussing...
```

### SRT Format

```
1
00:00:00,000 --> 00:00:03,500
Hello, welcome to this podcast episode

2
00:00:03,500 --> 00:00:08,200
Today we'll be discussing artificial intelligence

3
00:00:08,200 --> 00:00:12,800
And its impact on modern technology
```

## Key Implementation Details

### 1. Audio File Upload

```typescript
const formData = new FormData();

// Add audio file
const fileStream = fs.createReadStream(audioFilePath);
formData.append("file", fileStream, path.basename(audioFilePath));

// Add parameters
formData.append("model", model);
formData.append("response_format", "verbose_json");
formData.append("language", language);
```

### 2. ChatID Extraction (Speech-to-Text Pattern)

```typescript
// IMPORTANT: For speech-to-text, get chatID from headers
const chatID = response.headers.get("ZG-Res-Key") ||
               response.headers.get("zg-res-key");

// Process response
await broker.inference.processResponse(
  providerAddress,
  chatID,                              // Response identifier for verification
  JSON.stringify(data.usage)           // Usage data for fee calculation
);
```

### 3. Output Format Conversion

```typescript
// JSON - raw response
outputContent = JSON.stringify(result, null, 2);

// Text - extract text only
outputContent = result.text || result.segments?.map(s => s.text).join(" ");

// SRT - format with timestamps
outputContent = formatAsSRT(result.segments);
```

### 4. Timestamp Formatting

```typescript
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return \`\${hours.toString().padStart(2, "0")}:\${minutes.toString().padStart(2, "0")}:\${secs.toString().padStart(2, "0")},\${ms.toString().padStart(3, "0")}\`;
}
```

## Available Mainnet Providers

| Provider | Address | Model | Notes |
|----------|---------|-------|-------|
| Whisper Large V3 | `0x36aCffCEa3CCe07cAdd1740Ad992dB16Ab324517` | openai/whisper-large-v3 | High accuracy |

To find more providers:

```bash
0g-compute-cli inference list-providers
# Look for providers with serviceType: speech-to-text
```

## Before Running

1. **Install CLI and setup**:
   ```bash
   pnpm add @0glabs/0g-serving-broker -g
   0g-compute-cli setup-network
   0g-compute-cli login
   ```

2. **Fund account**:
   ```bash
   0g-compute-cli deposit --amount 5
   0g-compute-cli transfer-fund --provider 0x36aC... --amount 2
   ```

3. **Acknowledge provider**:
   ```bash
   0g-compute-cli inference acknowledge-provider --provider 0x36aC...
   ```

4. **Prepare audio files**:
   ```bash
   mkdir audio
   # Copy your audio files to the audio/ directory
   ```

## Troubleshooting

### "File not found"

Ensure the audio file path is correct:
```bash
ls -la audio/
```

### "Unsupported format"

Convert audio to supported format:
```bash
# Using ffmpeg
ffmpeg -i input.audio -acodec libmp3lame output.mp3
```

### Large file issues

Split large files into chunks:
```bash
# Split audio into 10-minute chunks
ffmpeg -i large.mp3 -f segment -segment_time 600 -c copy chunk%03d.mp3
```

### Poor transcription quality

- Ensure audio quality is good (clear speech, low noise)
- Use correct language code
- Try different models if available

## Cost Estimation

Approximate costs (mainnet):

| Audio Duration | Cost | Notes |
|---------------|------|-------|
| 1 minute | ~0.0001 0G | Short clips |
| 10 minutes | ~0.001 0G | Typical podcast segment |
| 1 hour | ~0.006 0G | Full podcast episode |
| 10 hours | ~0.06 0G | Audiobook |

**Note**: Costs depend on:
- Audio quality and clarity
- Language complexity
- Provider pricing
- Token usage

## Advanced Features

### Batch Processing

Process multiple files:

```typescript
const audioFiles = fs.readdirSync(AUDIO_DIR)
  .filter(f => f.endsWith(".mp3") || f.endsWith(".wav"));

for (const file of audioFiles) {
  console.log(\`Processing \${file}...\`);
  const result = await transcribeAudio(...);
  // Save result
}
```

### Speaker Diarization

If supported by provider:

```typescript
formData.append("diarize", "true");
formData.append("num_speakers", "2");
```

### Custom Timestamps

Transcribe specific audio segments:

```typescript
formData.append("timestamp_granularities", "word");
// or
formData.append("timestamp_granularities", "segment");
```

## Production Considerations

1. **File Size Limits**: Check provider limits (usually 25MB)
2. **Format Conversion**: Pre-convert to optimal format (MP3, 16kHz)
3. **Error Handling**: Retry failed transcriptions
4. **Progress Tracking**: Add progress bars for long files
5. **Caching**: Store transcriptions to avoid reprocessing
6. **Validation**: Verify audio quality before transcription

## Next Steps

- Add real-time streaming transcription
- Implement speaker identification
- Add translation features
- Create subtitle editor
- Build web interface for uploads

## Related Examples

- **Streaming Chat**: [streaming-chat.md](streaming-chat.md)
- **Text-to-Image**: [text-to-image.md](text-to-image.md)
