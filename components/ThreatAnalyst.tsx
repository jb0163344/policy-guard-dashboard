"use client";

type Props = {
  analysis: {
    severity: string;
    impact: string;
    confidence: string;
    explanation: string;
  };
};

export default function ThreatAnalyst({
  analysis,
}: Props) {
  return (
    <div
      style={{
        marginTop: 30,
        border: "1px solid rgba(255,255,255,.08)",
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
  );
}
