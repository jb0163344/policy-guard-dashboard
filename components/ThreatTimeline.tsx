"use client";

import { RiskEvent, getEventInsight } from "../lib/riskEngine";

type Props = {
  events: RiskEvent[];
};

export default function ThreatTimeline({ events }: Props) {
  // SAFE GUARD (prevents crashes if events is undefined/null)
  const safeEvents = events ?? [];

  // EMPTY STATE (prevents blank UI confusion)
  if (safeEvents.length === 0) {
    return (
      <div>
        <h1>Threat Intelligence Timeline</h1>
        <p style={{ opacity: 0.6, marginTop: 10 }}>
          No events yet. Trigger an action from Mission Control.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1>Threat Intelligence Timeline</h1>

      {safeEvents.map((event, index) => {
        const insight = getEventInsight(event.type);

        return (
          <div key={index}>
            <div
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <div
                style={{
                  opacity: 0.6,
                  fontSize: 12,
                }}
              >
                {event.timestamp}
              </div>

              <div
                style={{
                  fontSize: 18,
                  marginTop: 6,
                }}
              >
                {event.type}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  opacity: 0.8,
                }}
              >
                Severity: {insight.severity} | Impact:{" "}
                {insight.impact}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                {insight.explanation}
              </div>
            </div>

            {index !== safeEvents.length - 1 && (
              <div
                style={{
                  textAlign: "center",
                  opacity: 0.4,
                  padding: 8,
                }}
              >
                ↓
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
