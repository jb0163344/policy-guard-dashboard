import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [status, setStatus] = useState("Loading...");
  const [user, setUser] = useState(null);
  const [latestScore, setLatestScore] = useState(null);

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;

    if (!currentUser) {
      setStatus("Not logged in. Go to /login");
      return;
    }

    setUser(currentUser);

    const { data, error } = await supabase
      .from("risk_scores")
      .select("risk_score, created_at")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setStatus("Error loading score.");
      return;
    }

    setLatestScore(data?.risk_score ?? null);
    setStatus("Ready.");
  }

  async function createTestScore() {
    if (!user) return;

    const randomScore = Math.floor(Math.random() * 10) + 1;

    const { error } = await supabase.from("risk_scores").insert({
      user_id: user.id,
      risk_score: randomScore,
    });

    if (error) {
      setStatus("Insert error: " + error.message);
      return;
    }

    setLatestScore(randomScore);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Policy Guard Dashboard</h1>

      <p>{status}</p>

      {!user ? (
        <p>
          Go to <a href="/login">/login</a>
        </p>
      ) : (
        <>
          <p>
            Signed in as <b>{user.email}</b>
          </p>

          <h2>
            Latest Risk Score:{" "}
            {latestScore === null ? "—" : latestScore}
          </h2>

          <button onClick={createTestScore}>
            Create Test Score
          </button>

          <button
            onClick={logout}
            style={{ marginLeft: 10 }}
          >
            Log out
          </button>
        </>
      )}
    </main>
  );
}
