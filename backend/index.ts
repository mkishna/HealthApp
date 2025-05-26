// Load environment variables
import "std/dotenv/load.ts";

// HTTP server
import { serve } from "std/http/server.ts";

// Supabase client
import { createClient } from "supabase";

// Load Supabase API credentials from .env
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials missing! Check your .env file.");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (_req) => {
  try {
    console.log("🚀 Running calculate_trust_score RPC...");

    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    // Run RPC and exclude NULL values
    const { data: scores, error: rpcError } = await supabase.rpc("calculate_trust_score");

    if (rpcError) {
      console.error("❌ RPC failed:", rpcError.message);
      return new Response(
        JSON.stringify({ error: rpcError.message, context: "Failed to run calculate_trust_score RPC" }),
        { status: 500 }
      );
    }

    if (!Array.isArray(scores)) {
      console.error("❌ RPC returned invalid format:", scores);
      return new Response(
        JSON.stringify({ error: "Invalid RPC response", received: scores }),
        { status: 500 }
      );
    }

    // Filter out null trust scores before updating
    const validScores = scores.filter(({ trust_score }) => trust_score !== null);

    await Promise.all(
      validScores.map(({ id, trust_score }) =>
        supabase.from("surgeons").update({ trust_score }).eq("id", id)
      )
    );

    console.log("✅ Trust scores updated for", validScores.length, "surgeons");
    return new Response(
      JSON.stringify({ message: "Trust scores updated", count: validScores.length }),
      { status: 200 }
    );
  } catch (err: unknown) {
    // Type-safe error handling
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("🔥 Unexpected error:", err);

    return new Response(
      JSON.stringify({ error: "Internal server error", details: message }),
      { status: 500 }
    );
  }
});
