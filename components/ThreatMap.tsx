"use client";

import { RiskEvent } from "../lib/riskEngine";

type Props = {
  events: RiskEvent[];
};

const locationMap: Record<string, string> = {
  LOGIN_FAILURE: "Miami",
  DEVICE_UNKNOWN: "Orlando",
  LOCATION_ANOMALY: "New York",
  IMPOSSIBLE_TRAVEL: "London",
};

export default function ThreatMap({ events }: Props) {
  const mapped = events.map((event, index) => {
    return {
      ...event,
      location: locationMap[event.type],
      index,
    };
  });

  return (
    <div style={{ padding: 10 }}>
      <h1>Threat Intelligence Map</h1>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gap: 12,
        }}
      >
        {mapped.map((event, i) => (
          <div
            key={i}
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 14,
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              LOCATION
            </div>

            <div style={{ fontSize: 18 }}>
              {event.location}
            </div>

            <div style={{ marginTop: 6 }}>
              {event.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
