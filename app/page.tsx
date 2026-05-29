"use client";

import { useMemo, useState } from "react";
import { calculateRisk, RiskEvent } from "../lib/riskEngine";

export default function Home() {
  const [events, setEvents] = useState<RiskEvent[]>([
    { type: "LOGIN_FAILURE" },
  ]);

  const riskScore = useMemo(() => {
    return calculateRisk(events);
  }, [events]);

  const status =
    riskScore > 70 ? "CRITICAL" : riskScore > 40 ? "HIGH" : "LOW";

  function addEvent(type: RiskEvent["type"]) {
    setEvents((prev) => [...prev, { type }]);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px 1fr 300px",
        height: "100vh",
        fontFamily: "sans-serif",
        background: "#0a0a0a",
        color: "white",
      }}
    >
      {/* LEFT PANEL */}
      <div style={{ borderRight: "1px solid #222", padding: 16 }}>
        <h3>CONTROL CENTER</h3>

        <button onClick={() => addEvent("LOGIN_FAILURE")}>
          Login Failure
        </button>

        <button onClick={() => addEvent("DEVICE_UNKNOWN")}>
          Unknown Device
        </button>

        <button onClick={() => addEvent("LOCATION_ANOMALY")}>
          Location Anomaly
        </button>

        <button onClick={() => addEvent("IMPOSSIBLE_TRAVEL")}>
          Impossible Travel
        </button>
      </div>

      {/* CENTER PANEL */}
      <div style={{ padding: 16 }}>
        <h2>LIVE THREAT FEED</h2>

        <div style={{ marginTop: 20, fontFamily: "monospace" }}>
          {events.map((e, i) => (
            <p key={i}>
              [{i}] {e.type}
            </p>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ borderLeft: "1px solid #222", padding: 16 }}>
        <h3>RISK PULSE</h3>

        <div style={{ fontSize: 48 }}>{riskScore}</div>

        <p>Status: {status}</p>
      </div>
    </div>
  );
}
