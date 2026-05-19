import { calculateRisk } from "@/lib/riskEngine";
import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  const input = req.body;

  const result = calculateRisk(input);

  await supabase.from("risk_scores").insert([
    {
      risk: result.risk,
      level: result.level,
      created_at: new Date().toISOString(),
    },
  ]);

  await supabase.from("audit_logs").insert([
    {
      event: "risk_evaluated",
      risk: result.risk,
      level: result.level,
      created_at: new Date().toISOString(),
    },
  ]);

  res.status(200).json(result);
}
