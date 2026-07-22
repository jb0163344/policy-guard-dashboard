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

type Membership = {
organization_id: string;
role: string;
};

export default function Home() {
const [industry, setIndustry] =
useState<IndustryType>("ENTERPRISE");

const [view, setView] =
useState<ViewMode>("TIMELINE");

const [events, setEvents] =
useState<RiskEvent[]>([]);

const [userEmail, setUserEmail] =
useState<string | null>(null);

const [organizationId, setOrganizationId] =
useState<string | null>(null);

const [loading, setLoading] =
useState(true);

const [organizationError, setOrganizationError] =
useState<string | null>(null);

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

const [sessionReady, setSessionReady] =
useState(false);

// =========================
// AUTH SESSION
// =========================

useEffect(() => {
let mounted = true;

```
async function initializeSession() {
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

  setSessionReady(true);
}

initializeSession();

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
      setOrganizationId(null);
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

// =========================
// LOGIN / SIGN UP
// =========================

async function handleAuth() {
setAuthLoading(true);
setAuthError(null);
setAuthMessage(null);

```
if (!email.trim()) {
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
  } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

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
}

if (authMode === "SIGNUP") {
  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

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
      "Account created. Please check your email to confirm your account before signing in."
    );
  }
}

setAuthLoading(false);
```

}

// =========================
// SIGN OUT
// =========================

async function handleSignOut() {
const {
error,
} = await supabase.auth.signOut();

```
if (error) {
  console.error(
    "SIGN OUT ERROR:",
    error
  );
}

setUserEmail(null);
setOrganizationId(null);
setEvents([]);
setOrganizationError(null);
```

}

// =========================
// ORGANIZATION
// =========================

async function initializeOrganization() {
setOrganizationError(null);

```
const {
  data: {
    user,
  },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  console.error(
    "AUTHENTICATED USER ERROR:",
    userError
  );

  setOrganizationError(
    "Unable to verify your authenticated session."
  );

  setLoading(false);
  return;
}

setUserEmail(
  user.email ?? null
);

const {
  data: membership,
  error: membershipError,
} = await supabase
  .from("organization_members")
  .select(
    "organization_id, role"
  )
  .eq(
    "user_id",
    user.id
  )
  .limit(1)
  .maybeSingle();

if (membershipError) {
  console.error(
    "MEMBERSHIP ERROR:",
    membershipError
  );

  setOrganizationError(
    "Unable to determine your organization membership."
  );

  setLoading(false);
  return;
}

if (membership) {
  const existingMembership =
    membership as Membership;

  setOrganizationId(
    existingMembership.organization_id
  );

  setLoading(false);
  return;
}

setOrganizationError(
  "Your account is authenticated, but no organization membership was found yet."
);

setLoading(false);
```

}

// =========================
// INITIALIZE AFTER SESSION
// =========================

useEffect(() => {
if (!sessionReady) {
return;
}

```
if (!userEmail) {
  setLoading(false);
  return;
}

setLoading(true);

initializeOrganization();
```

}, [
sessionReady,
userEmail,
]);

// =========================
// LOAD ORGANIZATION EVENTS
// =========================

async function loadEvents(
currentOrganizationId: string
) {
const {
data,
error,
} = await supabase
.from("risk_events")
.select(
"type, timestamp"
)
.eq(
"organization_id",
currentOrganizationId
)
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
if (!organizationId) {
return;
}

```
loadEvents(
  organizationId
);
```

}, [
organizationId,
]);

// =========================
// REALTIME EVENTS
// =========================

useEffect(() => {
if (!organizationId) {
return;
}

```
const channel =
  supabase
    .channel(
      "risk-events-live-" +
        organizationId
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "risk_events",
        filter:
          "organization_id=eq." +
          organizationId,
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
organizationId,
]);

// =========================
// RISK ENGINE
// =========================

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

// =========================
// ADD EVENT
// =========================

