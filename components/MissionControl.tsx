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
  const buttonStyle = {
    padding: 10,
    border: "1px solid #333",
    borderRadius: 8,
    cursor: "pointer",
  };

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

      <button
        style={{
          ...buttonStyle,
          background: "red",
          color: "white",
        }}
        onClick={() => {
          alert("LOGIN BUTTON CLICKED");
          console.log("LOGIN BUTTON CLICKED");
          addEvent("LOGIN_FAILURE");
        }}
      >
        Login Failure
      </button>

      <button
        style={buttonStyle}
        onClick={() => {
          console.log("CLICK DEVICE UNKNOWN");
          addEvent("DEVICE_UNKNOWN");
        }}
      >
        Unknown Device
      </button>

      <button
        style={buttonStyle}
        onClick={() => {
          console.log("CLICK LOCATION ANOMALY");
          addEvent("LOCATION_ANOMALY");
        }}
      >
        Location Anomaly
      </button>

      <button
        style={buttonStyle}
        onClick={() => {
          console.log("CLICK IMPOSSIBLE TRAVEL");
          addEvent("IMPOSSIBLE_TRAVEL");
        }}
      >
        Impossible Travel
      </button>
    </div>
  );
}
