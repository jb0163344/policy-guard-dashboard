"use client";

import { RiskEvent } from "../lib/riskEngine";

type Props = {
  addEvent: (type: RiskEvent["type"]) => void;
};

export default function MissionControl({
  addEvent,
}: Props) {
  return (
    <>
      <h2>MISSION CONTROL</h2>

      <div
        style={{
          display: "grid",
          gap: 10,
          marginTop: 20,
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
