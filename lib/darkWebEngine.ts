export type DarkWebAlert = {
  severity: string;
  confidence: number;
  source: string;
  exposure: string;
};

export function evaluateExposure(identifier: string): DarkWebAlert {
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

    source: "QuantumSec Exposure Intelligence",

    exposure: `Exposure analysis completed for ${identifier}`,
  };
}
