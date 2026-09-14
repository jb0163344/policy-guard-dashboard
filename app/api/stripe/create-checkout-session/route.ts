import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired authentication session." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const plan = body?.plan;

    if (plan !== "pro" && plan !== "business") {
      return NextResponse.json(
        { error: "Invalid subscription plan." },
        { status: 400 }
      );
    }

    const priceId =
      plan === "pro"
        ? process.env.STRIPE_PRO_PRICE_ID
        : process.env.STRIPE_BUSINESS_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price configuration is missing." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { error: "Application URL is not configured." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      customer_email: user.email ?? undefined,

      client_reference_id: user.id,

      metadata: {
        user_id: user.id,
        plan,
      },

      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },

      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${appUrl}/billing?canceled=1`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Unable to create Stripe checkout session." },
      { status: 500 }
    );
  }
}
