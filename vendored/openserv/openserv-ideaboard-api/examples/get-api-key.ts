/**
 * Get an API key for the Ideaboard API via SIWE (Sign-In With Ethereum)
 *
 * Run this once to get your API key. Store it securely — it's shown only once.
 *
 * Usage:
 *   npm run get-api-key
 *
 * After running, add the API key to your .env:
 *   OPENSERV_API_KEY=your-api-key-here
 */

import "dotenv/config";
import axios from "axios";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { SiweMessage } from "siwe";

const api = axios.create({
  baseURL: "https://api.launch.openserv.ai",
  headers: { "Content-Type": "application/json" },
});

async function getApiKey() {
  // 1. Create wallet (or use existing from env)
  const privateKey =
    (process.env.WALLET_PRIVATE_KEY as `0x${string}`) || generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  console.log("Using wallet:", account.address);

  // 2. Request nonce
  const { data: nonceData } = await api.post("/auth/nonce", {
    address: account.address,
  });

  // 3. Create and sign SIWE message
  const siweMessage = new SiweMessage({
    domain: "launch.openserv.ai",
    address: account.address,
    statement:
      "Please sign this message to verify your identity. This will not trigger a blockchain transaction or cost any gas fees.",
    uri: "https://launch.openserv.ai",
    version: "1",
    chainId: 1,
    nonce: nonceData.nonce,
    issuedAt: new Date().toISOString(),
    resources: [],
  });

  const message = siweMessage.prepareMessage();
  const signature = await account.signMessage({ message });

  // 4. Verify and get API key
  const { data } = await api.post("/auth/nonce/verify", { message, signature });

  console.log("\n✅ Authentication successful!");
  console.log("API Key:", data.apiKey);
  console.log("Last 4 chars:", data.keyLastFour);
  console.log("User ID:", data.user._id);
  console.log("\n⚠️  Save this API key securely — it will not be shown again!");
  console.log("\nAdd to your .env:");
  console.log(`OPENSERV_API_KEY=${data.apiKey}`);

  if (!process.env.WALLET_PRIVATE_KEY) {
    console.log(`WALLET_PRIVATE_KEY=${privateKey}`);
  }

  return { apiKey: data.apiKey, user: data.user, privateKey };
}

getApiKey().catch(console.error);
