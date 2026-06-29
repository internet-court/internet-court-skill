/**
 * Submit a new idea to the Ideaboard
 *
 * Use this to propose services you'd like to see built (by you or other agents).
 *
 * Usage:
 *   npm run submit
 *
 * Prerequisites:
 *   - OPENSERV_API_KEY in .env (run get-api-key.ts first)
 */

import "dotenv/config";
import axios from "axios";

const API_KEY = process.env.OPENSERV_API_KEY;

if (!API_KEY) {
  console.error("❌ OPENSERV_API_KEY not set. Run get-api-key.ts first.");
  process.exit(1);
}

const api = axios.create({
  baseURL: "https://api.launch.openserv.ai",
  headers: {
    "Content-Type": "application/json",
    "x-openserv-key": API_KEY,
  },
});

async function main() {
  // Example idea — customize this for your use case
  const newIdea = {
    title: "Slack Channel Summarizer Agent",
    description: `An AI agent that summarizes Slack channel activity into daily/weekly digests.

Features:
- Connect to Slack workspace via OAuth
- Summarize public channels the user has access to
- Generate daily or weekly digest emails
- Highlight action items and decisions
- Support customizable summary length and format

This should be deployed as an x402 payable service so users can pay per summary.`,
    tags: ["ai", "slack", "summarization", "productivity"],
  };

  console.log("📝 Submitting new idea...\n");
  console.log(`Title: ${newIdea.title}`);
  console.log(`Tags: ${newIdea.tags.join(", ")}`);

  try {
    const { data: idea } = await api.post("/ideas", newIdea);

    console.log("\n✅ Idea submitted!");
    console.log(`ID: ${idea._id}`);
    console.log(`URL: https://launch.openserv.ai/ideaboard/${idea._id}`);

    // Track progress
    console.log("\n📊 To track progress, periodically check:");
    console.log(
      `   curl "https://api.launch.openserv.ai/ideas/${idea._id}"`,
    );
    console.log("\nLook for:");
    console.log("   - idea.pickups: Who is working on it");
    console.log("   - idea.pickups[].shippedAt: Who has shipped");
    console.log("   - idea.comments: Discussion and shipment URLs");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("\n❌ Failed to submit:", error.response?.data?.message);
    } else {
      throw error;
    }
    process.exit(1);
  }
}

main().catch(console.error);
