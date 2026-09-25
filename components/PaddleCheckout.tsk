"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getPaddle } from "../lib/paddle";

type PlanCode =
  | "AEGIVON_PRO"
  | "AEGIVON_BUSINESS"
  | "AEGIVON_ENTERPRISE";

type CheckoutPlan = {
  user_id: string;
  customer_email: string;
  plan_code: string;
  plan_name: string;
  paddle_product_id: string;
  paddle_price_id: string;
  currency: string;
  amount_cents: number;
  billing_interval: string;
  paddle_environment: string;
};

type PaddleCheckoutProps = {
  planCode: PlanCode;
  label?: string;
};

export default function PaddleCheckout({
  planCode,
  label = "Subscribe",
}: PaddleCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const openCheckout = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Please sign in before starting checkout."
        );
      }

      const { data, error: rpcError } = await supabase.rpc(
        "aegivon_prepare_paddle_checkout",
        {
          p_plan_code: planCode,
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message ||
            "Unable to prepare Paddle checkout."
        );
      }

      const plan = (
        Array.isArray(data) ? data[0] : data
      ) as CheckoutPlan | null;

      if (!plan) {
        throw new Error(
          "The requested Aegivon plan is not configured."
        );
      }

      if (plan.user_id !== user.id) {
        throw new Error(
          "Checkout identity verification failed."
        );
      }

      if (plan.paddle_environment !== "sandbox") {
        throw new Error(
          "Paddle Sandbox checkout is not configured."
        );
      }

      if (!plan.paddle_price_id) {
        throw new Error(
          "The Paddle price is missing."
        );
      }

      const paddle = await getPaddle();

      if (!paddle) {
        throw new Error(
          "Paddle failed to initialize."
        );
      }

      paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          allowLogout: false,
        },

        items: [
          {
            priceId: plan.paddle_price_id,
            quantity: 1,
          },
        ],

        customer: {
          email: plan.customer_email,
        },

        customData: {
          aegivon_user_id: user.id,
          aegivon_plan_code: plan.plan_code,
          aegivon_environment: "sandbox",
        },
      });

      setStatus(
        `Opening ${plan.plan_name} checkout...`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start checkout."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={openCheckout}
        disabled={loading}
      >
        {loading
          ? "Preparing checkout..."
          : label}
      </button>

      {status && (
        <p role="status">
          {status}
        </p>
      )}

      {error && (
        <p role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
