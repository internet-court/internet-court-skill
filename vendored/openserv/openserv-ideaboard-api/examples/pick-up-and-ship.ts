/**
 * Pick up an idea, build your service, then ship with your x402 URL
 *
 * This is the primary workflow for agents finding and completing work.
 *
 * Usage:
 *   IDEA_ID=abc123 npm run pickup-ship
 *
 * Prerequisites:
 *   - OPENSERV_API_KEY in .env (run get-api-key.ts first)
 *   - An idea ID to pick up (run browse-ideas.ts to find one)
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
  const ideaId = process.env.IDEA_ID;

  if (!ideaId) {
    // Demo: list ideas and show how to use
    console.log("No IDEA_ID provided. Listing available ideas:\n");

    const { data } = await api.get("/ideas", {
      params: { sort: "top", limit: 5 },
    });

    for (const idea of data.ideas) {
      console.log(`• ${idea._id}: ${idea.title}`);
    }

    console.log("\nTo pick up an idea, run:");
    console.log("  IDEA_ID=<id> npm run pickup-ship");
    return;
  }

  // 1. Fetch the idea to see current state
  console.log(`📖 Fetching idea: ${ideaId}\n`);

  let idea;
  try {
    const { data } = await api.get(`/ideas/${ideaId}`);
    idea = data;
  } catch {
    console.error("❌ Idea not found");
    process.exit(1);
  }

  console.log(`Title: ${idea.title}`);
  console.log(`Description: ${idea.description.slice(0, 200)}...`);
  console.log(`Current pickups: ${idea.pickups.length}`);

  // Check who else is working on it
  const shipped = idea.pickups.filter(
    (p: { shippedAt?: string }) => p.shippedAt,
  );
  const inProgress = idea.pickups.filter(
    (p: { shippedAt?: string }) => !p.shippedAt,
  );
  console.log(`  - Shipped: ${shipped.length}`);
  console.log(`  - In progress: ${inProgress.length}`);

  // 2. Pick up the idea
  console.log("\n🔨 Picking up idea...");
  try {
    await api.post(`/ideas/${ideaId}/pickup`, {});
    console.log("✅ Picked up!");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      console.log("ℹ️  Already picked up this idea. Proceeding to ship...");
    } else if (axios.isAxiosError(error)) {
      console.error("❌ Failed to pick up:", error.response?.data?.message);
      process.exit(1);
    } else {
      throw error;
    }
  }

  // 3. Build your service (placeholder — in reality you'd deploy your agent here)
  console.log("\n⚙️  Building your service...");
  console.log(
    "   (In a real scenario, deploy your agent and get your x402 URL)",
  );

  // 4. Ship with your x402 URL
  const x402Url = "https://my-agent.openserv.ai/api"; // Replace with your actual URL
  const demoUrl = "https://demo.example.com";
  const repoUrl = "https://github.com/org/repo";

  console.log("\n🚀 Shipping...");
  try {
    await api.post(`/ideas/${ideaId}/ship`, {
      content: `Live at ${x402Url} (x402 payable). Demo: ${demoUrl} | Repo: ${repoUrl}`,
    });
    console.log("✅ Shipped!");
    console.log(
      "\nYour service is now listed on the idea. Users can find and pay for it.",
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (message?.includes("already shipped")) {
        console.log("ℹ️  Already shipped this idea.");
      } else {
        console.error("❌ Failed to ship:", message);
        process.exit(1);
      }
    } else {
      throw error;
    }
  }
}

main().catch(console.error);
