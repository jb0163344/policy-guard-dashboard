import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const QUESTIONS = [
  {
    key: "password_reuse",
    title: "Password reuse",
    prompt: "Do you reuse the same password across multiple accounts?",
    options: [
      { label: "Yes (often)", points: 2 },
      { label: "Sometimes", points: 1 },
      { label: "No (unique passwords)", points: 0 },
    ],
  },
  {
    key: "mfa",
    title: "Multi-Factor Authentication (MFA)",
    prompt: "Do you use MFA on your important accounts (email, bank, social)?",
    options: [
      { label: "No", points: 2 },
      { label: "Only on some accounts", points: 1 },
      { label: "Yes, on all important accounts", points: 0 },
    ],
  },
  {
    key: "breach_checks",
    title: "Breach awareness",
    prompt: "Have you checked if your email was in a data breach?",
    options: [
      { label: "Never checked", points: 2 },
      { label: "Checked once", points: 1 },
      { label: "I monitor regularly", points: 0 },
    ],
  },
  {
    key: "public_wifi",
    title: "Network exposure",
    prompt: "Do you use public Wi-Fi without a VPN?",
    options: [
      { label: "Often", points: 2 },
      { label: "Rarely", points: 1 },
      { label: "Never", points: 0 },
    ],
  },
  {
    key: "password_manager",
    title: "Password manager",
    prompt: "Do you use a password manager?",
    options: [
      { label: "No", points: 2 },
      { label: "Not yet / considering", points: 1 },
      { label: "Yes", points: 0 },
    ],
  },
  {
    key: "recovery",
    title: "Recovery readiness",
    prompt:
      "Do you have recovery backups set up (backup codes, secondary email/phone) on all important accounts?",
    options: [
      { label: "No", points: 2 },
      { label: "Some accounts / not sure", points: 1 },
      { label: "Yes (covered)", points: 0 },
    ],
  },
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
  if ((answers.mfa ?? 0) >= 1) items.push("Enable MFA everywhere. Prefer an authenticator app over SMS.");
  if ((answers.breach_checks ?? 0) >= 1) items.push("Run a breach check + rotate passwords for breached services.");
  if ((answers.public_wifi ?? 0) >= 1) items.push("Avoid public Wi-Fi for sensitive logins or use a VPN.");
  if ((answers.password_manager ?? 0) >= 1) items.push("Adopt a password manager; generate long unique passwords.");
  if ((answers.recovery ?? 0) >= 1) items.push("Verify recovery email/phone + store backup codes safely.");

  if (score >= 6) {
    items.push("Lock down your primary email first — it’s the master key to resets.");
    items.push("Review devices/sessions and enable login alerts.");
  } else {
    items.push("Review security settings monthly and keep MFA enabled.");
  }
  return items.slice(0, 7);
}

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function Home() {
  const [status, setStatus] = useState("Loading...");
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  // latest + history
  const [latestScore, setLatestScore] = useState(null);
  const [history, setHistory] = useState([]); // [{risk_score, created_at, answers}]

  // wizard state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({}); // { [key]: points }
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const computedScore = useMemo(() => {
    const sum = Object.values(answers).reduce((acc, v) => acc + (typeof v === "number" ? v : 0), 0);
    return clampScore(sum);
  }, [answers]);

  const band = useMemo(() => riskBand(computedScore), [computedScore]);
  const recs = useMemo(() => recommendations(computedScore, answers), [computedScore, answers]);

  async function load() {
    setStatus("Loading session...");
    const { data: sessionData, error } = await supabase.auth.getSession();

    if (error) {
      setStatus(`Session error: ${error.message}`);
      setUserEmail(null);
      setUserId(null);
      setLatestScore(null);
      setHistory([]);
      return;
    }

    const user = sessionData?.session?.user;
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

    // Load last 5 (history)
    const { data, error: readErr } = await supabase
      .from("risk_scores")
      .select("risk_score, created_at, answers")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (readErr) {
      setStatus(`Risk score read error: ${readErr.message}`);
      setLatestScore(null);
      setHistory([]);
      return;
    }

    setHistory(data || []);
    setLatestScore((data && data[0] && data[0].risk_score) ?? null);
  }

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function resetScan() {
    setAnswers({});
    setStep(0);
    setSaving(false);
    setStatus("Ready.");
  }

  function select(points) {
    const q = QUESTIONS[step];
    setAnswers((prev) => ({ ...prev, [q.key]: points }));
  }

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const answered = typeof answers[q.key] === "number";

  async function finishAndSave() {
    if (!userId) return;
    if (Object.keys(answers).length < QUESTIONS.length) {
      setStatus("Answer all questions to finish.");
      return;
    }

    setSaving(true);
    setStatus("Saving scan...");

    // Save BOTH score and raw answers
    const { error } = await supabase.from("risk_scores").insert({
      user_id: userId,
      risk_score: computedScore,
      answers: answers,
    });

    if (error) {
      setSaving(false);
      setStatus(`Insert error: ${error.message}`);
      return;
    }

    setSaving(false);
    setStatus("Saved. Latest score updated.");
    await load();
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Policy Guard</h1>
        {userEmail && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ opacity: 0.85 }}>{userEmail}</span>
            <button onClick={logout} style={{ padding: "8px 12px" }}>Logout</button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>

      {!userEmail ? (
        <p>
          Go to <a href="/login">/login</a>.
        </p>
      ) : (
        <>
          <section
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(18, 22, 40, 0.55)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>Latest saved score</div>
                <div style={{ fontSize: 36, fontWeight: 900 }}>
                  {latestScore === null ? "—" : latestScore}{" "}
                  <span style={{ fontSize: 16, opacity: 0.75 }}>/ 10</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={resetScan} style={{ padding: "10px 14px" }}>
                  New Scan
                </button>
                <button onClick={() => setShowHistory((v) => !v)} style={{ padding: "10px 14px" }}>
                  {showHistory ? "Hide History" : "Show History"}
                </button>
              </div>
            </div>

            {showHistory && (
              <>
                <hr style={{ margin: "16px 0", opacity: 0.25 }} />
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Last 5 Scans</div>
                {history.length === 0 ? (
                  <div style={{ opacity: 0.85 }}>No history yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {history.map((h, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div>
                            <b>Score:</b> {h.risk_score} / 10
                          </div>
                          <div style={{ opacity: 0.8 }}>{h.created_at ? fmt(h.created_at) : "—"}</div>
                        </div>
                        {h.answers ? (
                          <details style={{ marginTop: 8 }}>
                            <summary style={{ cursor: "pointer" }}>View answers</summary>
                            <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, opacity: 0.9 }}>
                              {JSON.stringify(h.answers, null, 2)}
                            </pre>
                          </details>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <hr style={{ margin: "16px 0", opacity: 0.25 }} />

            {/* Wizard */}
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
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{q.prompt}</div>

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
                        border: selected ? "1px solid rgba(120,200,255,0.9)" : "1px solid rgba(255,255,255,0.16)",
                        background: selected ? "rgba(120,200,255,0.14)" : "rgba(255,255,255,0.04)",
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
                    disabled={saving || Object.keys(answers).length < QUESTIONS.length}
                    style={{
                      padding: "10px 14px",
                      opacity: saving || Object.keys(answers).length < QUESTIONS.length ? 0.5 : 1,
                    }}
                  >
                    {saving ? "Saving..." : "Finish & Save Score"}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section style={{ marginTop: 16, padding: 16, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14 }}>
            <div style={{ fontSize: 14, opacity: 0.8 }}>AI Assessment</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
              {band.level} RISK • {computedScore}/10
            </div>
            <div style={{ marginTop: 10 }}>{band.tone}</div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Recommended Actions</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                {recs.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
