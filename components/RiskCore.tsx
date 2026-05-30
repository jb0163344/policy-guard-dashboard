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

  const glowSize =
    riskScore > 80
      ? 100
      : riskScore > 50
      ? 75
      : riskScore > 20
      ? 50
      : 25;

  const pulseSpeed =
    riskScore > 80
      ? "1s"
      : riskScore > 50
      ? "1.5s"
      : riskScore > 20
      ? "2s"
      : "3s";

  return (
    <>
      <style>
        {`
          @keyframes pulseCore {
            0% {
              transform: scale(1);
            }

            50% {
              transform: scale(1.08);
            }

            100% {
              transform: scale(1);
            }
          }
        `}
      </style>

      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: `4px solid ${riskColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          fontWeight: 700,
          color: riskColor,
          boxShadow: `0 0 ${glowSize}px ${riskColor}`,
          animation: `pulseCore ${pulseSpeed} infinite`,
          transition: "all 0.5s ease",
        }}
      >
        {riskScore}
      </div>
    </>
  );
}
