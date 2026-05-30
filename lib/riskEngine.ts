export type RiskEventType =
  | "LOGIN_FAILURE"
  | "DEVICE_UNKNOWN"
  | "LOCATION_ANOMALY"
  | "IMPOSSIBLE_TRAVEL";

export type RiskEvent = {
  type: RiskEventType;
};

export function calculateRisk(
  events: RiskEvent[]
): number {
  let score = 0;

  for (const event of events) {
    switch (event.type) {
      case "LOGIN_FAILURE":
        score += 10;
        break;

      case "DEVICE_UNKNOWN":
        score += 20;
        break;

      case "LOCATION_ANOMALY":
        score += 25;
        break;

      case "IMPOSSIBLE_TRAVEL":
        score += 40;
        break;
    }
  }

  return Math.min(score, 100);
}

export function explainThreat(
  type: RiskEventType
) {
  switch (type) {
    case "LOGIN_FAILURE":
      return {
        severity: "LOW",
        confidence: "84%",
        impact: "+10",
        explanation:
          "Multiple authentication failures detected. This may indicate credential misuse or password guessing activity.",
      };

    case "DEVICE_UNKNOWN":
      return {
        severity: "MEDIUM",
        confidence: "88%",
        impact: "+20",
        explanation:
          "Authentication attempt detected from a device not previously associated with this account.",
      };

    case "LOCATION_ANOMALY":
      return {
        severity: "HIGH",
        confidence: "92%",
        impact: "+25",
        explanation:
          "User activity originated from an unexpected geographic location relative to established behavior.",
      };

    case "IMPOSSIBLE_TRAVEL":
      return {
        severity: "CRITICAL",
        confidence: "97%",
        impact: "+40",
        explanation:
          "Authentication events indicate travel between distant locations within an unrealistic timeframe.",
      };
  }
}
