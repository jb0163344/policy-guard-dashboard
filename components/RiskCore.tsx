"use client";

type Props = {
  riskScore: number;
};

export default function RiskCore({
  riskScore,
}: Props) {
  const riskColor =
    riskScore > 80
      ? "#ff3b3b"
      : riskScore > 50
      ? "#ff9d00"
      : riskScore > 20
      ? "#ffe600"
      : "#00ff88";

  const pulseSize =
    riskScore > 80
      ? "0 0 80px"
      : riskScore > 50
      ? "0 0 60px"
      : "0 0 40px"
      : "0 0 20px";

  return (
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: "50%",
        border: `4px solid ${riskColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 42,
        fontWeight: 700,
        color: riskColor,
        boxShadow: `${pulseSize} ${riskColor}`,
        transition: "all 0.4s ease",
      }}
    >
      {riskScore}
    </div>
  );
}
