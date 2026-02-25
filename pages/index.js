import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Home() {
  const [userEmail, setUserEmail] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [score, setScore] = useState(null);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      setUserEmail(null);
      setScore(null);
      setStatus("Not logged in.");
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

    if (error) {
      setStatus(`Risk score error: ${error.message}`);
      return;
    }
