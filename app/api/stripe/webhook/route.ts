import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!supabaseSecretKey) {
  throw new Error(
    "Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY."
  );
}

if (!webhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

function unixToIso(timestamp?: number | null) {
  if (!timestamp) return null;

  return new Date(timestamp * 1000).toISOString();
}

async function getUserIdFromSubscription(
  subscription: Stripe.Subscription
): Promise<string | null> {
  const metadataUserId = subscription.metadata?.user_id;

  if (metadataUserId) {
    return metadataUserId;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { data } = await supabaseAdmin
    .from("billing_customers")
    .select("user_id")
    .eq("provider", "stripe")
    .eq("provider_customer_id", customerId)
    .maybeSingle();

  return data?.user_id ?? null;
}

async function syncBillingCustomer(
  userId: string,
  customerId: string,
  email?: string | null
) {
  const { error } = await supabaseAdmin
    .from("billing_customers")
    .upsert(
      {
        user_id: userId,
        provider: "stripe",
        provider_customer_id: customerId,
        email: email ?? null,
        status: "active",
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    throw error;
  }
}

async function findPlanId(priceId?: string | null) {
  if (!priceId) return null;

  const { data, error } = await supabaseAdmin
    .from("billing_plans")
    .select("id")
    .eq("provider", "stripe")
    .eq("provider_price_id", priceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  try {
    const { data: existingEvent, error: existingEventError } =
      await supabaseAdmin
        .from("billing_events")
        .select("id, processed")
        .eq("provider", "stripe")
        .eq("provider_event_id", event.id)
        .maybeSingle();

    if (existingEventError) {
      throw existingEventError;
    }

    if (existingEvent) {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    const { error: billingEventInsertError } = await supabaseAdmin
      .from("billing_events")
      .insert({
        provider: "stripe",
        provider_event_id: event.id,
        event_type: event.type,
        processed: false,
        processed_at: null,
      });

    if (billingEventInsertError) {
      throw billingEventInsertError;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId =
          session.client_reference_id ||
          session.metadata?.user_id ||
          null;

        if (!userId) {
          throw new Error(
            "Stripe checkout session is missing the Aegivon user ID."
          );
        }

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (customerId) {
          await syncBillingCustomer(
            userId,
            customerId,
            session.customer_details?.email ?? null
          );
        }

        await supabaseAdmin
          .from("customer_accounts")
          .upsert(
            {
              user_id: userId,
              customer_status: "CUSTOMER",
              acquisition_source: "stripe",
              first_purchase_at: new Date().toISOString(),
              last_purchase_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription =
          event.data.object as Stripe.Subscription;

        const userId =
          await getUserIdFromSubscription(subscription);

        if (!userId) {
          throw new Error(
            "Unable to determine Aegivon user for Stripe subscription."
          );
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await syncBillingCustomer(
          userId,
          customerId,
          null
        );

        const item = subscription.items.data[0];

        const priceId =
          typeof item?.price?.id === "string"
            ? item.price.id
            : null;

        const planId = await findPlanId(priceId);

        const { data: customerRow, error: customerError } =
          await supabaseAdmin
            .from("billing_customers")
            .select("id")
            .eq("user_id", userId)
            .eq("provider", "stripe")
            .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        if (!customerRow) {
          throw new Error(
            "Stripe billing customer record could not be found."
          );
        }

        const status =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : subscription.status;

        const subscriptionData = {
          user_id: userId,
          customer_id: customerRow.id,
          plan_id: planId,
          provider: "stripe",
          provider_subscription_id: subscription.id,
          status,
          current_period_start: unixToIso(
            item?.current_period_start
          ),
          current_period_end: unixToIso(
            item?.current_period_end
          ),
          cancel_at_period_end:
            subscription.cancel_at_period_end,
          canceled_at: unixToIso(subscription.canceled_at),
        };

        await supabaseAdmin
          .from("billing_subscriptions")
          .upsert(
            subscriptionData,
            {
              onConflict: "provider_subscription_id",
            }
          );

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) {
          break;
        }

        const { data: customerRow, error: customerError } =
          await supabaseAdmin
            .from("billing_customers")
            .select("id, user_id")
            .eq("provider", "stripe")
            .eq("provider_customer_id", customerId)
            .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        if (!customerRow) {
          break;
        }

        await supabaseAdmin
          .from("payment_transactions")
          .insert({
            user_id: customerRow.user_id,
            customer_id: customerRow.id,
            provider: "stripe",
            provider_payment_id: invoice.id,
            transaction_type: "PAYMENT",
            amount_cents: invoice.amount_paid,
            currency: (
              invoice.currency || "usd"
            ).toUpperCase(),
            status: "SUCCEEDED",
          });

        await supabaseAdmin
          .from("customer_accounts")
          .upsert(
            {
              user_id: customerRow.user_id,
              customer_status: "ACTIVE_CUSTOMER",
              acquisition_source: "stripe",
              last_purchase_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) {
          break;
        }

        const { data: customerRow, error: customerError } =
          await supabaseAdmin
            .from("billing_customers")
            .select("id, user_id")
            .eq("provider", "stripe")
            .eq("provider_customer_id", customerId)
            .maybeSingle();

        if (customerError) {
          throw customerError;
        }

        if (customerRow) {
          await supabaseAdmin
            .from("payment_transactions")
            .insert({
              user_id: customerRow.user_id,
              customer_id: customerRow.id,
              provider: "stripe",
              provider_payment_id: invoice.id,
              transaction_type: "PAYMENT",
              amount_cents: invoice.amount_due,
              currency: (
                invoice.currency || "usd"
              ).toUpperCase(),
              status: "FAILED",
            });
        }

        break;
      }

      default:
        break;
    }

    await supabaseAdmin
      .from("billing_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq("provider", "stripe")
      .eq("provider_event_id", event.id);

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return NextResponse.json(
      {
        error: "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
