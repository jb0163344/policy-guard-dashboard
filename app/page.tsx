"use client";

import { useEffect, useMemo, useState } from "react";

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

  const [events, setEvents] = useState<RiskEvent[]>([]);

  // =========================
  // LOAD INITIAL DATA
  // =========================
  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const { data, error } = await supabase
      .from("risk_events")
      .select("*")
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("LOAD ERROR:", error);
      return;
    }

    if (!data) return;

    const formatted: RiskEvent[] = data.map((row) => ({
      type: row.type,
      timestamp: row.timestamp,
    }));

    setEvents(formatted);
  }

  // =========================
  // REALTIME SUBSCRIPTION
  // =========================
  useEffect(() => {
    const channel = supabase
      .channel("risk-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "risk_events",
        },
        (payload) => {
          const newRow = payload.new;

          const newEvent: RiskEvent = {
            type: newRow.type,
            timestamp: newRow.timestamp,
          };

          setEvents((prev) => {
            // prevent duplicates
            const exists = prev.some(
              (e) =>
                e.timestamp === newRow.timestamp &&
                e.type === newRow.type
            );

            if (exists) return prev;

            return [...prev, newEvent];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // RISK ENGINE
  // =========================
  const riskScore = useMemo(() => {
    return calculateRisk(events, industry);
  }, [events, industry]);

  const latestEvent =
    events.length > 0 ? events[events.length - 1] : null;

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

  // =========================
  // ADD EVENT (INSERT ONLY)
  // =========================
  async function addEvent(type: RiskEvent["type"]) {
    console.log("ADD EVENT:", type);

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

    const { error } = await supabase
      .from("risk_events")
      .insert([payload]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
    }
  }

  // =========================
  // UI LOGIC
  // =========================
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

  // =========================
  // RENDER
  // =========================
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
