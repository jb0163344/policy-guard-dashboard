export function detectThreat(logs: any[]) {
  let flags = 0;

  const recent = logs.slice(-10);

  const highRisk = recent.filter(l => l.risk_score > 70);
  if (highRisk.length >= 3) flags++;

  const rapidRequests =
    recent.length >= 8; // simplistic rate detection
  if (rapidRequests) flags++;

  return {
    threatLevel: flags >= 2 ? "HIGH" : flags === 1 ? "MEDIUM" : "LOW"
  };
}
