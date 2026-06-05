"use client";

import { useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import MissionControl from "../components/MissionControl";
import { calculateRisk } from "../lib/riskEngine";

import { EventType } from "../lib/eventTypes";

type RiskEvent = {
  type: EventType;
  timestamp: string;
};

export default function Home() {
  const [industry, setIndustry] = useState("ENTERPRISE");
  const [events, setEvents] = useState<RiskEvent[]>([]);

  function createTimestamp() {
    return new Date().toISOString();
  }

  const riskScore = useMemo(() => {
    return calculateRisk(events as any, industry as any);
  }, [events, industry]);

  async function addEvent(type: EventType) {
    const event: RiskEvent = {
      type,
      timestamp: createTimestamp(),
    };

    // 1. UI UPDATE (instant)
    setEvents((prev) => [...prev, event]);

    // 2. SUPABASE WRITE (critical pipeline)
    const { error } = await supabase.from("risk_events").insert({
      user_id: "demo-user",
      risk_score: riskScore,
      answers: {
        event_type: type,
      },
    });

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
    } else {
      console.log("✅ Event stored:", type);
    }
  }

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        height: "100vh",
      }}
    >
      <aside style={{ padding: 20 }}>
        <MissionControl
          addEvent={addEvent}
          industry={industry}
          setIndustry={setIndustry}
        />
      </aside>

      <section style={{ padding: 20 }}>
        <h2>RISK SCORE: {riskScore}</h2>
        <pre>{JSON.stringify(events, null, 2)}</pre>
      </section>
    </main>
  );
}
