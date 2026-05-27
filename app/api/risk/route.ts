import { calculateRisk } from "@/lib/riskEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const riskScore = calculateRisk(
    body,
    body.profile || "business"
  );

  return Response.json({
    riskScore,
    profile: body.profile,
    status:
      riskScore > 70
        ? "HIGH_RISK"
        : riskScore > 40
        ? "MEDIUM_RISK"
        : "LOW_RISK",
  });
}
