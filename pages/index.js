import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [message, setMessage] = useState("Connecting to Supabase...");

  useEffect(() => {
    async function test() {
      const { error } = await supabase.from("risk_scores").select("id").limit(1);
      setMessage(error ? `Supabase error: ${error.message}` : "Supabase connected ✅");
    }
    test();
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Policy Guard Dashboard</h1>
      <p>{message}</p>
    </main>
  );
}
