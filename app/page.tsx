"use client";

import { useEffect, useMemo, useState } from "react";

import {
RiskEvent,
IndustryType,
calculateRisk,
explainThreat,
createTimestamp,
} from "../lib/riskEngine";

import { supabase } from "../lib/supabaseClient";

import RiskCore from "../components/RiskCore";
import ThreatAnalyst from "../components/ThreatAnalyst";
import ThreatTimeline from "../components/ThreatTimeline";
import MissionControl from "../components/MissionControl";
import ThreatMap from "../components/ThreatMap";

type ViewMode = "TIMELINE" | "MAP";

export default function Home() {
const [industry, setIndustry] =
useState<IndustryType>("ENTERPRISE");

const [view, setView] =
useState<ViewMode>("TIMELINE");

const [events, setEvents] =
useState<RiskEvent[]>([]);

const [userEmail, setUserEmail] =
useState<string | null>(null);

const [loading, setLoading] =
useState(true);

const [email, setEmail] =
useState("");

const [password, setPassword] =
useState("");

const [authMode, setAuthMode] =
useState<"LOGIN" | "SIGNUP">("LOGIN");

const [authLoading, setAuthLoading] =
useState(false);

const [authError, setAuthError] =
useState<string | null>(null);

const [authMessage, setAuthMessage] =
useState<string | null>(null);

const [authInitialized, setAuthInitialized] =
useState(false);

async function loadEvents() {
const {
data,
error,
} = await supabase
.from("risk_events")
.select("type, timestamp")
.order(
"timestamp",
{
ascending: true,
}
);

```
if (error) {
  console.error(
    "LOAD EVENTS ERROR:",
    error
  );

  return;
}

setEvents(
  (data || []) as RiskEvent[]
);
```

}

useEffect(() => {
let mounted = true;

```
async function initializeAuth() {
  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (!mounted) {
    return;
  }

  if (error) {
    console.error(
      "SESSION ERROR:",
      error
    );

    setUserEmail(null);
  } else if (data.session?.user) {
    setUserEmail(
      data.session.user.email ?? null
    );
  }

  setAuthInitialized(true);
  setLoading(false);
}

initializeAuth();

const {
  data: authListener,
} = supabase.auth.onAuthStateChange(
  (_event, session) => {
    if (!mounted) {
      return;
    }

    if (session?.user) {
      setUserEmail(
        session.user.email ?? null
      );
    } else {
      setUserEmail(null);
      setEvents([]);
    }
  }
);

return () => {
  mounted = false;

  authListener.subscription.unsubscribe();
};
```

}, []);

useEffect(() => {
if (!userEmail) {
return;
}

```
loadEvents();
```

}, [
userEmail,
]);

useEffect(() => {
if (!userEmail) {
return;
}

```
const channel =
  supabase
    .channel(
      "risk-events-live"
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "risk_events",
      },
      (payload) => {
        const row =
          payload.new as RiskEvent;

        setEvents(
          (previous) => {
            const alreadyExists =
              previous.some(
                (event) =>
                  event.type ===
                    row.type &&
                  event.timestamp ===
                    row.timestamp
              );

            if (alreadyExists) {
              return previous;
            }

            return [
              ...previous,
              row,
            ];
          }
        );
      }
    )
    .subscribe();

return () => {
  supabase.removeChannel(
    channel
  );
};
```

}, [
userEmail,
]);

async function handleAuth() {
setAuthLoading(true);
setAuthError(null);
setAuthMessage(null);

```
const cleanEmail =
  email.trim();

if (!cleanEmail) {
  setAuthError(
    "Please enter your email."
  );

  setAuthLoading(false);
  return;
}

if (password.length < 6) {
  setAuthError(
    "Password must contain at least 6 characters."
  );

  setAuthLoading(false);
  return;
}

if (authMode === "LOGIN") {
  const {
    data,
    error,
  } =
    await supabase.auth.signInWithPassword(
      {
        email:
          cleanEmail,
        password,
      }
    );

  if (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    setAuthError(
      error.message
    );

    setAuthLoading(false);
    return;
  }

  if (data.user) {
    setUserEmail(
      data.user.email ?? null
    );
  }
} else {
  const {
    data,
    error,
  } =
    await supabase.auth.signUp(
      {
        email:
          cleanEmail,
        password,
      }
    );

  if (error) {
    console.error(
      "SIGN UP ERROR:",
      error
    );

    setAuthError(
      error.message
    );

    setAuthLoading(false);
    return;
  }

  if (data.session?.user) {
    setUserEmail(
      data.session.user.email ?? null
    );
  } else {
    setAuthMessage(
      "Account created. Please check your email to confirm your account."
    );
  }
}

setAuthLoading(false);
```

}

async function handleSignOut() {
const {
error,
} =
await supabase.auth.signOut();

```
if (error) {
  console.error(
    "SIGN OUT ERROR:",
    error
  );
}

setUserEmail(null);
setEvents([]);
```

}

async function addEvent(
type: RiskEvent["type"]
) {
const newEvent = {
type,
timestamp:
createTimestamp(),
};

```
const updatedEvents = [
  ...events,
  newEvent,
];

setEvents(
  updatedEvents
);

const {
  error,
} =
  await supabase
    .from("risk_events")
    .insert({
      type,
      timestamp:
        newEvent.timestamp,
      risk_score:
        calculateRisk(
          updatedEvents,
          industry
        ),
      industry,
    });

if (error) {
  console.error(
    "INSERT EVENT ERROR:",
    error
  );

  setEvents(
    events
  );

  return;
}

console.log(
  "RISK EVENT INSERT SUCCESS"
);
```

}

const riskScore =
useMemo(() => {
return calculateRisk(
events,
industry
);
}, [
events,
industry,
]);

const latestEvent =
events.length > 0
? events[
events.length - 1
]
: null;

const rawAnalysis =
latestEvent
? explainThreat(
latestEvent.type
)
: {
severity: "LOW",
impact: "0",
confidence: "0%",
explanation:
"No events yet.",
};

const analysis = {
severity:
rawAnalysis.severity,
impact:
String(
rawAnalysis.impact
),
confidence:
rawAnalysis.confidence,
explanation:
rawAnalysis.explanation,
};

const riskColor =
riskScore > 80
? "#ff3b3b"
: riskScore > 50
? "#ff9d00"
: riskScore > 20
? "#ffe600"
: "#00ff88";

const status =
riskScore > 80
? "CRITICAL"
: riskScore > 50
? "HIGH"
: riskScore > 20
? "MEDIUM"
: "LOW";

if (!authInitialized) {
return (
<main
style={{
minHeight:
"100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color:
"white",
display:
"flex",
alignItems:
"center",
justifyContent:
"center",
}}
> <h1>
Initializing Aegivon... </h1> </main>
);
}

if (!userEmail) {
return (
<main
style={{
minHeight:
"100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color:
"white",
display:
"flex",
alignItems:
"center",
justifyContent:
"center",
padding:
24,
}}
>
<section
style={{
width:
"100%",
maxWidth:
420,
padding:
32,
background:
"rgba(17,24,39,.9)",
border:
"1px solid rgba(255,255,255,.1)",
borderRadius:
16,
}}
> <h1>
AEGIVON </h1>

```
      <p>
        Secure Intelligence Environment
      </p>

      <h2>
        {authMode ===
        "LOGIN"
          ? "Sign In"
          : "Create Account"}
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={
          email
        }
        onChange={(
          event
        ) =>
          setEmail(
            event.target.value
          )
        }
        style={{
          width:
            "100%",
          padding:
            12,
          marginBottom:
            12,
          boxSizing:
            "border-box",
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={
          password
        }
        onChange={(
          event
        ) =>
          setPassword(
            event.target.value
          )
        }
        style={{
          width:
            "100%",
          padding:
            12,
          marginBottom:
            12,
          boxSizing:
            "border-box",
        }}
      />

      {authError && (
        <p
          style={{
            color:
              "#ff6b6b",
          }}
        >
          {authError}
        </p>
      )}

      {authMessage && (
        <p
          style={{
            color:
              "#00ff88",
          }}
        >
          {authMessage}
        </p>
      )}

      <button
        onClick={
          handleAuth
        }
        disabled={
          authLoading
        }
        style={{
          width:
            "100%",
          padding:
            12,
          marginBottom:
            12,
        }}
      >
        {authLoading
          ? "Processing..."
          : authMode ===
            "LOGIN"
          ? "Sign In"
          : "Create Account"}
      </button>

      <button
        onClick={() => {
          setAuthMode(
            authMode ===
              "LOGIN"
              ? "SIGNUP"
              : "LOGIN"
          );

          setAuthError(
            null
          );

          setAuthMessage(
            null
          );
        }}
        style={{
          width:
            "100%",
          padding:
            12,
        }}
      >
        {authMode ===
        "LOGIN"
          ? "Create a new account"
          : "Return to sign in"}
      </button>
    </section>
  </main>
);
```

}

if (loading) {
return (
<main
style={{
minHeight:
"100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color:
"white",
display:
"flex",
alignItems:
"center",
justifyContent:
"center",
}}
> <h1>
Loading Aegivon... </h1> </main>
);
}

return (
<main
style={{
height:
"100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color:
"white",
display:
"grid",
gridTemplateColumns:
"260px 1fr 340px",
overflow:
"hidden",
}}
>
<aside
style={{
padding:
24,
borderRight:
"1px solid rgba(255,255,255,.08)",
}}
>
<div
style={{
marginBottom:
20,
}}
> <small>
AUTHENTICATED </small>

```
      <div>
        {userEmail}
      </div>

      <button
        onClick={
          handleSignOut
        }
        style={{
          marginTop:
            10,
        }}
      >
        Sign Out
      </button>
    </div>

    <MissionControl
      addEvent={
        addEvent
      }
      industry={
        industry
      }
      setIndustry={
        setIndustry
      }
    />
  </aside>

  <section
    style={{
      padding:
        24,
      overflowY:
        "auto",
    }}
  >
    <div
      style={{
        display:
          "flex",
        gap:
          10,
        marginBottom:
          20,
      }}
    >
      <button
        onClick={() =>
          setView(
            "TIMELINE"
          )
        }
      >
        Timeline
      </button>

      <button
        onClick={() =>
          setView(
            "MAP"
          )
        }
      >
        Map
      </button>
    </div>

    {view ===
    "TIMELINE" ? (
      <ThreatTimeline
        events={
          events
        }
      />
    ) : (
      <ThreatMap
        events={
          events
        }
      />
    )}
  </section>

  <aside
    style={{
      padding:
        24,
    }}
  >
    <h2>
      RISK ENGINE
    </h2>

    <RiskCore
      riskScore={
        riskScore
      }
    />

    <div
      style={{
        color:
          riskColor,
        fontSize:
          24,
        marginTop:
          10,
      }}
    >
      {status}
    </div>

    <ThreatAnalyst
      analysis={
        analysis
      }
    />
  </aside>
</main>
```

);
}
