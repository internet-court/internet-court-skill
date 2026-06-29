/**
 * Minimal starknet.js account connectivity example.
 * Run:
 *   STARKNET_RPC_URL=... STARKNET_ACCOUNT_ADDRESS=0x... STARKNET_PRIVATE_KEY=0x... tsx scripts/account-example.ts
 */

import { Account, RpcProvider } from "starknet";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function main() {
  const rpcUrl = requireEnv("STARKNET_RPC_URL");
  const address = requireEnv("STARKNET_ACCOUNT_ADDRESS");
  const privateKey = requireEnv("STARKNET_PRIVATE_KEY");

  const provider = await RpcProvider.create({ nodeUrl: rpcUrl });
  const account = new Account({
    provider,
    address,
    signer: privateKey,
  });

  const chainId = await provider.getChainId();
  console.log(
    JSON.stringify({
      ok: true,
      accountAddress: account.address,
      chainId: String(chainId),
    }),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }));
  process.exit(1);
});
