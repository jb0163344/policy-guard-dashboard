export async function GET() {
  return Response.json({ status: "API working" });
}

export async function POST() {
  return Response.json({ riskScore: 55 });
}
