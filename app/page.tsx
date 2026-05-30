useEffect(() => {
  const loadEvents = async () => {
    if (!supabase) return;

    const { data } = await supabase
      .from("risk_events")
      .select("*")
      .order("timestamp", { ascending: true });

    if (data && data.length > 0) {
      setEvents(
        data.map((e: any) => ({
          type: e.type,
          timestamp: e.timestamp,
        }))
      );
    }
  };

  loadEvents();
}, []);
