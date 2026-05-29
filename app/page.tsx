export default function Home() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 300px", height: "100vh", fontFamily: "sans-serif" }}>
      
      {/* LEFT PANEL */}
      <div style={{ borderRight: "1px solid #222", padding: 16 }}>
        <h3>CONTROL CENTER</h3>
        <button>Law Firm Mode</button>
        <button>Clinic Mode</button>
        <button>Government Mode</button>
        <button>Business Mode</button>
      </div>

      {/* CENTER PANEL */}
      <div style={{ padding: 16 }}>
        <h2>LIVE THREAT FEED</h2>
        <div style={{ marginTop: 20, fontFamily: "monospace" }}>
          <p>10:41 AM — LOGIN_FAILURE detected</p>
          <p>10:42 AM — DEVICE_UNKNOWN flagged</p>
          <p>10:43 AM — LOCATION_ANOMALY detected</p>
          <p>10:44 AM — RISK SCORE: 72 (HIGH)</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ borderLeft: "1px solid #222", padding: 16 }}>
        <h3>RISK PULSE</h3>
        <div style={{ fontSize: 48 }}>72</div>
        <p>System Status: ACTIVE</p>
      </div>

    </div>
  );
}
