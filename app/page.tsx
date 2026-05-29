"use client";

import { useMemo } from "react";
import { calculateRisk } from "@/lib/riskEngine";

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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 300px", height: "100vh", fontFamily: "sans-serif" }}>
      
      {/* LEFT */}
      <div style={{ borderRight: "1px solid #222", padding: 16 }}>
        <h3>CONTROL CENTER</h3>
        <button>Law Firm Mode</button>
        <button>Clinic Mode</button>
        <button>Government Mode</button>
        <button>Business Mode</button>
      </div>

      {/* CENTER */}
      <div style={{ padding: 16 }}>
        <h2>LIVE THREAT FEED</h2>

        <div style={{ fontFamily: "monospace", marginTop: 20 }}>
          {events.map((e, i) => (
            <p key={i}>{e.type}</p>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ borderLeft: "1px solid #222", padding: 16 }}>
        <h3>RISK PULSE</h3>

        <div style={{ fontSize: 48 }}>{riskScore}</div>

        <p>
          Status:{" "}
          {riskScore > 70
            ? "HIGH"
            : riskScore > 40
            ? "MEDIUM"
            : "LOW"}
        </p>
      </div>

    </div>
  );
}
