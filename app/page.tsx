"use client";

import { useState, useEffect, useMemo } from "react";

export default function Page() {
  const [events, setEvents] = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState(0);

  function addEvent(type: string) {
    const newEvent = { type, timestamp: Date.now() };
    const updated = [...events, newEvent];

    setEvents(updated);
    setRiskScore(updated.length * 10);
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Risk Dashboard</h1>

      <p>Risk Score: {riskScore}</p>

      <button onClick={() => addEvent("LOGIN_FAILURE")}>
        Login Failure
      </button>

      <button onClick={() => addEvent("CREDENTIAL_ATTACK")}>
        Credential Attack
      </button>

      <hr />

      <h3>Events</h3>
      <ul>
        {events.map((e, i) => (
          <li key={i}>
            {e.type} - {String(e.timestamp)}
          </li>
        ))}
      </ul>
    </main>
  );
}
