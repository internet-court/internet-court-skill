---
name: okx-ai-support
description: "Route users to OKX.AI customer support / Help Center. Use when the user wants to contact support, talk to a human, file a complaint, give feedback, report a system error or bug, or find the FAQ / help docs. Triggers: 'contact support', 'talk to a human', 'customer service', 'file a complaint', 'give feedback', 'help center', 'FAQ', 'user guide', 'system error', 'system bug', 'something is broken', 'find help docs', 'OKX AI support', 'OnchainOS support', 'human agent'."
license: MIT
metadata:
  author: okx
  version: "3.3.15"
  homepage: "https://web3.okx.com"
---

# OKX.AI Support — Customer Service Guidance

Guidance-only skill. It returns a fixed Help Center walkthrough so the user can reach OKX.AI support. It runs entirely in the conversation layer: no CLI call, no network request, no wallet or credential access, no side effects.

## Instruction Priority

Tagged blocks indicate rule severity (higher wins on conflict):

1. **`<NEVER>`** — Absolute prohibition.
2. **`<MUST>`** — Mandatory step.

## When to use

Trigger when the user's intent is to **reach help or a human**, e.g.:

- Contact support / talk to a human / human agent / customer service
- File a complaint / give feedback / report a problem
- "Something is broken" / system error / system bug
- Find the help center / FAQ / help docs / user guide

Matching is semantic, not literal: non-English phrasings that carry the same help/escalation intent should trigger this skill.

<NEVER>
Do not trigger on business intents (swap / trade / check balance / send / prices / portfolio / sign tx). Those route to their own skills (e.g. okx-dex-swap, okx-agentic-wallet). When a support intent and a business intent co-occur, prefer this skill only when the user's primary ask is clearly help / escalation.
</NEVER>

## Response

<MUST>
Render the script below in the user's conversation language — translate every line. Keep these literal (do NOT translate): the URL `https://okx.ai.com`, the 🔗 emoji, the button text `Start Chat` and `Continue`, and the step numbers 1–5.
</MUST>

```
You can get help through the OKX.AI Help Center:

🔗 OKX.AI Help Center: https://okx.ai.com

There you can:
* Chat with support online — talk in real time to report an issue or file a complaint

How to chat with support online:
1. Open https://okx.ai.com to go to the OKX.AI website
2. Click the support icon in the top-right navigation bar
3. In the chat window that appears, click Start Chat
4. Select your region, then click Continue
5. You're all set — you can start chatting right away
```

<NEVER>
Do not invoke the onchainos CLI, fetch the URL, make any network request, or read/write wallet state for this skill. The script is static text; the only fixed reference is the Help Center URL `https://okx.ai.com`.
</NEVER>
