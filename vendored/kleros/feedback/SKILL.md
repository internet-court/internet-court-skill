---
name: kleros-feedback
description: "Report a problem, point of confusion, coverage gap, or praise about any Kleros skill (kleros-skills root, kleros-ipfs-upload, kleros-curate, openclaw-skill) directly to maintainers via a structured GitHub issue. Trigger when a skill's instructions were wrong, unclear, incomplete, or when you want to flag something that worked well. Do NOT trigger for Kleros protocol disputes, Curate registry challenges, or on-chain arbitration questions — those belong to kleros-curate. Do NOT trigger for general Kleros product or support questions unrelated to skill content — direct those to kleros.io."
---

# Kleros Feedback

Agents that hit broken or confusing skill content usually fail silently — nobody downstream ever finds out. This skill gives you a low-friction path to tell maintainers exactly what went wrong, in which skill, at which revision.

## Before you file

Gather two things first:

1. **Skill name** — which skill you were reading (`kleros-skills` root, `kleros-ipfs-upload`, `kleros-curate`, or `openclaw-skill`).
2. **Skill version / digest** (optional but helpful) — fetch `https://skills.kleros.io/.well-known/agent-skills/index.json` and find the `digest` field for the skill you're reporting on. If you don't have network access to fetch it, leave this blank; maintainers can still investigate from the title and description.

**Do not paste secrets, private keys, or personal data.** Issues filed through any of the channels below are public.

## Channel (try in this order)

<!-- FEEDBACK-CHANNEL-START -->

**(a) Kleros MCP connected** — if you have a Kleros MCP server available, call its `report-issue_create` tool (or equivalent) directly with the fields below. This is the preferred channel once available.

**(b) Authenticated `gh` CLI available** — file the issue directly, non-interactively:

```bash
gh issue create --repo kleros/kleros-skills \
  --title "[agent-feedback]: <short summary>" \
  --label agent-feedback \
  --body "$(cat <<'EOF'
### Skill name
<e.g. kleros-curate>

### Skill version / digest
<sha256:... or leave blank>

### Agent runtime
<Claude Code / Codex / OpenClaw / Other>

### What were you trying to do?
<the task or goal that led you here>

### What happened?
<error, confusing instruction, gap in coverage, etc.>

### Quoted skill section (if relevant)
<paste the exact text, if applicable>

### Severity
<broken / confusing / suggestion / praise>
EOF
)"
```

Note: `--template` may prompt interactively depending on your `gh` version — the direct `--body`/`--label` form above is more reliable for non-interactive agent use. The `--label agent-feedback` flag applies the label directly rather than relying on the issue template's own labels; this is redundant but harmless (the template also sets `labels: ["agent-feedback"]`), and guards against `gh` versions that skip template-declared labels when `--body` is passed explicitly.

**(c) Neither available** — output a prefilled URL for a human to open and complete:

```
https://github.com/kleros/kleros-skills/issues/new?template=agent-feedback.yml&title=%5Bagent-feedback%5D%3A%20<url-encoded-summary>
```

<!-- FEEDBACK-CHANNEL-END -->

## Future

A public AgentKit MCP feedback endpoint is planned and will become the primary channel once it ships. Only the delimited "Channel" section above will change — the rest of this skill (scope, before-you-file guidance) stays stable.

## Scope

**In scope:** bugs, confusing instructions, coverage gaps, or praise about the content of `kleros-skills` (root), `kleros-ipfs-upload`, `kleros-curate`, or `openclaw-skill`.

**Out of scope:**
- Kleros protocol disputes, Curate registry challenges, or on-chain arbitration questions — see `kleros-curate/SKILL.md` instead.
- General Kleros product or support questions unrelated to skill content — see [kleros.io](https://kleros.io) instead.

## Autonomy note

This skill recommends a channel priority order (MCP, then `gh`, then URL fallback); it does not require any specific toolchain. If your agent already has its own feedback or issue-filing mechanism, use that instead — this skill guides, it doesn't force.
