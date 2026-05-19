import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runAssessment() {
    setLoading(true);

    // Simulated AI risk score
    const score = Math.floor(Math.random() * 100);

    // Severity logic
    let severity = "low";

    if (score > 70) severity = "critical";
    else if (score > 50) severity = "high";
    else if (score > 30) severity = "medium";

    // Save risk score
    const { data: riskData, error: riskError } = await supabase
      .from("risk_scores")
      .insert([
        {
          score,
          status: severity,
        },
      ])
      .select();

    console.log("Risk Saved:", riskData);
    console.log("Risk Error:", riskError);

    // Save audit log
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([
        {
          action: "risk_assessment_completed",
          severity,
          metadata: {
            score,
            source: "identity-firewall",
            engine: "QuantumSec AI",
          },
        },
      ]);

    console.log("Audit Error:", auditError);

    // Auto-create incident if critical
    if (severity === "critical") {
      const { error: incidentError } = await supabase
        .from("incidents")
        .insert([
          {
            title: "Critical Identity Risk Detected",
            severity: "critical",
          },
        ]);

      console.log("Incident Error:", incidentError);
    }

    // Reload scores
    loadScores();

    setLoading(false);
  }

  async function loadScores() {
    const { data, error } = await supabase
      .from("risk_scores")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Load Error:", error);

    if (data) {
      setScores(data);
    }
  }

  useEffect(() => {
    loadScores();
  }, []);

  return (
    <div
      style={{
        background: "#050816",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          marginBottom: "10px",
        }}
      >
        QuantumSec™ Identity Firewall
      </h1>

      <p
        style={{
          opacity: 0.7,
          marginBottom: "30px",
        }}
      >
        Autonomous AI Risk & Audit Platform
      </p>

      <button
        onClick={runAssessment}
        disabled={loading}
        style={{
          padding: "15px 30px",
          background: "#2563eb",
          border: "none",
          color: "white",
          fontSize: "18px",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        {loading
          ? "Running AI Assessment..."
          : "Run Security Assessment"}
      </button>

      <div style={{ marginTop: "50px" }}>
        <h2>Latest Risk Assessments</h2>

        {scores.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#111827",
              padding: "20px",
              marginTop: "15px",
              borderRadius: "12px",
            }}
          >
            <h3>Risk Score: {item.score}</h3>

            <p>Status: {item.status}</p>

            <p>
              Created:{" "}
              {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
