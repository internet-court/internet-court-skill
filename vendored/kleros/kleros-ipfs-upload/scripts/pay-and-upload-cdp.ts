/**
 * Pay-and-upload a file to IPFS via the Kleros x402 gateway using a Coinbase
 * CDP server account instead of an exported EVM private key. Intended for
 * hosted agents (OpenClaw, server-side workers) where exporting a private key
 * is not an option.
 *
 * The CDP account object returned by `cdp.evm.getAccount()` implements
 * `signTypedData()`, which is exactly what `x402-fetch.wrapFetchWithPayment`
 * needs to sign the EIP-3009 USDC payment authorization — so the account is
 * passed directly to the SDK without any extra adapter code.
 *
 * Run standalone:
 *
 *   cd path/to/this-dir
 *   npm install
 *   CDP_API_KEY_ID=... CDP_API_KEY_SECRET=... CDP_WALLET_SECRET=... \
 *     CDP_ACCOUNT_NAME=blaise-main npx tsx pay-and-upload-cdp.ts ./somefile.txt
 *
 * Env vars (precedence: process env > CDP_CREDS_PATH file):
 *   CDP_API_KEY_ID      CDP API key ID (required)
 *   CDP_API_KEY_SECRET  CDP API key secret (required)
 *   CDP_WALLET_SECRET   CDP wallet secret (required)
 *   CDP_ACCOUNT_NAME    CDP EVM server account name (required)
 *   CDP_CREDS_PATH      Optional. Path to a .env-style file containing any of
 *                       the above four variables. Loaded only when one or more
 *                       of the env vars above is missing.
 *   GATEWAY_URL         defaults to https://kleros-ipfs-gateway.fly.dev
 *   OPERATION           defaults to "evidence"
 *
 * Output:
 *   stdout = one CID per line (matches scripts/pay-and-upload.ts so capture
 *            with $(npx tsx pay-and-upload-cdp.ts ...) works the same way).
 *   stderr = diagnostics (payer address, USDC balance, POST line, derived URLs).
 */

import { readFile, readFile as fsReadFile } from "node:fs/promises";
import { basename } from "node:path";
import { CdpClient } from "@coinbase/cdp-sdk";
import { wrapFetchWithPayment } from "x402-fetch";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: tsx pay-and-upload-cdp.ts <file-path>");
  process.exit(1);
}

async function loadEnvFile(path: string): Promise<Record<string, string>> {
  const raw = await fsReadFile(path, "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const required = [
  "CDP_API_KEY_ID",
  "CDP_API_KEY_SECRET",
  "CDP_WALLET_SECRET",
  "CDP_ACCOUNT_NAME",
] as const;

const creds: Record<string, string | undefined> = {};
for (const key of required) creds[key] = process.env[key];

if (process.env.CDP_CREDS_PATH && required.some((k) => !creds[k])) {
  const fromFile = await loadEnvFile(process.env.CDP_CREDS_PATH);
  for (const key of required) {
    if (!creds[key]) {
      // Tolerate either the bare key (CDP_API_KEY_ID) or the un-prefixed form
      // used in some CDP cred bundles (API_KEY_ID).
      creds[key] = fromFile[key] ?? fromFile[key.replace(/^CDP_/, "")];
    }
  }
}

for (const key of required) {
  if (!creds[key]) {
    console.error(
      `${key} is required (set in env, or in a CDP_CREDS_PATH .env file)`
    );
    process.exit(1);
  }
}

const gatewayUrl =
  process.env.GATEWAY_URL ?? "https://kleros-ipfs-gateway.fly.dev";
const operation = process.env.OPERATION ?? "evidence";

const cdp = new CdpClient({
  apiKeyId: creds.CDP_API_KEY_ID!,
  apiKeySecret: creds.CDP_API_KEY_SECRET!,
  walletSecret: creds.CDP_WALLET_SECRET!,
});

const account = await cdp.evm.getAccount({ name: creds.CDP_ACCOUNT_NAME! });
console.error(`payer=${account.address}`);

try {
  const balances = await cdp.evm.listTokenBalances({
    address: account.address,
    network: "base",
    pageSize: 100,
  });
  const usdc = (balances.balances ?? []).find(
    (b) => b.token?.symbol === "USDC"
  );
  if (usdc) {
    const human =
      Number(usdc.amount.amount) / 10 ** Number(usdc.amount.decimals);
    console.error(`base_usdc=${human} USDC`);
  } else {
    console.error("base_usdc=0 USDC");
  }
} catch (err) {
  console.error(`balance_check_warning=${(err as Error)?.message ?? err}`);
}

const fetchWithPay = wrapFetchWithPayment(fetch, account);

const bytes = await readFile(filePath);
const form = new FormData();
form.append(
  "file",
  new Blob([bytes], { type: "application/octet-stream" }),
  basename(filePath)
);

const url = `${gatewayUrl}/upload-to-ipfs?operation=${encodeURIComponent(
  operation
)}`;
console.error(`POST ${url}`);

const res = await fetchWithPay(url, { method: "POST", body: form });
const text = await res.text();
console.error(`status=${res.status}`);

if (!res.ok) {
  console.error(text);
  process.exit(1);
}

const parsed = JSON.parse(text) as {
  message?: string;
  cids?: string[];
  urls?: string[];
  inconsistentCids?: string[];
};

for (const cid of parsed.cids ?? []) console.log(cid);

for (const u of parsed.urls ?? []) console.error(`url=${u}`);

if (parsed.inconsistentCids && parsed.inconsistentCids.length > 0) {
  console.error(
    `warning_inconsistentCids=${JSON.stringify(parsed.inconsistentCids)}`
  );
}
