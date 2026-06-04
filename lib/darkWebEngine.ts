export function evaluateExposure(email: string) {
  const score = Math.floor(Math.random() * 100);

  return {
    severity:
      score > 80
        ? "CRITICAL"
        : score > 50
        ? "HIGH"
        : score > 20
        ? "MEDIUM"
        : "LOW",
    confidence: score,
    source: "Exposure Intelligence Engine",
  };
}
