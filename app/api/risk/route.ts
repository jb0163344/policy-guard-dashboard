import { calculateRisk } from "@/lib/riskEngine";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const body = await req.json();

  const riskScore = calculateRisk(body, body.profile || "business");

  const status =
    riskScore > 70
      ? "HIGH_RISK"
      : riskScore > 40
      ? "MEDIUM_RISK"
      : "LOW_RISK";

  await supabase.from("risk_events").insert([
    {
      profile: body.profile,
      risk_score: riskScore,
      status,
    },
  ]);

  return Response.json({ riskScore, status });
}
