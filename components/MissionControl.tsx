"use client";

import {
  RiskEvent,
  IndustryType,
} from "../lib/riskEngine";

type Props = {
  addEvent: (type: RiskEvent["type"]) => void;
  industry: IndustryType;
  setIndustry: (value: IndustryType) => void;
};

export default function MissionControl({
  addEvent,
  industry,
  setIndustry,
}: Props) {
  return (
    <>
      <h2>MISSION CONTROL</h2>

      <div
        style={{
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <label>Industry</label>

        <select
          value={industry}
          onChange={(e) =>
            setIndustry(
              e.target.value as IndustryType
            )
          }
        >
          <option value="LAW_FIRM">
            Law Firm
          </option>

          <option value="HEALTHCARE">
            Healthcare
          </option>

          <option value="GOVERNMENT">
            Government
          </option>

          <option value="FINANCE">
            Finance
          </option>

          <option value="ENTERPRISE">
            Enterprise
          </option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        <button
          onClick={() =>
            addEvent("LOGIN_FAILURE")
          }
        >
          Failed Login
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
    </>
  );
}
