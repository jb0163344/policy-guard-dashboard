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

type UIAnalysis = {
  severity: string;
  impact: string;
  confidence: string;
  explanation: string;
};

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

  const latestEvent = events[events.length - 1];
  const raw = explainThreat(latestEvent.type);

  const analysis: UIAnalysis = {
    severity: raw.severity,
    impact: String(raw.impact),
    confidence: raw.confidence,
    explanation: raw.explanation,
  };

  async function addEvent(type: RiskEvent["type"]) {
    const newEvent: RiskEvent = {
      type,
      timestamp: createTimestamp(),
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);

    const currentRiskScore = calculateRisk(
      updatedEvents,
      industry
    );

    const payload = {
      type: newEvent.type,
      timestamp: newEvent.timestamp,
      risk_score: currentRiskScore,
      industry,
    };

    console.log("INSERT EVENT:", payload);

    const { data, error } = await supabase
      .from("risk_events")
      .insert(payload)
      .select();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return;
    }

    console.log("EVENT SAVED:", data);
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
          <button
            onClick={() => setView("TIMELINE")}
            style={{
              padding: 8,
              background:
                view === "TIMELINE" ? "#00ff88" : "transparent",
              color: view === "TIMELINE" ? "#000" : "#fff",
              border: "1px solid #333",
            }}
          >
            Timeline
          </button>

          <button
            onClick={() => setView("MAP")}
            style={{
              padding: 8,
              background:
                view === "MAP" ? "#00ff88" : "transparent",
              color: view === "MAP" ? "#000" : "#fff",
              border: "1px solid #333",
            }}
          >
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
      <aside
        style={{
          padding: 24,
          borderLeft: "1px solid rgba(255,255,255,.08)",
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

        <div
          style={{
            textAlign: "center",
            marginTop: 10,
            opacity: 0.7,
          }}
        >
          Industry: {industry}
        </div>

        <ThreatAnalyst analysis={analysis} />
      </aside>
    </main>
  );
}
