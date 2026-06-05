"use client";

export default function MissionControl({
  addEvent,
  industry,
  setIndustry,
}: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3>MISSION CONTROL</h3>

      {/* INDUSTRY SELECTOR (RESTORED) */}
      <select
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
      >
        <option value="ENTERPRISE">Enterprise</option>
        <option value="FINANCE">Finance</option>
        <option value="HEALTH">Health</option>
        <option value="EDUCATION">Education</option>
      </select>

      <hr />

      {/* EVENT BUTTONS */}
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
    </div>
  );
}
