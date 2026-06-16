# Complete Examples

Production-ready example projects demonstrating 0G Compute Network integration.

## Available Examples

Choose the example that matches your use case:

### 1. Streaming Chat Application

**File**: [streaming-chat.md](streaming-chat.md)

A complete TypeScript project showcasing **streaming chatbot inference** with real-time output.

**Key Features**:
- ✅ Streaming chat completions with real-time output
- ✅ Automatic balance checking and warnings
- ✅ Proper chatID extraction (headers + stream fallback)
- ✅ Usage tracking and fee management
- ✅ Command-line argument parsing
- ✅ Production-grade error handling

**Best for**: Building conversational AI applications, chatbots, interactive assistants

**What you'll learn**:
- How to handle streaming Server-Sent Events (SSE)
- Correct chatID extraction for chatbot services
- Balance monitoring and fund management
- Real-time response processing

---

### 2. Text-to-Image Generation

**File**: [text-to-image.md](text-to-image.md)

A complete TypeScript project for **generating images from text descriptions** using 0G Compute.

**Key Features**:
- ✅ Image generation from text prompts
- ✅ Batch generation support
- ✅ Image size and quality configuration
- ✅ Result downloading and caching
- ✅ Cost estimation before generation

**Best for**: Image generation tools, creative applications, content creation platforms

**What you'll learn**:
- How to use text-to-image services
- Handling binary image responses
- Cost-effective batch processing
- Image storage and management

---

### 3. Speech-to-Text Transcription

**File**: [speech-to-text.md](speech-to-text.md)

A complete TypeScript project for **transcribing audio files to text** using 0G Compute.

**Key Features**:
- ✅ Audio file transcription (MP3, WAV, OGG, etc.)
- ✅ Multiple format support
- ✅ Timestamp generation
- ✅ Speaker diarization (if supported)
- ✅ Batch processing for multiple files

**Best for**: Transcription services, podcast processing, meeting notes, subtitle generation

**What you'll learn**:
- How to use speech-to-text services
- Handling multipart/form-data uploads
- Audio file format conversion
- Batch transcription workflows

---

## Quick Comparison

| Feature | Streaming Chat | Text-to-Image | Speech-to-Text |
|---------|---------------|---------------|----------------|
| **Service Type** | Chatbot | Text-to-Image | Speech-to-Text |
| **Input** | Text messages | Text prompts | Audio files |
| **Output** | Streaming text | Image URLs/data | Transcribed text |
| **Real-time** | ✅ Yes | ❌ No | ❌ No |
| **File Upload** | ❌ No | ❌ No | ✅ Yes |
| **Batch Support** | ❌ No | ✅ Yes | ✅ Yes |
| **Cost Model** | Per token | Per image | Per second/token |

## Getting Started

1. **Choose your example** based on your use case
2. **Click the link** to view the complete guide
3. **Follow the setup steps** to create your project
4. **Run and customize** the example code

## Prerequisites (All Examples)

Before starting any example, ensure you have:

```bash
# Node.js version check
node --version  # Must be >= 22.0.0

# Install 0G Compute CLI globally
pnpm add @0glabs/0g-serving-broker -g

# Setup network and login
0g-compute-cli setup-network
0g-compute-cli login

# Deposit funds
0g-compute-cli deposit --amount 10
```

## Common Setup Steps

All examples follow a similar structure:

1. **Project initialization**: Create directory, install dependencies
2. **Environment configuration**: Setup `.env` file with private key
3. **Account management**: Deposit funds and transfer to providers
4. **Provider acknowledgment**: Acknowledge provider before first use
5. **Run the example**: Execute and test the application

## Finding Providers

To list available providers for each service type:

```bash
# List all providers
0g-compute-cli inference list-providers

# Filter by service type in the output
```

**Service Type Identifiers**:
- `chatbot` - Conversational AI services
- `text-to-image` - Image generation services
- `speech-to-text` - Audio transcription services

## Additional Resources

- **API Reference**: See [inference.md](../inference.md) for detailed API documentation
- **Account Management**: See [account-management.md](../account-management.md) for fund management
- **SDK Documentation**: See [SKILL.md](../../SKILL.md) for quick SDK reference

## Contributing Examples

Have a useful integration pattern? Consider contributing:

1. Follow the existing example structure
2. Include complete setup instructions
3. Add production-ready error handling
4. Document all API calls and parameters
5. Test on both testnet and mainnet

## Next Steps

After completing these examples, explore:

- **Fine-tuning**: [fine-tuning.md](../fine-tuning.md) - Train custom models
- **Advanced Patterns**: Combine multiple services in one application
- **Production Deployment**: Scale your application with load balancing
- **Monitoring**: Add logging and metrics for production use
