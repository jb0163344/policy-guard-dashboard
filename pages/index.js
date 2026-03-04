import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const QUESTIONS = [
  { key: "password_reuse", title: "Password reuse", prompt: "Do you reuse the same password across multiple accounts?", options: [
    { label: "Yes (often)", points: 2 }, { label: "Sometimes", points: 1 }, { label: "No (unique passwords)", points: 0 },
  ]},
  { key: "mfa", title: "MFA", prompt: "Do you use MFA on your important accounts (email, bank, social)?", options: [
    { label: "No", points: 2 }, { label: "Only on some accounts", points: 1 }, { label: "Yes, on all important accounts", points: 0 },
  ]},
  { key: "breach_checks", title: "Breach awareness", prompt: "Have you checked if your email was in a data breach?", options: [
    { label: "Never checked", points: 2 }, { label: "Checked once", points: 1 }, { label: "I monitor regularly", points: 0 },
  ]},
  { key: "public_wifi", title: "Network exposure", prompt: "Do you use public Wi-Fi without a VPN?", options: [
    { label: "Often", points: 2 }, { label: "Rarely", points: 1 }, { label: "Never", points: 0 },
  ]},
  { key: "password_manager", title: "Password manager", prompt: "Do you use a password manager?", options: [
    { label: "No", points: 2 }, { label: "Not yet / considering", points: 1 }, { label: "Yes", points: 0 },
  ]},
  { key: "recovery", title: "Recovery readiness", prompt: "Do you have recovery backups set up (backup codes, secondary email/phone) on all important accounts?", options: [
    { label: "No", points: 2 }, { label: "Some accounts / not sure", points: 1 }, { label: "Yes (covered)", points: 0 },
  ]},
];

function clampScore(n) {
  return Math.max(0, Math.min(10, n));
}
function riskBand(score) {
  if (score <= 2) return { level: "LOW", tone: "Stable posture. Maintain good habits." };
  if (score <= 5) return { level: "MODERATE", tone: "Some exposure. Tighten a few key controls." };
  if (score <= 8) return { level: "HIGH", tone: "Elevated exposure. Prioritize immediate hardening." };
  return { level: "CRITICAL", tone: "Severe exposure. Act now to prevent account takeover." };
}
function recommendations(score, answers) {
  const items = [];
  if ((answers.password_reuse ?? 0) >= 1) items.push("Stop password reuse. Start with email + banking + social.");
  if ((answers.mfa ?? 0) >= 1) items.push("Enable MFA everywhere. Prefer authenticator app over SMS.");
  if ((answers.breach_checks ?? 0) >= 1) items.push("Run a breach check + rotate passwords for breached services.");
  if ((answers.public_wifi ?? 0) >= 1) items.push("Avoid public Wi-Fi for sensitive logins or use a VPN.");
  if ((answers.password_manager ?? 0) >= 1) items.push("Adopt a password manager; generate long unique passwords.");
  if ((answers.recovery ?? 0) >= 1) items.push("Verify recovery email/phone + store backup codes safely.");
  if (score >= 6) items.push("Secure your primary email first — it’s the master key to resets.");
  return items.slice(0, 7);
}

