export type RiskEventType =
  | "LOGIN_FAILURE"
  | "DEVICE_UNKNOWN"
  | "LOCATION_ANOMALY"
  | "IMPOSSIBLE_TRAVEL";

export type RiskEvent = {
  type: RiskEventType;
};

export function calculateRisk(events: RiskEvent[]): number {
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
