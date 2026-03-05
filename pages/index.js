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

function decideFromScore(score) {
  if (score <= 2) {
    return { action: "ALLOW", rationale: "Low risk: allow access.", required_proofs: {} };
  }
  if (score <= 5) {
    return {
      action: "STEP_UP",
      rationale: "Moderate risk: require step-up authentication.",
      required_proofs: { mfa: true },
    };
  }
  if (score <= 8) {
    return {
      action: "QUARANTINE",
      rationale: "High risk: quarantine sensitive actions pending verification.",
      required_proofs: { mfa: true, recovery_review: true },
    };
  }
  return {
    action: "BLOCK",
    rationale: "Critical risk: block and generate incident evidence.",
    required_proofs: { reproof: true },
  };
}

function recommendations(score, answers) {
  const items = [];
  if ((answers.password_reuse ?? 0) >= 1) items.push("Stop password reuse. Start with email + banking + social.");
  if ((answers.mfa ?? 0) >= 1) items.push("Enable MFA everywhere. Prefer authenticator app over SMS.");
  if ((answers.breach_checks ?? 0) >= 1) items.push("Run breach checks and rotate passwords for breached services.");
  if ((answers.public_wifi ?? 0) >= 1) items.push("Avoid public Wi-Fi for sensitive logins or use a VPN.");
  if ((answers.password_manager ?? 0) >= 1) items.push("Adopt a password manager and generate unique passwords.");
  if ((answers.recovery ?? 0) >= 1) items.push("Verify recovery email/phone and store backup codes safely.");
  if (score >= 6) items.push("Secure your primary email first — it’s the master key to account resets.");
  return items.slice(0, 7);
}

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [status, setStatus] = useState("Loading…");
  const [errorText, setErrorText] = useState("");

  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  const [latestScore, setLatestScore] = useState(null);
  const [history, setHistory] = useState([]);

  const [latestDecision, setLatestDecision] = useState(null);
  const [latestLedger, setLatestLedger] = useState(null);

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

    const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) {
      setStatus(`Session error: ${sessErr.message}`);
      setUserEmail(null);
      setUserId(null);
      return;
    }

    const user = sessionData?.session?.user;
    if (!user) {
      setStatus("Not logged in. Go to /login");
      setUserEmail(null);
      setUserId(null);
      setLatestScore(null);
      setHistory([]);
      setLatestDecision(null);
      setLatestLedger(null);
      return;
    }

    setUserEmail(user.email);
    setUserId(user.id);

    // History
    const { data: rows, error: histErr } = await supabase
      .from("risk_scores")
      .select("id, risk_score, created_at, answers")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (histErr) {
      setStatus("Ready, but history load failed.");
      setErrorText(`History error: ${histErr.message}`);
      setLatestScore(null);
      setHistory([]);
    } else {
      setHistory(rows || []);
      setLatestScore((rows && rows[0] && rows[0].risk_score) ?? null);
    }

    // Latest decision
    const { data: dec, error: decErr } = await supabase
      .from("decisions")
      .select("action, rationale, required_proofs, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!decErr) setLatestDecision(dec || null);

    // Latest ledger anchor
    const { data: led, error: ledErr } = await supabase
      .from("audit_ledger")
      .select("hash, prev_hash, created_at, event_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!ledErr) setLatestLedger(led || null);

    setStatus("Ready.");
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
      setErrorText("No user session. Go to /login and log in again.");
      return;
    }
    if (Object.keys(answers).length < QUESTIONS.length) {
      setErrorText("Answer all questions before finishing.");
      return;
    }

    setSaving(true);
    setStatus("Saving scan…");

    try {
      // 1) Save scan
      const { data: scanRow, error: scanErr } = await supabase
        .from("risk_scores")
        .insert({
          user_id: userId,
          risk_score: computedScore,
          answers: answers,
        })
        .select("id, created_at")
        .single();

      if (scanErr) throw scanErr;

      // 2) Create Identity Firewall decision
      const decision = decideFromScore(computedScore);

      const { data: decRow, error: decErr } = await supabase
        .from("decisions")
        .insert({
          user_id: userId,
          scan_id: scanRow?.id ?? null,
          risk_score: computedScore,
          action: decision.action,
          rationale: decision.rationale,
          required_proofs: decision.required_proofs,
        })
        .select("id")
        .single();

      if (decErr) throw decErr;

      // 3) Ledger chaining (get previous hash)
      const { data: prev, error: prevErr } = await supabase
        .from("audit_ledger")
        .select("hash")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prevErr) throw prevErr;
      const prevHash = prev?.hash || null;

      const eventObj = {
        type: "SCAN_SAVED",
        at: new Date().toISOString(),
        scan: { id: scanRow?.id, created_at: scanRow?.created_at, risk_score: computedScore, answers },
        decision: { id: decRow?.id, ...decision },
      };

      const eventJson = JSON.stringify(eventObj);
      const newHash = await sha256((prevHash || "") + "|" + eventJson);

      const { error: ledErr } = await supabase.from("audit_ledger").insert({
        user_id: userId,
        event_type: "SCAN_SAVED",
        event: eventObj,
        prev_hash: prevHash,
        hash: newHash,
      });

      if (ledErr) throw ledErr;

      setStatus("Saved. Decision + ledger updated.");
      await load();
    } catch (e) {
      setStatus("Save failed.");
      setErrorText(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function generateEvidencePack() {
    setErrorText("");
    if (!userId) return;

    try {
      setStatus("Generating evidence pack…");

      const { data: scan, error: scanErr } = await supabase
        .from("risk_scores")
        .select("id, risk_score, created_at, answers")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (scanErr) throw scanErr;

      const { data: dec, error: decErr } = await supabase
        .from("decisions")
        .select("action, rationale, required_proofs, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (decErr) throw decErr;

      const { data: led, error: ledErr } = await supabase
        .from("audit_ledger")
        .select("hash, prev_hash, created_at, event_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ledErr) throw ledErr;

      const pack = {
        pack_version: "v1",
        generated_at: new Date().toISOString(),
        subject: { user_id: userId, email: userEmail },
        latest_scan: scan,
        latest_decision: dec,
        ledger_anchor: led,
      };

      const packHash = await sha256(JSON.stringify(pack));

      const { data: saved, error: saveErr } = await supabase
        .from("evidence_packs")
        .insert({
          user_id: userId,
          title: "Identity Evidence Pack (v1)",
          pack,
          pack_hash: packHash,
        })
        .select("id")
        .single();

      if (saveErr) throw saveErr;

      downloadJson(`evidence-pack-${saved.id}.json`, { ...pack, pack_hash: packHash });
      setStatus("Evidence pack generated and downloaded.");
      await load();
    } catch (e) {
      setStatus("Evidence pack failed.");
      setErrorText(e?.message || String(e));
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Policy Guard</h1>
        {userEmail ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ opacity: 0.85 }}>{userEmail}</span>
            <button onClick={logout} style={{ padding: "8px 12px" }}>
              Logout
            </button>
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
                  {latestScore === null ? "—" : latestScore} <span style={{ fontSize: 16, opacity: 0.75 }}>/ 10</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={resetScan} style={{ padding: "10px 14px" }}>
                  New Scan
                </button>
                <button onClick={generateEvidencePack} style={{ padding: "10px 14px" }}>
                  Generate Evidence Pack
                </button>
              </div>
            </div>

            <hr style={{ margin: "16px 0" }} />

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <b>Identity Firewall (latest decision):</b>{" "}
                {latestDecision ? (
                  <>
                    <span style={{ marginLeft: 6 }}>
                      <b>{latestDecision.action}</b> — {latestDecision.rationale}
                    </span>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      Required proofs: {JSON.stringify(latestDecision.required_proofs || {})} • {latestDecision.created_at ? fmt(latestDecision.created_at) : ""}
                    </div>
                  </>
                ) : (
                  <span style={{ marginLeft: 6, opacity: 0.8 }}>No decision yet.</span>
                )}
              </div>

              <div>
                <b>Evidence Ledger (latest anchor):</b>{" "}
                {latestLedger ? (
                  <div style={{ opacity: 0.9, marginTop: 4 }}>
                    Hash: <code>{latestLedger.hash}</code>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      Prev: <code>{latestLedger.prev_hash || "—"}</code> • {latestLedger.created_at ? fmt(latestLedger.created_at) : ""}
                    </div>
                  </div>
                ) : (
                  <span style={{ marginLeft: 6, opacity: 0.8 }}>No ledger entries yet.</span>
                )}
              </div>
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
                      <div>
                        <b>Score:</b> {h.risk_score}/10
                      </div>
                      <div style={{ opacity: 0.7 }}>{h.created_at ? fmt(h.created_at) : "—"}</div>
                    </div>
                    {h.answers ? (
                      <details style={{ marginTop: 8 }}>
                        <summary style={{ cursor: "pointer" }}>View answers</summary>
                        <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{JSON.stringify(h.answers, null, 2)}</pre>
                      </details>
                    ) : null}
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
                  <button onClick={finishAndSave} disabled={saving} style={{ padding: "10px 14px", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Saving…" : "Finish & Save (Decision + Ledger)"}
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
                {recs.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </section>

          <p style={{ marginTop: 16, opacity: 0.85 }}>
            Next: <a href="/replay">Replay Mode</a>
          </p>
        </>
      )}
    </main>
  );
}
