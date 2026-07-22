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

type OrganizationMembership = {
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

const [organizationId, setOrganizationId] =
useState<string | null>(null);

const [loadingOrganization, setLoadingOrganization] =
useState(true);

const [organizationError, setOrganizationError] =
useState<string | null>(null);

const [sessionChecked, setSessionChecked] =
useState(false);

const [userEmail, setUserEmail] =
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

// =========================
// CHECK AUTH SESSION
// =========================

useEffect(() => {
async function checkSession() {
const {
data: { session },
error,
} = await supabase.auth.getSession();

```
  if (error) {
    console.error(
      "SESSION CHECK ERROR:",
      error
    );

    setUserEmail(null);
  } else if (session?.user) {
    setUserEmail(
      session.user.email ?? null
    );
  }

  setSessionChecked(true);
}

checkSession();

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(
  (_event, session) => {
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
  subscription.unsubscribe();
};
  
}, []);

// =========================
// LOGIN / SIGN UP
// =========================

async function handleAuth() {
setAuthLoading(true);
setAuthError(null);
setAuthMessage(null);

```
if (!email || !password) {
  setAuthError(
    "Please enter your email and password."
  );

  setAuthLoading(false);
  return;
}

if (authMode === "LOGIN") {
  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email,
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
} else {
  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email,
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

  if (data.session) {
    setUserEmail(
      data.user?.email ?? null
    );
  } else {
    setAuthMessage(
      "Account created. Check your email to confirm your account, then return to Aegivon and sign in."
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
await supabase.auth.signOut();

```
setUserEmail(null);
setOrganizationId(null);
setEvents([]);
setOrganizationError(null);
```

}

// =========================
// ORGANIZATION INITIALIZATION
// =========================

async function initializeOrganization() {
setLoadingOrganization(true);
setOrganizationError(null);

```
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError) {
  console.error(
    "AUTH USER ERROR:",
    userError
  );

  setOrganizationError(
    "Unable to verify your authenticated session."
  );

  setLoadingOrganization(false);
  return;
}

if (!user) {
  setOrganizationError(
    "Please log in to access Aegivon."
  );

  setLoadingOrganization(false);
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
    "ORGANIZATION MEMBERSHIP ERROR:",
    membershipError
  );

  setOrganizationError(
    "Unable to determine your organization membership."
  );

  setLoadingOrganization(false);
  return;
}

if (membership) {
  const typedMembership =
    membership as OrganizationMembership;

  console.log(
    "ORGANIZATION FOUND:",
    typedMembership.organization_id
  );

  console.log(
    "ORGANIZATION ROLE:",
    typedMembership.role
  );

  setOrganizationId(
    typedMembership.organization_id
  );

  setLoadingOrganization(false);
  return;
}

console.log(
  "NO ORGANIZATION FOUND. CREATING AEGIVON ORGANIZATION."
);

const {
  data: newOrganizationId,
  error: createOrganizationError,
} = await supabase.rpc(
  "create_organization",
  {
    organization_name:
      "Aegivon",
  }
);

if (createOrganizationError) {
  console.error(
    "CREATE ORGANIZATION ERROR:",
    createOrganizationError
  );

  setOrganizationError(
    "Unable to create your Aegivon organization."
  );

  setLoadingOrganization(false);
  return;
}

if (!newOrganizationId) {
  console.error(
    "CREATE ORGANIZATION RETURNED NO ID."
  );

  setOrganizationError(
    "Aegivon organization was not created correctly."
  );

  setLoadingOrganization(false);
  return;
}

console.log(
  "AEGIVON ORGANIZATION CREATED:",
  newOrganizationId
);

setOrganizationId(
  newOrganizationId
);

setLoadingOrganization(false);
```

}

// =========================
// INITIALIZE ORGANIZATION
// AFTER LOGIN
// =========================

useEffect(() => {
if (!sessionChecked) {
return;
}

```
if (!userEmail) {
  setLoadingOrganization(false);
  return;
}

initializeOrganization();
```

}, [
sessionChecked,
userEmail,
]);

// =========================
// LOAD EVENTS
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
    "LOAD ORGANIZATION EVENTS ERROR:",
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
// REALTIME
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
          (prev) => {
            const exists =
              prev.some(
                (event) =>
                  event.type ===
                    row.type &&
                  event.timestamp ===
                    row.timestamp
              );

            if (exists) {
              return prev;
            }

            return [
              ...prev,
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
// RISK SCORE
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
: undefined;

const raw = latestEvent
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
  severity: raw.severity,
  impact: String(raw.impact),
  confidence: raw.confidence,
  explanation: raw.explanation,
};

// =========================
// ADD EVENT
// =========================

async function addEvent(
type: RiskEvent["type"]
) {
if (!organizationId) {
console.error(
"ADD EVENT FAILED: NO ORGANIZATION ID"
);

```
  setOrganizationError(
    "Your organization is not ready yet."
  );

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
  .insert([
    {
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
    },
  ]);

if (error) {
  console.error(
    "INSERT ORGANIZATION EVENT ERROR:",
    error
  );

  setEvents(
    events
  );
} else {
  console.log(
    "ORGANIZATION EVENT INSERT SUCCESS"
  );
}
```

}

// =========================
// UI STATE
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
// SESSION CHECK
// =========================

if (!sessionChecked) {
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
// LOGIN SCREEN
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
"rgba(17,24,39,.85)",
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
        }}
      />

      {authError && (
        <p
          style={{
            color: "#ff6b6b",
          }}
        >
          {authError}
        </p>
      )}

      {authMessage && (
        <p
          style={{
            color: "#00ff88",
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

if (
loadingOrganization
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
flexDirection: "column",
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
flexDirection: "column",
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
      onClick={
        initializeOrganization
      }
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
// MAIN DASHBOARD
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
