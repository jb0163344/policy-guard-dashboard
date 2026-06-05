"use client";

import { EVENT_TYPES } from "../lib/eventTypes";

export default function MissionControl({
  addEvent,
  industry,
  setIndustry,
}: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3>MISSION CONTROL</h3>

      {/* INDUSTRY SELECT */}
      <select
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
      >
        <option value="ENTERPRISE">Enterprise</option>
        <option value="FINANCE">Finance</option>
        <option value="HEALTH">Health</option>
        <option value="EDUCATION">Education</option>
        <option value="GOVERNMENT">Government</option>
      </select>

      <hr />

      {/* EVENTS */}
      <button onClick={() => addEvent(EVENT_TYPES.LOGIN_FAILURE)}>
        Login Failure
      </button>

      <button onClick={() => addEvent(EVENT_TYPES.PASSWORD_REUSE)}>
        Password Reuse
      </button>

      <button onClick={() => addEvent(EVENT_TYPES.MFA_DISABLED)}>
        MFA Disabled
      </button>

      <button onClick={() => addEvent(EVENT_TYPES.PUBLIC_WIFI)}>
        Public WiFi
      </button>
    </div>
  );
}
