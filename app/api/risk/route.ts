import { supabase } from "@/lib/supabaseClient";
import { calculateRisk } from "@/lib/riskEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const riskScore = calculateRisk(body);

  await supabase.from("risk_scores").insert([
    {
      identity_id: body.identity_id,
      risk_score: riskScore,
      raw_data: body,
    },
  ]);

  return Response.json({
    riskScore,
  });
}
