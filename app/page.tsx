"use client";

import { useMemo, useState } from "react";
import {
  calculateRisk,
  RiskEvent,
  explainThreat,
  createTimestamp,
} from "../lib/riskEngine";

export default function Home() {
  const [events, setEvents] = useState<RiskEvent[]>([
    {
      type: "LOGIN_FAILURE",
      timestamp: createTimestamp(),
    },
  ]);

  const riskScore = useMemo(
    () => calculateRisk(events),
    [events]
  );

  const latestEvent = events[events.length - 1];
  const analysis = explainThreat(latestEvent.type);

  const status =
    riskScore > 80
      ? "CRITICAL"
      : riskScore > 50
      ? "HIGH"
      : riskScore > 20
      ? "MEDIUM"
      : "LOW";

  function addEvent(type: RiskEvent["type"]) {
    setEvents((prev) => [
      ...prev,
      {
        type,
        timestamp: createTimestamp(),
      },
    ]);
  }

  const riskColor =
    riskScore > 80
      ? "#ff3b3b"
      : riskScore > 50
      ? "#ff9d00"
      : riskScore > 20
      ? "#ffe600"
      : "#00ff88";

  return (
    <main
      style={{
        height: "100vh",
        background:
          "radial-gradient(circle at center,#111827 0%,#05070d 70%)",
        color: "white",
        display: "grid",
        gridTemplateColumns: "260px 1fr 340px",
      }}
    >
      <aside
        style={{
          padding: 24,
          borderRight:
            "1px solid rgba(255,255,255,.08)",
        }}
      >
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
      </aside>

      <section
        style={{
          padding: 24,
          overflowY: "auto",
        }}
      >
        <h1>Threat Timeline</h1>

        {events.map((event, index) => (
          <div key={index}>
            <div
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                background:
                  "rgba(255,255,255,.04)",
                border:
                  "1px solid rgba(255,255,255,.08)",
              }}
            >
              <div
                style={{
                  opacity: 0.6,
                  fontSize: 12,
                }}
              >
                {event.timestamp}
              </div>

              <div
                style={{
                  fontSize: 18,
                  marginTop: 6,
                }}
              >
                {event.type}
              </div>
            </div>

            {index !== events.length - 1 && (
              <div
                style={{
                  textAlign: "center",
                  opacity: 0.4,
                  padding: 8,
                }}
              >
                ↓
              </div>
            )}
          </div>
        ))}
      </section>

      <aside
        style={{
          padding: 24,
          borderLeft:
            "1px solid rgba(255,255,255,.08)",
        }}
      >
        <h2>RISK ENGINE</h2>

        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: `4px solid ${riskColor}`,
            margin: "30px auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 42,
            fontWeight: 700,
            boxShadow: `0 0 40px ${riskColor}`,
          }}
        >
          {riskScore}
        </div>

        <h3
          style={{
            textAlign: "center",
            color: riskColor,
          }}
        >
          {status}
        </h3>

        <div
          style={{
            marginTop: 30,
            border:
              "1px solid rgba(255,255,255,.08)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h4>AI Threat Analyst</h4>

          <p>
            <strong>Severity:</strong>{" "}
            {analysis.severity}
          </p>

          <p>
            <strong>Impact:</strong>{" "}
            {analysis.impact}
          </p>

          <p>
            <strong>Confidence:</strong>{" "}
            {analysis.confidence}
          </p>

          <p>{analysis.explanation}</p>
        </div>
      </aside>
    </main>
  );
}
