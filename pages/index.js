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
  try {
    setStatus("Loading session...");

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      setStatus(`Session error: ${sessionError.message}`);
      setUserEmail(null);
      setUserId(null);
      setLatestScore(null);
      return;
    }

    const session = sessionData?.session;

    if (!session?.user) {
      setStatus("Not logged in. Go to /login");
      setUserEmail(null);
      setUserId(null);
      setLatestScore(null);
      return;
    }

    const user = session.user;
    setUserEmail(user.email);
    setUserId(user.id);
    setStatus("Session OK. Loading latest score...");

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
    setStatus("Ready. Run a scan to generate your risk score.");
  } catch (e) {
    setStatus(`Unexpected error: ${e?.message || String(e)}`);
    setUserEmail(null);
    setUserId(null);
    setLatestScore(null);
  }
}
}
