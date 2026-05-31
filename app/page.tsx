async function addEvent(type: string) {
  const newEvent = {
    type,
    timestamp: new Date().toISOString(),
  };

  const updated = [...events, newEvent];
  setEvents(updated);

  // 👉 SAVE TO SUPABASE
  const { error } = await supabase
    .from("risk_events")
    .insert({
      type: newEvent.type,
      timestamp: newEvent.timestamp,
      risk_score: calculateRisk(updated, industry),
      industry,
    });

  if (error) {
    console.error("Supabase insert error:", error);
  }
}
