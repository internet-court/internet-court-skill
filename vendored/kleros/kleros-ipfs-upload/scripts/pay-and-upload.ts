/**
 * Pay-and-upload a file to IPFS via the Kleros x402 gateway on Base mainnet.
 *
 * The x402-fetch SDK handles the 402 → sign EIP-3009 → retry-with-X-PAYMENT
 * loop transparently. Each successful run spends $0.01 USDC on Base mainnet.
 *
 * Run standalone:
 *
 *   cd path/to/this-dir
 *   npm install
 *   EVM_PRIVATE_KEY=0x... npx tsx pay-and-upload.ts ./somefile.txt
 *
 * Env vars:
 *   EVM_PRIVATE_KEY  payer's Base mainnet private key (required)
 *   GATEWAY_URL      defaults to https://kleros-ipfs-gateway.fly.dev
 *   OPERATION        free-form tag, defaults to "evidence"
 *
 * Output: on success, prints each returned IPFS CID on its own line so the
 * calling agent can parse them with a one-liner.
 */

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { wrapFetchWithPayment, createSigner } from "x402-fetch";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: tsx pay-and-upload.ts <file-path>");
  process.exit(1);
}

const rawKey = process.env.EVM_PRIVATE_KEY;
if (!rawKey) {
  console.error("EVM_PRIVATE_KEY env var is required");
  process.exit(1);
}
const privateKey = (
  rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`
) as `0x${string}`;

const gatewayUrl =
  process.env.GATEWAY_URL ?? "https://kleros-ipfs-gateway.fly.dev";
const operation = process.env.OPERATION ?? "evidence";

const signer = await createSigner("base", privateKey);
const fetchWithPay = wrapFetchWithPayment(fetch, signer);

const form = new FormData();
const bytes = await readFile(filePath);
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

if (!res.ok) {
  console.error(`status: ${res.status}`);
  console.error(`body:   ${text}`);
  process.exit(1);
}

const parsed = JSON.parse(text) as {
  message: string;
  cids: string[];
  urls?: string[];
  inconsistentCids?: string[];
};

for (const cid of parsed.cids) console.log(cid);

for (const u of parsed.urls ?? []) console.error(`url=${u}`);

if (parsed.inconsistentCids && parsed.inconsistentCids.length > 0) {
  console.error(
    `warning: inconsistentCids=${JSON.stringify(parsed.inconsistentCids)}`
  );
}
