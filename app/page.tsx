"use client";

import { useMemo, useState } from "react";

import {
  RiskEvent,
  calculateRisk,
  explainThreat,
  createTimestamp,
} from "../lib/riskEngine";

import RiskCore from "../components/RiskCore";
import ThreatAnalyst from "../components/ThreatAnalyst";
import ThreatTimeline from "../components/ThreatTimeline";
import MissionControl from "../components/MissionControl";

export default function Home() {
  const [events, setEvents] = useState<RiskEvent[]>([
    {
      type: "LOGIN_FAILURE",
      timestamp: createTimestamp(),
    },
  ]);

  const riskScore = useMemo(() => {
    return calculateRisk(events);
  }, [events]);

  const latestEvent = events[events.length - 1];

  const analysis = explainThreat(latestEvent.type);

  function addEvent(type: RiskEvent["type"]) {
    setEvents((prev) => [
      ...prev,
      {
        type,
        timestamp: createTimestamp(),
      },
    ]);
  }

  const riskColor =
    riskScore > 80
      ? "#ff3b3b"
      : riskScore > 50
      ? "#ff9d00"
      : riskScore > 20
      ? "#ffe600"
      : "#00ff88";

  const status =
    riskScore > 80
      ? "CRITICAL"
      : riskScore > 50
      ? "HIGH"
      : riskScore > 20
      ? "MEDIUM"
      : "LOW";

  return (
    <main
      style={{
        height: "100vh",
        background:
          "radial-gradient(circle at center, #111827 0%, #05070d 70%)",
        color: "white",
        display: "grid",
        gridTemplateColumns: "260px 1fr 340px",
        overflow: "hidden",
      }}
    >
      {/* LEFT PANEL */}
      <aside
        style={{
          padding: 24,
          borderRight:
            "1px solid rgba(255,255,255,.08)",
        }}
      >
        <MissionControl addEvent={addEvent} />
      </aside>

      {/* CENTER PANEL */}
      <section
        style={{
          padding: 24,
          overflowY: "auto",
        }}
      >
        <ThreatTimeline events={events} />
      </section>

      {/* RIGHT PANEL */}
      <aside
        style={{
          padding: 24,
          borderLeft:
            "1px solid rgba(255,255,255,.08)",
        }}
      >
        <h2>RISK ENGINE</h2>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <RiskCore riskScore={riskScore} />
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 28,
            fontWeight: 700,
            color: riskColor,
          }}
        >
          {status}
        </div>

        <ThreatAnalyst analysis={analysis} />
      </aside>
    </main>
  );
}
