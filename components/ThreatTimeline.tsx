"use client";

import { RiskEvent } from "../lib/riskEngine";

type Props = {
  events: RiskEvent[];
};

export default function ThreatTimeline({
  events,
}: Props) {
  return (
    <>
      <h1>Threat Timeline</h1>

      {events.map((event, index) => (
        <div key={index}>
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 12,
              background:
                "rgba(255,255,255,.04)",
              border:
                "1px solid rgba(255,255,255,.08)",
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
          </div>

          {index !== events.length - 1 && (
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
      ))}
    </>
  );
}
