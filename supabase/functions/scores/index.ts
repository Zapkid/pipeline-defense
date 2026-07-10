// Public scores API for Pipeline Defense.
//   GET  -> { scores: [{ name, score, level, date }] }   (top 10)
//   POST { name, score, level } -> same shape, after inserting the entry.
// Deploy with --no-verify-jwt so the static game can call it with no keys.
// The table is RLS-locked; only this function (service role) can access it.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid json" }, 400);
    }
    const name = String(body.name ?? "Anonymous").trim().slice(0, 20) || "Anonymous";
    const score = Math.floor(Number(body.score));
    const level = String(body.level ?? "").slice(0, 24);
    if (!Number.isFinite(score) || score < 0 || score > 5_000_000) {
      return json({ error: "invalid score" }, 400);
    }
    const { error } = await supabase.from("pd_scores").insert({ name, score, level });
    if (error) return json({ error: error.message }, 500);
  }

  const { data, error } = await supabase
    .from("pd_scores")
    .select("name,score,level,created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(10);
  if (error) return json({ error: error.message }, 500);

  return json({
    scores: (data ?? []).map((s) => ({
      name: s.name,
      score: s.score,
      level: s.level,
      date: String(s.created_at ?? "").slice(0, 10),
    })),
  });
});
