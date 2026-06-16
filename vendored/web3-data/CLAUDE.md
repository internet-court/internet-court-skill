# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

web3-data-skill — A Claude Code skill for exploring Web3 on-chain data using [Chainbase CLI](https://github.com/chainbase-labs/cli).

## Structure

```
├── SKILL.md                    # Skill 定义：路由逻辑、工作流、Chain ID 映射
└── references/
    └── api-endpoints.md        # 完整 API 端点参考文档（38 个端点）
```

## Key Conventions

- 数据查询统一通过 `chainbase` CLI 执行（`npm install -g chainbase-cli`）
- 默认使用 `demo` API Key，可通过 `chainbase config set api-key` 或环境变量 `CHAINBASE_API_KEY` 覆盖
- 默认链为 Ethereum (chain 1)，通过 `--chain <id>` 指定其他链
- 使用 `--json` 获取机器可解析的 JSON 输出
- SQL API 为异步模式，CLI 会自动轮询结果

## Testing

```bash
# 测试 token 查询
chainbase token top-holders 0xdAC17F958D2ee523a2206206994597C13D831ec7 --limit 3

# 测试 ENS 解析
chainbase domain ens-resolve vitalik.eth

# 测试 SQL API
chainbase sql execute "SELECT * FROM ethereum.blocks LIMIT 1"
```
