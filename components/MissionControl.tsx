"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type RiskEvent = {
  type: string;
  timestamp: string;
};

type IndustryType = "ENTERPRISE" | "FINANCE" | "HEALTH" | "EDUCATION";

export default function MissionControl({
  addEventExternal,
  industry,
  setIndustry,
}: any) {
  const [events, setEvents] = useState<RiskEvent[]>([]);

  function createTimestamp() {
    return new Date().toISOString();
  }

  async function addEvent(type: string) {
    const newEvent: RiskEvent = {
      type,
      timestamp: createTimestamp(),
    };

    // 1. UI UPDATE (instant feedback)
    setEvents((prev) => [...prev, newEvent]);

    // 2. DATABASE WRITE (critical fix)
    const { error } = await supabase.from("risk_events").insert({
      user_id: "demo-user", // replace later with auth.uid()
      risk_score: 10,
      answers: {
        event_type: type,
      },
    });

    if (error) {
      console.error("❌ Supabase insert failed:", error.message);
      return;
    }

    console.log("✅ risk_event inserted:", newEvent);

    // 3. OPTIONAL: notify parent dashboard if you use it
    if (addEventExternal) {
      addEventExternal(type);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3>MISSION CONTROL</h3>

      <button onClick={() => addEvent("LOGIN_FAILURE")}>
        Login Failure
      </button>

      <button onClick={() => addEvent("PASSWORD_REUSE")}>
        Password Reuse
      </button>

      <button onClick={() => addEvent("MFA_DISABLED")}>
        MFA Disabled
      </button>

      <button onClick={() => addEvent("PUBLIC_WIFI")}>
        Public WiFi
      </button>

      <hr />

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Local Events: {events.length}
      </div>

      <div style={{ fontSize: 12, opacity: 0.5 }}>
        Industry: {industry}
      </div>
    </div>
  );
}
