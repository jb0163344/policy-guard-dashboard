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
    prompt: "Do you have recovery backups set up (backup codes, secondary email/phone) on all important accounts?",
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

  // High-impact items based on answers
  if ((answers.password_reuse ?? 0) >= 1) {
    items.push("Stop password reuse: switch to unique passwords for email, banking, and social accounts first.");
  }
  if ((answers.mfa ?? 0) >= 1) {
    items.push("Enable MFA everywhere it matters (email first). Prefer authenticator app over SMS when possible.");
  }
  if ((answers.breach_checks ?? 0) >= 1) {
    items.push("Run a breach check for your primary email(s). Rotate passwords for breached services.");
  }
  if ((answers.public_wifi ?? 0) >= 1) {
    items.push("Avoid public Wi-Fi for sensitive logins or use a VPN. Turn off auto-join networks.");
  }
  if ((answers.password_manager ?? 0) >= 1) {
    items.push("Adopt a password manager and generate long unique passwords. Enable passkeys where available.");
  }
  if ((answers.recovery ?? 0) >= 1) {
    items.push("Add/verify recovery email + phone, store backup codes safely, and review account recovery settings.");
  }

  // Baseline items
  if (score >= 6) {
    items.push("Lock down your primary email account first — it’s the master key to resets.");
    items.push("Turn on login alerts and review connected devices/sessions for major accounts.");
  } else {
    items.push("Keep MFA on and review your security settings quarterly.");
  }

  // Ensure some output
  return items.slice(0, 7);
}

export default function Home() {
  const [status, setStatus] = useState("Loading...");
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  // latest saved score
  const [latestScore, setLatestScore] = useState(null);

  // wizard state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question.key]: points }
  const [saving, setSaving] = useState(false);

  const computedScore = useMemo(() => {
    const sum = Object.values(answers).reduce((acc, v) => acc + (typeof v === "number" ? v : 0), 0);
    return clampScore(sum);
  }, [answers]);

  const band = useMemo(() => riskBand(computedScore), [computedScore]);
  const recs = useMemo(() => recommendations(computedScore, answers), [computedScore, answers]);

  async function loadAuthAndLatest() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      setStatus(`Session error: ${sessionError.message}`);
      setUserEmail(null);
      setUserId(null);
      setLatestScore(null);
      return;
    }

    const user = sessionData?.session?.user;
    if (!user) {
      setStatus("Not logged in. Go to /login");
      setUserEmail(null);
      setUserId(null);
      setLatestScore(null);
      return;
    }

    setUserEmail(user.email);
    setUserId(user.id);
    setStatus("Ready. Run a scan to generate your risk score.");

    // Load latest saved score
    const { data, error } = await supabase
      .from("risk_scores")
      .select("risk_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setStatus(`Risk score read error: ${error.message}`);
      setLatestScore(null);
      return;
    }

    setLatestScore(data?.risk_score ?? null);
  }

  useEffect(() => {
    loadAuthAndLatest();
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadAuthAndLatest());
    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  function resetWizard() {
    setAnswers({});
    setStep(0);
    setSaving(false);
  }

  function selectOption(points) {
    const q = QUESTIONS[step];
    setAnswers((prev) => ({ ...prev, [q.key]: points }));
  }

  const currentQuestion = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const currentAnswer = answers[currentQuestion?.key];

  async function saveScore() {
    if (!userId) return;

    setSaving(true);
    setStatus("Saving your score...");

    const { error } = await supabase.from("risk_scores").insert({
      user_id: userId,
      risk_score: computedScore,
    });

    if (error) {
      setSaving(false);
      setStatus(`Insert error: ${error.message}`);
      return;
    }

    setSaving(false);
    setLatestScore(computedScore);
    setStatus("Saved. Your latest risk score is updated.");
  }

  async function finish() {
    // Must have answered all questions
    if (Object.keys(answers).length < QUESTIONS.length) {
      setStatus("Answer all questions to finish the scan.");
      return;
    }
    await saveScore();
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>Policy Guard Dashboard</h1>
        {userEmail ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ opacity: 0.85 }}>Signed in as <b>{userEmail}</b></span>
            <button onClick={logout} style={{ padding: "8px 12px" }}>Log out</button>
          </div>
        ) : null}
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>

      {!userEmail ? (
        <p>
          Go to <a href="/login">/login</a> to sign up or log in.
        </p>
      ) : (
        <>
          <section
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(20, 24, 40, 0.55)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "baseline" }}>
              <div>
                <div style={{ opacity: 0.85 }}>Latest saved score</div>
                <div style={{ fontSize: 34, fontWeight: 700 }}>
                  {latestScore === null ? "—" : latestScore}
                  <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.8 }}> / 10</span>
                </div>
              </div>

              <div style={{ marginLeft: "auto" }}>
                <button onClick={resetWizard} style={{ padding: "10px 14px" }}>
                  New Scan
                </button>
              </div>
            </div>

            <hr style={{ margin: "16px 0", opacity: 0.25 }} />

            {/* Wizard */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ opacity: 0.85 }}>
                  Scan Step <b>{step + 1}</b> / {QUESTIONS.length}
                </div>
                <div style={{ opacity: 0.85 }}>
                  Live score: <b>{computedScore}</b> / 10 • Risk: <b>{band.level}</b>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 14, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>
                  {currentQuestion.title}
                </div>
                <div style={{ fontSize: 20, fontWeight: 650, marginTop: 6 }}>
                  {currentQuestion.prompt}
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                  {currentQuestion.options.map((opt) => {
                    const selected = currentAnswer === opt.points;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => selectOption(opt.points)}
                        style={{
                          textAlign: "left",
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: selected ? "1px solid rgba(120,200,255,0.9)" : "1px solid rgba(255,255,255,0.14)",
                          background: selected ? "rgba(120,200,255,0.14)" : "rgba(255,255,255,0.04)",
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
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
                      disabled={typeof currentAnswer !== "number"}
                      style={{ padding: "10px 14px", opacity: typeof currentAnswer !== "number" ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={finish}
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
            </div>
          </section>

          {/* Results / Recommendations */}
          <section style={{ marginTop: 18, padding: 18, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ opacity: 0.85 }}>Policy Guard AI Assessment</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                  {band.level} RISK • {computedScore}/10
                </div>
                <div style={{ marginTop: 8, opacity: 0.9 }}>{band.tone}</div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 650, marginBottom: 8 }}>Recommended Actions</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                {recs.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
