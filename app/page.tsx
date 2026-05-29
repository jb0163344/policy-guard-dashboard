"use client";

import { useMemo } from "react";
import { calculateRisk } from "../lib/riskEngine";

export default function Home() {
  const events = useMemo(() => {
    return [
      { type: "LOGIN_FAILURE" },
      { type: "DEVICE_UNKNOWN" },
      { type: "LOCATION_ANOMALY" },
    ];
  }, []);

  const riskScore = useMemo(() => {
    return calculateRisk(events as any);
  }, [events]);

  const status =
    riskScore > 70 ? "CRITICAL" : riskScore > 40 ? "HIGH" : "LOW";

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
        <button>Law Firm Mode</button>
        <button>Clinic Mode</button>
        <button>Government Mode</button>
        <button>Business Mode</button>
      </div>

      {/* CENTER PANEL */}
      <div style={{ padding: 16 }}>
        <h2>LIVE THREAT FEED</h2>

        <div style={{ marginTop: 20, fontFamily: "monospace" }}>
          {events.map((e, i) => (
            <p key={i}>{e.type}</p>
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
