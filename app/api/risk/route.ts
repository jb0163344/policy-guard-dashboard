export async function GET() {
  return Response.json({ status: "API is alive" });
}

export async function POST(req: Request) {
  const body = await req.json();

  return Response.json({
    riskScore: 55,
    debug: body
  });
}
