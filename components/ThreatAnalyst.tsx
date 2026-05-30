"use client";

type Analysis = {
  severity: string;
  impact: string;
  confidence: string;
  explanation: string;
};

export default function ThreatAnalyst({
  analysis,
}: {
  analysis: Analysis;
}) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h3>AI ANALYST</h3>

      <div style={{ marginTop: 10 }}>
        <div>Severity: {analysis.severity}</div>
        <div>Impact: {analysis.impact}</div>
        <div>Confidence: {analysis.confidence}</div>
      </div>

      <p
        style={{
          marginTop: 10,
          opacity: 0.8,
        }}
      >
        {analysis.explanation}
      </p>
    </div>
  );
}
