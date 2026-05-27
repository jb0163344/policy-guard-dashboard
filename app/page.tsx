"use client";

import { useState } from "react";

export default function Page() {
  const [profile, setProfile] = useState("business");
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [riskScore, setRiskScore] = useState<number | null>(null);

  const runSimulation = async () => {
    try {
      const res = await fetch("/api/risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          profile,

          failedLogins: Math.floor(Math.random() * 10),

          locationChange: Math.random() > 0.5,

          deviceUnknown: Math.random() > 0.5,

          impossibleTravel: Math.random() > 0.7,
        }),
      });

      const data = await res.json();

      setRiskScore(data.riskScore);
      setStatus(data.status);

      setEvents((prev) => [
        {
          id: Date.now(),
          risk: data.riskScore,
          status: data.status,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main
      style={{
        background: "#05070d",
        minHeight: "100vh",
        color: "white",
        overflow: "hidden",
        position: "relative",
        fontFamily: "Arial",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: 30,
          position: "relative",
          zIndex: 2,
        }}
      >
        <h1
          style={{
            fontSize: 34,
            marginBottom: 10,
            letterSpacing: 2,
          }}
        >
          Quantum Security Intelligence
        </h1>

        <p
          style={{
            opacity: 0.7,
            marginBottom: 20,
          }}
        >
          Adaptive Neural Risk Monitoring System
        </p>

        {/* PROFILE SELECTOR */}
        <select
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          style={{
            padding: 12,
            background: "#111827",
            color: "white",
            borderRadius: 10,
            border: "1px solid #1f2937",
            marginBottom: 20,
            width: 220,
          }}
        >
          <option value="business">Business</option>
          <option value="law">Law Firm</option>
          <option value="clinic">Clinic</option>
          <option value="government">Government</option>
        </select>

        <br />

        {/* BUTTON */}
        <button
          onClick={runSimulation}
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            border: "none",
            background:
              "linear-gradient(135deg,#2563eb,#06b6d4)",
            color: "white",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Run Risk Pulse
        </button>

        {/* RISK DISPLAY */}
        {riskScore !== null && (
          <div
            style={{
              marginTop: 30,
              padding: 20,
              width: 300,
              borderRadius: 14,
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h2
              style={{
                marginBottom: 10,
              }}
            >
              Threat Analysis
            </h2>

            <p
              style={{
                fontSize: 42,
                margin: 0,
                fontWeight: 700,
              }}
            >
              {riskScore}
            </p>

            <p
              style={{
                marginTop: 10,
                color:
                  status === "HIGH_RISK"
                    ? "#ef4444"
                    : status === "MEDIUM_RISK"
                    ? "#f59e0b"
                    : "#22c55e",
              }}
            >
              {status}
            </p>
          </div>
        )}
      </div>

      {/* FUTURISTIC PARTICLE STREAM */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        {events.map((e, i) => (
          <div
            key={e.id}
            style={{
              position: "absolute",

              left: `${50 + Math.sin(i * 0.8) * 35}%`,

              top: `${(i * 90) % 900}px`,

              width: 20 + e.risk,

              height: 20 + e.risk,

              borderRadius: "50%",

              background:
                e.risk > 70
                  ? "rgba(255,0,60,0.7)"
                  : e.risk > 40
                  ? "rgba(255,170,0,0.7)"
                  : "rgba(0,255,255,0.7)",

              filter: "blur(8px)",

              boxShadow:
                e.risk > 70
                  ? "0 0 40px rgba(255,0,60,0.9)"
                  : e.risk > 40
                  ? "0 0 40px rgba(255,170,0,0.9)"
                  : "0 0 40px rgba(0,255,255,0.9)",

              transition: "all 0.8s ease",
            }}
          />
        ))}
      </div>
    </main>
  );
}
