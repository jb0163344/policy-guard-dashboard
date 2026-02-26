import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [userEmail, setUserEmail] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [score, setScore] = useState(null);

  async function load() {
    // Use getSession (safe when logged out)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      setStatus(`Session error: ${sessionError.message}`);
      setUserEmail(null);
      setScore(null);
      return;
    }

    const session = sessionData?.session;

    if (!session?.user) {
      setStatus("Not logged in. Go to /login");
      setUserEmail(null);
      setScore(null);
      return;
    }

    const user = session.user;
    setUserEmail(user.email);
    setStatus("Logged in. Loading your risk score...");

    const { data, error } = await supabase
      .from("risk_scores")
      .select("risk_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setStatus(`Risk score error: ${error.message}`);
      setScore(null);
      return;
    }

    if (!data) {
      setStatus("No risk score yet.");
      setScore(null);
      return;
    }

    setScore(data.risk_score);
    setStatus("Risk score loaded.");
  }

  useEffect(() => {
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  async function createTestScore() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) {
      setStatus("Not logged in. Go to /login");
      return;
    }

    const randomScore = Math.floor(Math.random() * 10) + 1;

    const { error } = await supabase.from("risk_scores").insert({
      user_id: user.id,
      risk_score: randomScore,
    });

    setStatus(error ? `Insert error: ${error.message}` : "Inserted. Reloading...");
    if (!error) load();
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Policy Guard Dashboard</h1>
      <p>{status}</p>

      {!userEmail ? (
        <p>
          Go to <a href="/login">/login</a> to sign up or log in.
        </p>
      ) : (
        <>
          <p>
            Signed in as <b>{userEmail}</b>
          </p>
          <p>
            Latest risk score: <b>{score === null ? "—" : score}</b>
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={createTestScore} style={{ padding: "10px 14px" }}>
              Create test score
            </button>
            <button onClick={logout} style={{ padding: "10px 14px" }}>
              Log out
            </button>
          </div>
        </>
      )}
    </main>
  );
}
