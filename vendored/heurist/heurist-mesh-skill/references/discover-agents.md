# Discover More Heurist Mesh Agents

Use these endpoints to discover available agents and choose the right tools for a request.

## Registry Endpoints

- All agents: `https://mesh.heurist.ai/metadata.json`
- x402-enabled agents: `https://mesh.heurist.xyz/x402/agents`

## Discovery Workflow

1. Fetch the full registry from `metadata.json`
2. Filter agents by user intent (token intel, DeFi analytics, social signal, wallet analysis, deep research)
3. Fetch schemas for a shortlist with `mesh_schema` using repeated `agent_id` params
4. Compare parameter requirements and per-tool pricing before execution

## Example

```bash
# Pull full agent registry
curl -sS https://mesh.heurist.ai/metadata.json

# Pull x402-capable agents only
curl -sS https://mesh.heurist.xyz/x402/agents

# Fetch schemas for multiple candidates in one call
curl -sS "https://mesh.heurist.xyz/mesh_schema?agent_id=TokenResolverAgent&agent_id=DefiLlamaAgent&agent_id=AskHeuristAgent"
```
