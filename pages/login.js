import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    // If already logged in, redirect
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) router.replace("/");
    })();
  }, [router]);

  async function signUp(e) {
    e.preventDefault();
    setStatus("Signing up...");
    if (!supabase) {
      setStatus("Client still loading. Refresh and try again.");
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    setStatus(error ? `Error: ${error.message}` : "Signup OK. Now log in.");
  }

  async function logIn(e) {
    e.preventDefault();
    setStatus("Logging in...");
    if (!supabase) {
      setStatus("Client still loading. Refresh and try again.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }

    setStatus("Login successful. Redirecting...");
    router.replace("/");
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui", maxWidth: 520 }}>
      <h1>Policy Guard — Login</h1>

      <form style={{ display: "grid", gap: 12 }} onSubmit={logIn}>
        <label>
          Email
          <input
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>

        <label>
          Password
          <input
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={signUp} style={{ padding: "10px 14px" }}>
            Sign up
          </button>
          <button type="submit" style={{ padding: "10px 14px" }}>
            Log in
          </button>
        </div>

        <p style={{ marginTop: 8 }}>{status}</p>
      </form>

      <p style={{ marginTop: 20 }}>
        Back to <a href="/">Dashboard</a>
      </p>
    </main>
  );
}
