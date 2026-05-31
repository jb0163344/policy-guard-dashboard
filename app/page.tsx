"use client";

import { useState } from "react";

export default function Page() {
  const [score, setScore] = useState(10);

  return (
    <main style={{ padding: 30, color: "white", background: "#0b0f19", minHeight: "100vh" }}>
      <h1>Quantum Security Dashboard</h1>

      <h2>Risk Score: {score}</h2>

      <button onClick={() => setScore(score + 10)}>
        Trigger Event
      </button>
    </main>
  );
}
