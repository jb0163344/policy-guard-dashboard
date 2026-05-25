import { supabase } from "@/lib/supabaseClient";
import { calculateRisk } from "@/lib/riskEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const riskScore = calculateRisk(body);

  const ip =
    req.headers.get("x-forwarded-for") ||
    "unknown";

  await supabase.from("audit_logs").insert({
    event_type: "risk_calculation",
    ip_address: ip,
    payload: body,
    risk_score: riskScore,
    created_at: new Date().toISOString(),
  });

  return Response.json({ riskScore });
}
