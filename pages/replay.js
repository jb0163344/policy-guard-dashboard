import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function decide(score, t1, t2, t3) {
  if (score <= t1) return "ALLOW";
  if (score <= t2) return "STEP_UP";
  if (score <= t3) return "QUARANTINE";
  return "BLOCK";
}

export default function Replay() {
  const [status, setStatus] = useState("Loading…");
  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  // thresholds (policy knobs)
  const [t1, setT1] = useState(2);
  const [t2, setT2] = useState(5);
  const [t3, setT3] = useState(8);

  useEffect(() => {
    (async () => {
      setErr("");
      setStatus("Loading session…");
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setErr(error.message);
        setStatus("Failed.");
        return;
      }
      const user = data?.session?.user;
      if (!user) {
        setStatus("Not logged in. Go to /login");
        return;
      }
      setUserId(user.id);

      setStatus("Loading last 30 scans…");
      const { data: scans, error: scansErr } = await supabase
        .from("risk_scores")
        .select("risk_score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (scansErr) {
        setErr(scansErr.message);
        setStatus("Failed.");
        return;
      }

      setRows(scans || []);
      setStatus("Ready.");
    })();
  }, []);

  const summary = useMemo(() => {
    const counts = { ALLOW: 0, STEP_UP: 0, QUARANTINE: 0, BLOCK: 0 };
    for (const r of rows) {
      const a = decide(r.risk_score, t1, t2, t3);
      counts[a] += 1;
    }
    return counts;
  }, [rows, t1, t2, t3]);

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 920, margin: "0 auto" }}>
      <h1>Replay Mode</h1>
      <p style={{ opacity: 0.85 }}>{status}</p>
      {err ? (
        <div style={{ padding: 12, borderRadius: 10, border: "1px solid #ffb3b3", background: "#fff2f2" }}>
          <b>Error:</b> {err}
        </div>
      ) : null}

      {!userId ? (
        <p>
          Go to <a href="/login">/login</a>.
        </p>
      ) : (
        <>
          <section style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <h2 style={{ marginTop: 0 }}>Policy Thresholds</h2>

            <div style={{ display: "grid", gap: 10 }}>
              <label>
                ALLOW threshold (0–10): <b>{t1}</b>
                <input type="range" min="0" max="10" value={t1} onChange={(e) => setT1(Number(e.target.value))} style={{ width: "100%" }} />
              </label>

              <label>
                STEP_UP threshold (0–10): <b>{t2}</b>
                <input type="range" min="0" max="10" value={t2} onChange={(e) => setT2(Number(e.target.value))} style={{ width: "100%" }} />
              </label>

              <label>
                QUARANTINE threshold (0–10): <b>{t3}</b>
                <input type="range" min="0" max="10" value={t3} onChange={(e) => setT3(Number(e.target.value))} style={{ width: "100%" }} />
              </label>
            </div>

            <p style={{ marginTop: 12, opacity: 0.85 }}>
              Replay tells you: “If these thresholds had been active, how many of your last scans would have been allow/step-up/quarantine/block?”
            </p>
          </section>

          <section style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <h2 style={{ marginTop: 0 }}>Replay Results (last {rows.length} scans)</h2>
            <ul>
              <li><b>ALLOW:</b> {summary.ALLOW}</li>
              <li><b>STEP_UP:</b> {summary.STEP_UP}</li>
              <li><b>QUARANTINE:</b> {summary.QUARANTINE}</li>
              <li><b>BLOCK:</b> {summary.BLOCK}</li>
            </ul>

            <details>
              <summary style={{ cursor: "pointer" }}>View raw scans</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
                {JSON.stringify(rows, null, 2)}
              </pre>
            </details>

            <p style={{ marginTop: 12 }}>
              Back to <a href="/">Dashboard</a>
            </p>
          </section>
        </>
      )}
    </main>
  );
}
