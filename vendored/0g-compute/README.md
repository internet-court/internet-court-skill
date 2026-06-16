# 0G Compute Skills

> **Note**: This repository has been superseded by [0g-agent-skills](https://github.com/0gfoundation/0g-agent-skills) as the unified entry point for all 0G skills.

An [Agent Skills](https://agentskills.io) compatible skill for working with 0G Compute Network — a decentralized GPU marketplace for AI inference and model fine-tuning.

## Supported Platforms

This skill follows the [Agent Skills open standard](https://agentskills.io) and works with:

- **Claude Code** — `~/.claude/skills/0g-compute/`
- **OpenAI Codex** — `~/.agents/skills/0g-compute/`
- **OpenClaw** — `~/.openclaw/skills/0g-compute/`
- **Cursor, Gemini CLI, VS Code, Roo Code** — standard SKILL.md discovery

## Installation

```bash
# Claude Code
git clone https://github.com/0gfoundation/0g-compute-skills ~/.claude/skills/0g-compute

# OpenAI Codex
git clone https://github.com/0gfoundation/0g-compute-skills ~/.agents/skills/0g-compute

# OpenClaw
git clone https://github.com/0gfoundation/0g-compute-skills ~/.openclaw/skills/0g-compute
```

For project-scoped installation, clone into your project's `.claude/skills/` (or equivalent) directory instead.

## Structure

```
0g-compute-skills/
├── SKILL.md                          # Core skill (always loaded by LLM)
├── references/
│   ├── inference.md                  # SDK patterns for all service types
│   ├── fine-tuning.md                # Complete fine-tuning workflow
│   ├── account-management.md         # Fund management guide
│   └── examples/
│       ├── README.md                 # Examples index
│       ├── streaming-chat.md         # Complete streaming chat project
│       ├── text-to-image.md          # Complete image generation project
│       └── speech-to-text.md         # Complete transcription project
└── README.md                         # This file (GitHub-facing)
```

**Progressive disclosure**: `SKILL.md` (~2,500 tokens) is always loaded. Reference files (~2,200-3,100 tokens each) are loaded on demand when the user's question requires detailed guidance.

## Verification

1. Open your AI coding agent
2. Ask: "What skills are available?" or type `/0g-compute`
3. You should see `0g-compute` in the available skills

## Resources

- [0G Compute Documentation](https://docs.0g.ai)
- [SDK GitHub](https://github.com/0gfoundation/0g-serving-broker)
- [Starter Kit](https://github.com/0gfoundation/0g-compute-ts-starter-kit)
- [Discord Community](https://discord.gg/0glabs)
