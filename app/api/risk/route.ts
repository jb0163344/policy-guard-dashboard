import { NextResponse } from "next/server";
import { calculateRisk, IndustryType, RiskEventType } from "../../../lib/riskEngine";
import { supabase } from "../../../lib/supabaseClient";

const VALID_EVENT_TYPES: RiskEventType[] = [
  "LOGIN_FAILURE",
  "DEVICE_UNKNOWN",
  "LOCATION_ANOMALY",
  "IMPOSSIBLE_TRAVEL",
];

const VALID_INDUSTRIES: IndustryType[] = [
  "LAW_FIRM",
  "HEALTHCARE",
  "GOVERNMENT",
  "FINANCE",
  "ENTERPRISE",
];

export async function POST(request: Request) {
  try {
    /*
     * --------------------------------------------------------
     * 1. Verify authenticated user
     * --------------------------------------------------------
     */

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    /*
     * --------------------------------------------------------
     * 2. Parse request body
     * --------------------------------------------------------
     */

    const body = await request.json();

    const {
      type,
      industry,
      timestamp,
      organization_id,
    } = body;

    /*
     * --------------------------------------------------------
     * 3. Validate event type
     * --------------------------------------------------------
     */

    if (
      typeof type !== "string" ||
      !VALID_EVENT_TYPES.includes(type as RiskEventType)
    ) {
      return NextResponse.json(
        { error: "Invalid risk event type" },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------------
     * 4. Validate industry
     * --------------------------------------------------------
     */

    if (
      typeof industry !== "string" ||
      !VALID_INDUSTRIES.includes(industry as IndustryType)
    ) {
      return NextResponse.json(
        { error: "Invalid industry" },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------------
     * 5. Validate timestamp
     * --------------------------------------------------------
     */

    if (typeof timestamp !== "string" || timestamp.length === 0) {
      return NextResponse.json(
        { error: "Valid timestamp required" },
        { status: 400 }
      );
    }

    /*
     * --------------------------------------------------------
     * 6. Calculate risk
     * --------------------------------------------------------
     */

    const event = {
      type: type as RiskEventType,
      timestamp,
    };

    const riskScore = calculateRisk(
      [event],
      industry as IndustryType
    );

    /*
     * --------------------------------------------------------
     * 7. Store event
     *
     * owner_id is intentionally taken from the authenticated
     * Supabase user rather than from the request body.
     *
     * This works together with the existing RLS policy:
     *
     * owner_id = auth.uid()
     * --------------------------------------------------------
     */

    const { data, error: insertError } = await supabase
      .from("risk_events")
      .insert({
        type,
        industry,
        timestamp,
        risk_score: riskScore,
        organization_id:
          typeof organization_id === "string"
            ? organization_id
            : null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Risk event insert failed:", insertError);

      return NextResponse.json(
        { error: "Unable to record risk event" },
        { status: 500 }
      );
    }

    /*
     * --------------------------------------------------------
     * 8. Return safe response
     * --------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,
        risk_score: riskScore,
        event: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Risk API error:", error);

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
