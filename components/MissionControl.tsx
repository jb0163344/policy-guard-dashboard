"use client";

import {
  RiskEventType,
  IndustryType,
} from "../lib/riskEngine";

type Props = {
  addEvent: (type: RiskEventType) => void;
  industry: IndustryType;
  setIndustry: (industry: IndustryType) => void;
};

export default function MissionControl({
  addEvent,
  industry,
  setIndustry,
}: Props) {
  function handleClick(type: RiskEventType) {
    console.log("MISSION CONTROL CLICK:", type);
    addEvent(type);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <h2>MISSION CONTROL</h2>

      <select
        value={industry}
        onChange={(e) =>
          setIndustry(e.target.value as IndustryType)
        }
      >
        <option value="ENTERPRISE">Enterprise</option>
        <option value="FINANCE">Finance</option>
        <option value="GOVERNMENT">Government</option>
        <option value="HEALTHCARE">Healthcare</option>
        <option value="LAW_FIRM">Law Firm</option>
      </select>

      <hr />

      <button onClick={() => handleClick("LOGIN_FAILURE")}>
        Login Failure
      </button>

      <button onClick={() => handleClick("DEVICE_UNKNOWN")}>
        Unknown Device
      </button>

      <button onClick={() => handleClick("LOCATION_ANOMALY")}>
        Location Anomaly
      </button>

      <button onClick={() => handleClick("IMPOSSIBLE_TRAVEL")}>
        Impossible Travel
      </button>
    </div>
  );
}