async function addEvent(
type: RiskEvent["type"]
) {
if (!organizationId) {
setOrganizationError(
"No organization is currently active."
);

```
  return;
}

const newEvent = {
  type,
  timestamp:
    createTimestamp(),
};

const updatedEvents = [
  ...events,
  newEvent,
];

setEvents(
  updatedEvents
);

const {
  error,
} = await supabase
  .from("risk_events")
  .insert({
    organization_id:
      organizationId,

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
  "RISK EVENT INSERTED SUCCESSFULLY"
);
```

}

// =========================
// UI
// =========================

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

// =========================
// SESSION LOADING
// =========================

if (!sessionReady) {
return (
<main
style={{
minHeight: "100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color: "white",
display: "flex",
alignItems: "center",
justifyContent: "center",
}}
> <h1>
Initializing Aegivon... </h1> </main>
);
}

// =========================
// LOGIN
// =========================

if (!userEmail) {
return (
<main
style={{
minHeight: "100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color: "white",
display: "flex",
alignItems: "center",
justifyContent: "center",
padding: 24,
}}
>
<section
style={{
width: "100%",
maxWidth: 420,
padding: 32,
background:
"rgba(17,24,39,.9)",
border:
"1px solid rgba(255,255,255,.1)",
borderRadius: 16,
}}
> <h1>
AEGIVON </h1>

```
      <p>
        Secure Intelligence
        Environment
      </p>

      <h2>
        {authMode === "LOGIN"
          ? "Sign In"
          : "Create Account"}
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) =>
          setEmail(
            event.target.value
          )
        }
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 12,
          boxSizing:
            "border-box",
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) =>
          setPassword(
            event.target.value
          )
        }
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 12,
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
          width: "100%",
          padding: 12,
          marginBottom: 12,
        }}
      >
        {authLoading
          ? "Processing..."
          : authMode === "LOGIN"
          ? "Sign In"
          : "Create Account"}
      </button>

      <button
        onClick={() => {
          setAuthMode(
            authMode === "LOGIN"
              ? "SIGNUP"
              : "LOGIN"
          );

          setAuthError(null);
          setAuthMessage(null);
        }}
        style={{
          width: "100%",
          padding: 12,
        }}
      >
        {authMode === "LOGIN"
          ? "Create a new account"
          : "Return to sign in"}
      </button>
    </section>
  </main>
);
```

}

// =========================
// ORGANIZATION LOADING
// =========================

if (loading) {
return (
<main
style={{
minHeight: "100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color: "white",
display: "flex",
alignItems: "center",
justifyContent: "center",
flexDirection:
"column",
gap: 12,
}}
> <h1>
AEGIVON </h1>

```
    <p>
      Initializing secure organization environment...
    </p>
  </main>
);
```

}

// =========================
// ORGANIZATION ERROR
// =========================

if (
organizationError ||
!organizationId
) {
return (
<main
style={{
minHeight: "100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color: "white",
display: "flex",
alignItems: "center",
justifyContent: "center",
flexDirection:
"column",
gap: 12,
padding: 24,
}}
> <h1>
AEGIVON </h1>

```
    <p>
      {organizationError ||
        "Organization initialization failed."}
    </p>

    <button
      onClick={() => {
        setLoading(true);
        initializeOrganization();
      }}
    >
      Retry
    </button>

    <button
      onClick={
        handleSignOut
      }
    >
      Sign Out
    </button>
  </main>
);
```

}

// =========================
// DASHBOARD
// =========================

return (
<main
style={{
height: "100vh",
background:
"radial-gradient(circle at center, #111827 0%, #05070d 70%)",
color: "white",
display: "grid",
gridTemplateColumns:
"260px 1fr 340px",
overflow: "hidden",
}}
>
<aside
style={{
padding: 24,
borderRight:
"1px solid rgba(255,255,255,.08)",
}}
>
<div
style={{
marginBottom: 20,
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
          marginTop: 10,
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
      padding: 24,
      overflowY: "auto",
    }}
  >
    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 20,
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
          setView("MAP")
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
      padding: 24,
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
        fontSize: 24,
        marginTop: 10,
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
