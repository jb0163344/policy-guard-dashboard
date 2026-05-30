"use client";

import { useMemo, useState } from "react";
import { calculateRisk, RiskEvent } from "../lib/riskEngine";

export default function Home() {
  const [events, setEvents] = useState<RiskEvent[]>([
    { type: "LOGIN_FAILURE" },
  ]);

  const riskScore = useMemo(() => {
    return calculateRisk(events);
  }, [events]);

  const status =
    riskScore > 80
      ? "CRITICAL"
      : riskScore > 50
      ? "HIGH"
      : riskScore > 20
      ? "MEDIUM"
      : "LOW";

  function addEvent(type: RiskEvent["type"]) {
    setEvents((prev) => [...prev, { type }]);
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
          "radial-gradient(circle at center, #111827 0%, #05070d 70%)",
        color: "#ffffff",
        display: "grid",
        gridTemplateColumns: "260px 1fr 340px",
        overflow: "hidden",
      }}
    >
      {/* LEFT PANEL */}
      <aside
        style={{
          borderRight: "1px solid rgba(255,255,255,.08)",
          padding: "24px",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>MISSION CONTROL</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <button onClick={() => addEvent("LOGIN_FAILURE")}>
            Failed Login
          </button>

          <button onClick={() => addEvent("DEVICE_UNKNOWN")}>
            Unknown Device
          </button>

          <button onClick={() => addEvent("LOCATION_ANOMALY")}>
            Location Anomaly
          </button>

          <button onClick={() => addEvent("IMPOSSIBLE_TRAVEL")}>
            Impossible Travel
          </button>
        </div>

        <hr style={{ margin: "24px 0", opacity: 0.2 }} />

        <h4>Business Profiles</h4>

        <div style={{ display: "grid", gap: 8 }}>
          <button>Law Firm</button>
          <button>Clinic</button>
          <button>Government</button>
          <button>Enterprise</button>
        </div>
      </aside>

      {/* CENTER */}
      <section
        style={{
          padding: "24px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h1>Threat Intelligence Feed</h1>

          <div>
            Active Events: <strong>{events.length}</strong>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {events.map((e, i) => (
            <div
              key={i}
              style={{
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(255,255,255,.03)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                }}
              >
                EVENT #{i + 1}
              </div>

              <div
                style={{
                  fontSize: 18,
                  marginTop: 4,
                }}
              >
                {e.type}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT PANEL */}
      <aside
        style={{
          borderLeft: "1px solid rgba(255,255,255,.08)",
          padding: "24px",
        }}
      >
        <h2>RISK ENGINE</h2>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: `4px solid ${riskColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 40px ${riskColor}`,
              fontSize: 42,
              fontWeight: 700,
            }}
          >
            {riskScore}
          </div>
        </div>

        <div
          style={{
            marginTop: 30,
            textAlign: "center",
          }}
        >
          <div style={{ opacity: 0.6 }}>CURRENT STATUS</div>

          <div
            style={{
              fontSize: 28,
              color: riskColor,
              fontWeight: 700,
            }}
          >
            {status}
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <h4>AI Risk Analysis</h4>

          <p style={{ opacity: 0.8 }}>
            Monitoring behavioral anomalies, device reputation,
            authentication failures, and location inconsistencies.
          </p>
        </div>
      </aside>
    </main>
  );
}
