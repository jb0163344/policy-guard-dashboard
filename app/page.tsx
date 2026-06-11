"use client";

import { useMemo, useState } from "react";

import {
  RiskEvent,
  IndustryType,
  calculateRisk,
  explainThreat,
  createTimestamp,
} from "../lib/riskEngine";

import { supabase } from "../lib/supabaseClient";

import RiskCore from "../components/RiskCore";
import ThreatAnalyst from "../components/ThreatAnalyst";
import ThreatTimeline from "../components/ThreatTimeline";
import MissionControl from "../components/MissionControl";
import ThreatMap from "../components/ThreatMap";

type ViewMode = "TIMELINE" | "MAP";

export default function Home() {
  const [industry, setIndustry] =
    useState<IndustryType>("ENTERPRISE");

  const [view, setView] =
    useState<ViewMode>("TIMELINE");

  const [events, setEvents] = useState<RiskEvent[]>([
    {
      type: "LOGIN_FAILURE",
      timestamp: createTimestamp(),
    },
  ]);

  const riskScore = useMemo(() => {
    return calculateRisk(events, industry);
  }, [events, industry]);

  // ✅ SAFE GUARD (prevents crash when events is empty)
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  const raw = latestEvent
    ? explainThreat(latestEvent.type)
    : {
        severity: "LOW",
        impact: "0",
        confidence: "0%",
        explanation: "No events yet.",
      };

  const analysis = {
    severity: raw.severity,
    impact: String(raw.impact),
    confidence: raw.confidence,
    explanation: raw.explanation,
  };

  async function addEvent(type: RiskEvent["type"]) {
  alert(`Button clicked: ${type}`);

  const { data, error } = await supabase
    .from("risk_events")
    .insert([
      {
        type: "LOGIN_FAILURE",
        timestamp: "TEST",
        risk_score: 99,
        industry: "ENTERPRISE",
      },
    ])
    .select();

  alert(
    JSON.stringify({
      data,
      error,
    })
  );
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
      {/* LEFT */}
      <aside
        style={{
          padding: 24,
          borderRight: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <MissionControl
          addEvent={addEvent}
          industry={industry}
          setIndustry={setIndustry}
        />
      </aside>

      {/* CENTER */}
      <section style={{ padding: 24, overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button onClick={() => setView("TIMELINE")}>
            Timeline
          </button>

          <button onClick={() => setView("MAP")}>
            Map
          </button>
        </div>

        {view === "TIMELINE" ? (
          <ThreatTimeline events={events} />
        ) : (
          <ThreatMap events={events} />
        )}
      </section>

      {/* RIGHT */}
      <aside style={{ padding: 24 }}>
        <h2>RISK ENGINE</h2>

        <RiskCore riskScore={riskScore} />

        <div
          style={{
            color: riskColor,
            fontSize: 24,
            marginTop: 10,
          }}
        >
          {status}
        </div>

        <ThreatAnalyst analysis={analysis} />
      </aside>
    </main>
  );
}
