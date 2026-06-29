#!/usr/bin/env tsx
/**
 * Check Multiple Token Balances (Batch)
 *
 * Tests the batch balance fetching logic from starknet-mcp-server.
 * Uses BalanceChecker contract with fallback to batch RPC.
 *
 * Usage: tsx check-balances.ts
 * Requires .env with STARKNET_RPC_URL and STARKNET_ACCOUNT_ADDRESS
 * Optional: STARKNET_RPC_SPEC_VERSION=0.9.0|0.10.0
 */

import 'dotenv/config';
import { RpcProvider, Contract, uint256 } from 'starknet';
import { fetchVerifiedTokenBySymbol } from '@avnu/avnu-sdk';
import { resolveRpcSpecVersion } from './rpc-spec-version.ts';

const DEFAULT_TOKENS = ['ETH', 'STRK', 'USDC', 'USDT'];
const BALANCE_CHECKER_ADDRESS = '0x031ce64a666fbf9a2b1b2ca51c2af60d9a76d3b85e5fbfb9d5a8dbd3fedc9716';

const BALANCE_CHECKER_ABI = [
  {
    type: 'struct',
    name: 'core::integer::u256',
    members: [
      { name: 'low', type: 'core::integer::u128' },
      { name: 'high', type: 'core::integer::u128' },
    ],
  },
  {
    type: 'struct',
    name: 'governance::balance_checker::NonZeroBalance',
    members: [
      { name: 'token', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'balance', type: 'core::integer::u256' },
    ],
  },
  {
    type: 'function',
    name: 'get_balances',
    inputs: [
      { name: 'address', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'tokens', type: 'core::array::Span::<core::starknet::contract_address::ContractAddress>' },
    ],
    outputs: [
      { type: 'core::array::Span::<governance::balance_checker::NonZeroBalance>' },
    ],
    state_mutability: 'view',
  },
];

const ERC20_ABI = [{
  name: 'balanceOf',
  type: 'function',
  inputs: [{ name: 'account', type: 'felt' }],
  outputs: [{ name: 'balance', type: 'Uint256' }],
  stateMutability: 'view',
}];

type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
};

type TokenBalanceResult = {
  token: string;
  tokenAddress: string;
  balance: bigint;
  decimals: number;
};

function normalizeAddress(addr: string): string {
  return '0x' + BigInt(addr).toString(16).padStart(64, '0');
}

function formatAmount(amount: bigint, decimals: number): string {
  if (decimals === 0) {
    return amount.toString();
  }
  const amountStr = amount.toString().padStart(decimals + 1, '0');
  const whole = amountStr.slice(0, -decimals) || '0';
  const fraction = amountStr.slice(-decimals).slice(0, 6);
  return `${whole}.${fraction}`;
}

async function fetchTokenInfo(symbols: string[]): Promise<TokenInfo[]> {
  return Promise.all(
    symbols.map(async (symbol) => {
      const token = await fetchVerifiedTokenBySymbol(symbol);
      return {
        symbol,
        address: token.address,
        decimals: token.decimals,
      };
    })
  );
}

async function fetchViaBalanceChecker(
  provider: RpcProvider,
  walletAddress: string,
  tokenInfos: TokenInfo[]
): Promise<TokenBalanceResult[]> {
  const balanceChecker = new Contract({
    abi: BALANCE_CHECKER_ABI,
    address: BALANCE_CHECKER_ADDRESS,
    providerOrAccount: provider,
  });
  const tokenAddresses = tokenInfos.map((t) => t.address);
  const result = await balanceChecker.get_balances(walletAddress, tokenAddresses);

  const balanceMap = new Map<string, bigint>();
  for (const item of result) {
    const addr = normalizeAddress('0x' + BigInt(item.token).toString(16));
    const balance = typeof item.balance === 'bigint'
      ? item.balance
      : uint256.uint256ToBN(item.balance);
    balanceMap.set(addr, balance);
  }

  return tokenInfos.map((info) => ({
    token: info.symbol,
    tokenAddress: info.address,
    balance: balanceMap.get(normalizeAddress(info.address)) ?? BigInt(0),
    decimals: info.decimals,
  }));
}

async function fetchViaBatchRpc(
  provider: RpcProvider,
  walletAddress: string,
  tokenInfos: TokenInfo[]
): Promise<TokenBalanceResult[]> {
  const balanceResults = await Promise.all(
    tokenInfos.map(async (info) => {
      const contract = new Contract({
        abi: ERC20_ABI,
        address: info.address,
        providerOrAccount: provider,
      });
      const balanceResult = await contract.balanceOf(walletAddress);
      const rawBalance = balanceResult?.balance ?? balanceResult;
      return typeof rawBalance === 'bigint' ? rawBalance : uint256.uint256ToBN(rawBalance);
    })
  );

  return tokenInfos.map((info, i) => ({
    token: info.symbol,
    tokenAddress: info.address,
    balance: balanceResults[i],
    decimals: info.decimals,
  }));
}

async function main(): Promise<void> {
  const rpcUrl = process.env.STARKNET_RPC_URL;
  const rpcSpecVersion = resolveRpcSpecVersion(process.env.STARKNET_RPC_SPEC_VERSION);
  const address = process.env.STARKNET_ACCOUNT_ADDRESS;

  if (!rpcUrl || !address) {
    console.error('Missing STARKNET_RPC_URL or STARKNET_ACCOUNT_ADDRESS');
    process.exit(1);
  }

  console.log('Fetching token info from avnu...');
  const tokenInfos = await fetchTokenInfo(DEFAULT_TOKENS);

  const provider = new RpcProvider({
    nodeUrl: rpcUrl,
    specVersion: rpcSpecVersion,
    batch: 0,
  });
  const tokens = tokenInfos.map((t) => t.symbol);

  console.log(`Checking balances for ${address}\n`);
  console.log(`Tokens: ${tokens.join(', ')}\n`);

  let balances: TokenBalanceResult[];
  let method: string;

  try {
    console.log('Trying BalanceChecker contract...');
    balances = await fetchViaBalanceChecker(provider, address, tokenInfos);
    method = 'balance_checker';
    console.log('BalanceChecker succeeded\n');
  } catch (err) {
    console.log(`BalanceChecker failed: ${err instanceof Error ? err.message : err}`);
    console.log('Falling back to batch RPC...');
    balances = await fetchViaBatchRpc(provider, address, tokenInfos);
    method = 'batch_rpc';
    console.log('Batch RPC succeeded\n');
  }

  console.log('━'.repeat(60));
  console.log('Token'.padEnd(8) + 'Balance'.padEnd(20) + 'Raw');
  console.log('━'.repeat(60));

  for (const b of balances) {
    const formatted = formatAmount(b.balance, b.decimals);
    console.log(
      b.token.padEnd(8) +
      formatted.padEnd(20) +
      b.balance.toString()
    );
  }

  console.log('━'.repeat(60));
  console.log(`\nMethod: ${method}`);
  console.log(`Tokens queried: ${tokens.length}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
