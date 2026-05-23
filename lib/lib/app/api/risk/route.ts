import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { calculateRisk } from "@/lib/riskEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const riskScore = calculateRisk(body);

  const { error } = await supabase.from("risk_scores").insert([
    {
      identity_id: body.identity_id,
      risk_score: riskScore,
      raw_data: body
    }
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    riskScore,
    status: "stored"
  });
}
