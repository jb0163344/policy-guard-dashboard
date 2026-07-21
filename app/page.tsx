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

const [events, setEvents] = useState<RiskEvent[]>([]);

const [organizationId, setOrganizationId] =
useState<string | null>(null);

const [loadingOrganization, setLoadingOrganization] =
useState(true);

const [organizationError, setOrganizationError] =
useState<string | null>(null);

// =========================
// ORGANIZATION BOOTSTRAP
// =========================
async function initializeOrganization() {
setLoadingOrganization(true);
setOrganizationError(null);

```
// Get the currently authenticated user
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError) {
  console.error("AUTH USER ERROR:", userError);
  setOrganizationError("Unable to verify your authenticated session.");
  setLoadingOrganization(false);
  return;
}

if (!user) {
  setOrganizationError("Please log in to access Aegivon.");
  setLoadingOrganization(false);
  return;
}

// Find the user's existing organization membership
const {
  data: membership,
  error: membershipError,
} = await supabase
  .from("organization_members")
  .select("organization_id, role")
  .eq("user_id", user.id)
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

// User already belongs to an organization
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

// No organization found.
// Create the first Aegivon organization.
console.log(
  "NO ORGANIZATION FOUND. CREATING AEGIVON ORGANIZATION."
);

const {
  data: newOrganizationId,
  error: createOrganizationError,
} = await supabase.rpc("create_organization", {
  organization_name: "Aegivon",
});

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

setOrganizationId(newOrganizationId);
setLoadingOrganization(false);
```

}

// =========================
// INITIALIZE ORGANIZATION
// =========================
useEffect(() => {
initializeOrganization();
}, []);

// =========================
// LOAD EVENTS
// ORGANIZATION-SCOPED SOURCE OF TRUTH
// =========================
async function loadEvents(
currentOrganizationId: string
) {
const {
data,
error,
} = await supabase
.from("risk_events")
.select("type, timestamp")
.eq(
"organization_id",
currentOrganizationId
)
.order("timestamp", {
ascending: true,
});

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

// =========================
// LOAD EVENTS AFTER
// ORGANIZATION IS READY
// =========================
useEffect(() => {
if (!organizationId) {
return;
}

```
loadEvents(organizationId);
```

}, [organizationId]);

// =========================
// REALTIME
// ORGANIZATION-SCOPED
// =========================
useEffect(() => {
if (!organizationId) {
return;
}

```
const channel = supabase
  .channel(
    `risk-events-live-${organizationId}`
  )
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "risk_events",
      filter: `organization_id=eq.${organizationId}`,
    },
    (payload) => {
      const row =
        payload.new as RiskEvent;

      setEvents((prev) => {
        const exists = prev.some(
          (event) =>
            event.type === row.type &&
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
      });
    }
  )
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
```

}, [organizationId]);

// =========================
// RISK SCORE
// =========================
const riskScore = useMemo(() => {
return calculateRisk(
events,
industry
);
}, [
events,
industry,
]);

const latestEvent =
events.at(-1);

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
impact: String(
raw.impact
),
confidence:
raw.confidence,
explanation:
raw.explanation,
};

// =========================
// ADD EVENT
// ORGANIZATION-SCOPED
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

console.log(
  "ADDING ORGANIZATION EVENT:",
  {
    organizationId,
    newEvent,
  }
);

const updatedEvents = [
  ...events,
  newEvent,
];

// Optimistic UI update
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

  // Roll back optimistic update
  setEvents(events);
} else {
  console.log(
    "ORGANIZATION EVENT INSERT SUCCESS"
  );
}
```

}

// =========================
// ORGANIZATION LOADING STATE
// =========================
if (loadingOrganization) {
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
      onClick={() =>
        initializeOrganization()
      }
    >
      Retry
    </button>
  </main>
);
```

}

// =========================
// UI COLORS
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
// MAIN UI
// =========================
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
{/* LEFT */}
<aside
style={{
padding: 24,
borderRight:
"1px solid rgba(255,255,255,.08)",
}}
>
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
/> </aside>

```
  {/* CENTER */}
  <section
    style={{
      padding: 24,
      overflowY:
        "auto",
    }}
  >
    <div
      style={{
        display:
          "flex",
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

  {/* RIGHT */}
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
