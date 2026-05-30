export type RiskEventType =
  | "LOGIN_FAILURE"
  | "DEVICE_UNKNOWN"
  | "LOCATION_ANOMALY"
  | "IMPOSSIBLE_TRAVEL";

export type IndustryType =
  | "LAW_FIRM"
  | "HEALTHCARE"
  | "GOVERNMENT"
  | "FINANCE"
  | "ENTERPRISE";

export type RiskEvent = {
  type: RiskEventType;
  timestamp: string;
};

const industryWeights = {
  LAW_FIRM: {
    LOGIN_FAILURE: 10,
    DEVICE_UNKNOWN: 20,
    LOCATION_ANOMALY: 25,
    IMPOSSIBLE_TRAVEL: 40,
  },

  HEALTHCARE: {
    LOGIN_FAILURE: 10,
    DEVICE_UNKNOWN: 25,
    LOCATION_ANOMALY: 30,
    IMPOSSIBLE_TRAVEL: 45,
  },

  GOVERNMENT: {
    LOGIN_FAILURE: 15,
    DEVICE_UNKNOWN: 30,
    LOCATION_ANOMALY: 35,
    IMPOSSIBLE_TRAVEL: 50,
  },

  FINANCE: {
    LOGIN_FAILURE: 15,
    DEVICE_UNKNOWN: 25,
    LOCATION_ANOMALY: 35,
    IMPOSSIBLE_TRAVEL: 50,
  },

  ENTERPRISE: {
    LOGIN_FAILURE: 10,
    DEVICE_UNKNOWN: 20,
    LOCATION_ANOMALY: 25,
    IMPOSSIBLE_TRAVEL: 40,
  },
};

export function calculateRisk(
  events: RiskEvent[],
  industry: IndustryType
): number {
  let score = 0;

  const weights = industryWeights[industry];

  for (const event of events) {
    score += weights[event.type];
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
          "Multiple authentication failures detected.",
      };

    case "DEVICE_UNKNOWN":
      return {
        severity: "MEDIUM",
        confidence: "88%",
        impact: "+20",
        explanation:
          "Authentication attempt detected from an unknown device.",
      };

    case "LOCATION_ANOMALY":
      return {
        severity: "HIGH",
        confidence: "92%",
        impact: "+25",
        explanation:
          "Activity originated from an unexpected location.",
      };

    case "IMPOSSIBLE_TRAVEL":
      return {
        severity: "CRITICAL",
        confidence: "97%",
        impact: "+40",
        explanation:
          "Travel pattern exceeds realistic movement limits.",
      };
  }
}

export function createTimestamp() {
  return new Date().toLocaleTimeString();
}
