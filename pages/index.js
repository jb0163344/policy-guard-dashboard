import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [userEmail, setUserEmail] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [score, setScore] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (!mounted) return;

      if (authError) {
        setStatus(`Auth error: ${authError.message}`);
        return;
      }

      const user = authData?.user;

      if (!user) {
        setUserEmail(null);
        setScore(null);
        setStatus("Not logged in. Go to /login");
        return;
      }

      setUserEmail(user.email);
      setStatus("Logged in. Loading your risk score...");

      const { data, error } = await supabase
        .from("risk_scores")
        .select("risk_score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setStatus(`Risk score error: ${error.message}`);
        return;
      }

      if (!data) {
        setScore(null);
        setStatus("No risk score yet.");
        return;
      }

      setScore(data.risk_score);
      setStatus("Risk score loaded.");
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  async function createTestScore() {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return;

    const randomScore = Math.floor(Math.random() * 10) + 1;

    const { error } = await supabase.from("risk_scores").insert({
      user_id: user.id,
      risk_score: randomScore,
    });

    setStatus(error ? `Insert error: ${error.message}` : "Inserted. Refreshing...");
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
