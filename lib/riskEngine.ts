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

export type EventInsight = {
severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
impact: number;
confidence: string;
explanation: string;
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
const weights = industryWeights[industry];

let score = 0;

for (const event of events) {
score += weights[event.type];
}

return Math.min(score, 100);
}

export function getEventInsight(
type: RiskEventType
): EventInsight {
switch (type) {
case "LOGIN_FAILURE":
return {
severity: "LOW",
impact: 10,
confidence: "84%",
explanation:
"Authentication failure detected. Possible credential mismatch or brute-force attempt.",
};

```
case "DEVICE_UNKNOWN":
  return {
    severity: "MEDIUM",
    impact: 20,
    confidence: "88%",
    explanation:
      "Login attempt from an unrecognized device not previously associated with this user.",
  };

case "LOCATION_ANOMALY":
  return {
    severity: "HIGH",
    impact: 25,
    confidence: "92%",
    explanation:
      "Access attempt originated from an unusual geographic location outside normal behavior patterns.",
  };

case "IMPOSSIBLE_TRAVEL":
  return {
    severity: "CRITICAL",
    impact: 40,
    confidence: "97%",
    explanation:
      "Geographic login pattern indicates physically impossible travel velocity between sessions.",
  };

default:
  return {
    severity: "LOW",
    impact: 0,
    confidence: "0%",
    explanation:
      "Unknown event type detected.",
  };
```

}
}

export function explainThreat(
type: RiskEventType
): EventInsight {
return getEventInsight(type);
}

export function createTimestamp() {
return new Date().toLocaleTimeString();
}
