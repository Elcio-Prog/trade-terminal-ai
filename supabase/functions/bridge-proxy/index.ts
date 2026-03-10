import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bridge-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tables the bridge is allowed to write to
const ALLOWED_TABLES = new Set([
  "market_candles",
  "market_snapshots",
  "feature_vectors",
  "market_regimes",
  "ai_analysis_logs",
  "ai_signals",
  "execution_commands",
  "trade_orders",
  "account_snapshots",
  "position_snapshots",
  "signal_outcomes",
  "signal_feedback",
  "signal_learning_scores",
  "bridge_agents",
  "system_events",
  "instruments",
  "market_sessions",
  "continuous_market_candles",
  "continuous_market_renko",
  "continuous_feature_vectors",
]);

// Allowed operations
const ALLOWED_OPERATIONS = new Set(["insert", "upsert", "update", "select"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate: require a bridge secret header
    const bridgeSecret = req.headers.get("x-bridge-secret");
    const expectedSecret = Deno.env.get("BRIDGE_SECRET");

    // If BRIDGE_SECRET is configured, validate it
    if (expectedSecret && bridgeSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid bridge secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no BRIDGE_SECRET is set, fall back to checking the Supabase JWT
    if (!expectedSecret) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { table, operation, data, filters, on_conflict, limit, offset, order_by } = await req.json();

    // Validate table
    if (!table || !ALLOWED_TABLES.has(table)) {
      return new Response(
        JSON.stringify({ error: `Table not allowed: ${table}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate operation
    if (!operation || !ALLOWED_OPERATIONS.has(operation)) {
      return new Response(
        JSON.stringify({ error: `Operation not allowed: ${operation}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service_role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let result;

    switch (operation) {
      case "insert": {
        const query = supabase.from(table).insert(data);
        result = await query.select();
        break;
      }
      case "upsert": {
        const query = supabase
          .from(table)
          .upsert(data, on_conflict ? { onConflict: on_conflict } : undefined);
        result = await query.select();
        break;
      }
      case "update": {
        if (!filters || Object.keys(filters).length === 0) {
          return new Response(
            JSON.stringify({ error: "Update requires filters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        let query = supabase.from(table).update(data);
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value as string);
        }
        result = await query.select();
        break;
      }
      case "select": {
        let query = supabase.from(table).select("*", { count: "exact" });

        // Apply filters
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value as string);
          }
        }

        // Apply ordering: accepts array like ["ts_open.asc", "id.desc"]
        if (order_by && Array.isArray(order_by)) {
          for (const clause of order_by) {
            const parts = (clause as string).split(".");
            const column = parts[0];
            const ascending = parts[1] !== "desc";
            query = query.order(column, { ascending });
          }
        }

        // Apply pagination via range (offset-based)
        const pageLimit = typeof limit === "number" ? limit : 1000;
        const pageOffset = typeof offset === "number" ? offset : 0;
        query = query.range(pageOffset, pageOffset + pageLimit - 1);

        result = await query;
        break;
      }
    }

    if (result?.error) {
      console.error("DB error:", result.error);
      return new Response(
        JSON.stringify({ error: result.error.message, details: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result?.data, count: result?.data?.length ?? 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bridge-proxy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