export default function Home() {
  const [status, setStatus] = useState("Loading…");
  const [errorText, setErrorText] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  const [latestScore, setLatestScore] = useState(null);
  const [history, setHistory] = useState([]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  const computedScore = useMemo(() => {
    const sum = Object.values(answers).reduce((acc, v) => acc + (typeof v === "number" ? v : 0), 0);
    return clampScore(sum);
  }, [answers]);

  const band = useMemo(() => riskBand(computedScore), [computedScore]);
  const recs = useMemo(() => recommendations(computedScore, answers), [computedScore, answers]);

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const answered = typeof answers[q.key] === "number";

  async function load() {
    setErrorText("");
    setStatus("Loading session…");
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setStatus(`Session error: ${error.message}`);
      setUserEmail(null);
      setUserId(null);
      setLatestScore(null);
      setHistory([]);
      return;
    }

    const user = data?.session?.user;
    if (!user) {
      setStatus("Not logged in. Go to /login");
      setUserEmail(null);
      setUserId(null);
      setLatestScore(null);
      setHistory([]);
      return;
    }

    setUserEmail(user.email);
    setUserId(user.id);
    setStatus("Ready.");

    const { data: rows, error: readErr } = await supabase
      .from("risk_scores")
      .select("risk_score, created_at, answers")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (readErr) {
      setStatus("Ready, but history load failed.");
      setErrorText(`History error: ${readErr.message}`);
      setLatestScore(null);
      setHistory([]);
      return;
    }

    setHistory(rows || []);
    setLatestScore((rows && rows[0] && rows[0].risk_score) ?? null);
  }

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetScan() {
    setAnswers({});
    setStep(0);
    setSaving(false);
    setErrorText("");
    setStatus("Ready.");
  }

  function select(points) {
    setAnswers((prev) => ({ ...prev, [q.key]: points }));
  }

  async function finishAndSave() {
    setErrorText("");
    if (!userId) {
      setErrorText("No user session found. Go to /login and log in again.");
      return;
    }
    if (Object.keys(answers).length < QUESTIONS.length) {
      setErrorText("Answer all questions before finishing.");
      return;
    }

    setSaving(true);
    setStatus("Saving scan…");

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Save timed out (12s). Likely RLS/policy or network.")), 12000)
    );

    try {
      // Try with answers first
      const attempt1 = supabase.from("risk_scores").insert({
        user_id: userId,
        risk_score: computedScore,
        answers: answers,
      });

      let result = await Promise.race([attempt1, timeout]);
      if (result?.error) {
        // If answers column isn’t recognized, retry without it
        const msg = result.error.message || "";
        if (msg.includes("answers") || msg.includes("schema cache")) {
          const attempt2 = supabase.from("risk_scores").insert({
            user_id: userId,
            risk_score: computedScore,
          });
          result = await Promise.race([attempt2, timeout]);
        }
      }

      if (result?.error) throw result.error;

      setStatus("Saved. Latest score updated.");
      await load();
    } catch (e) {
      setStatus("Save failed.");
      setErrorText(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Policy Guard</h1>
        {userEmail ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ opacity: 0.85 }}>{userEmail}</span>
            <button onClick={logout} style={{ padding: "8px 12px" }}>Logout</button>
          </div>
        ) : null}
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>

      {errorText ? (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: "1px solid #ffb3b3", background: "#fff2f2" }}>
          <b>Error:</b> {errorText}
        </div>
      ) : null}

      {!userEmail ? (
        <p style={{ marginTop: 12 }}>
          Go to <a href="/login">/login</a>.
        </p>
      ) : (
        <>
          <section style={{ marginTop: 16, padding: 16, borderRadius: 14, border: "1px solid #ddd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>Latest saved score</div>
                <div style={{ fontSize: 36, fontWeight: 900 }}>
                  {latestScore === null ? "—" : latestScore}{" "}
                  <span style={{ fontSize: 16, opacity: 0.75 }}>/ 10</span>
                </div>
              </div>
              <button onClick={resetScan} style={{ padding: "10px 14px" }}>
                New Scan
              </button>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <div style={{ fontWeight: 900, marginBottom: 8 }}>Last 5 Scans</div>
            {history.length === 0 ? (
              <div style={{ opacity: 0.8 }}>No history yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {history.map((h, idx) => (
                  <div key={idx} style={{ padding: 10, border: "1px solid #eee", borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                      <div><b>Score:</b> {h.risk_score}/10</div>
                      <div style={{ opacity: 0.7 }}>{h.created_at ? new Date(h.created_at).toLocaleString() : "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <hr style={{ margin: "16px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                Step <b>{step + 1}</b> / {QUESTIONS.length}
              </div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                Live score: <b>{computedScore}</b>/10 • Risk: <b>{band.level}</b>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, opacity: 0.75, textTransform: "uppercase", letterSpacing: 1 }}>{q.title}</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{q.prompt}</div>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {q.options.map((o) => {
                  const selected = answers[q.key] === o.points;
                  return (
                    <button
                      key={o.label}
                      onClick={() => select(o.points)}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: selected ? "2px solid #222" : "1px solid #ccc",
                        background: selected ? "#f2f2f2" : "#fff",
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  style={{ padding: "10px 14px", opacity: step === 0 ? 0.5 : 1 }}
                >
                  Back
                </button>

                {!isLast ? (
                  <button
                    onClick={() => setStep((s) => Math.min(QUESTIONS.length - 1, s + 1))}
                    disabled={!answered}
                    style={{ padding: "10px 14px", opacity: !answered ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={finishAndSave}
                    disabled={saving}
                    style={{ padding: "10px 14px", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "Saving…" : "Finish & Save Score"}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section style={{ marginTop: 16, padding: 16, borderRadius: 14, border: "1px solid #ddd" }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>AI Assessment</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
              {band.level} RISK • {computedScore}/10
            </div>
            <div style={{ marginTop: 10 }}>{band.tone}</div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Recommended Actions</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                {recs.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
