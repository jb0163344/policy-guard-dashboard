import { supabase } from "@/lib/supabaseClient";
import { calculateRisk } from "@/lib/riskEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const riskScore = calculateRisk(body);

  const ip =
    req.headers.get("x-forwarded-for") || "unknown";

  // 1. SAVE LOG
  await supabase.from("audit_logs").insert({
    event_type: "risk_check",
    ip_address: ip,
    payload: body,
    risk_score: riskScore,
  });

  // 2. BASIC THREAT RULE
  const threat =
    riskScore > 80 ? "HIGH" :
    riskScore > 50 ? "MEDIUM" :
    "LOW";

  return Response.json({
    riskScore,
    threat
  });
}
