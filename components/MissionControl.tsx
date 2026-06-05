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
        onClick={() =>
          addEvent("LOGIN_FAILURE")
        }
      >
        Login Failure
      </button>

      <button
        onClick={() =>
          addEvent("DEVICE_UNKNOWN")
        }
      >
        Unknown Device
      </button>

      <button
        onClick={() =>
          addEvent("LOCATION_ANOMALY")
        }
      >
        Location Anomaly
      </button>

      <button
        onClick={() =>
          addEvent("IMPOSSIBLE_TRAVEL")
        }
      >
        Impossible Travel
      </button>
    </div>
  );
}
