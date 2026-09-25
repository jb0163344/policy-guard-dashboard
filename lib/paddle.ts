"use client";

import {
  initializePaddle,
  type Paddle,
} from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

export function getPaddle(): Promise<Paddle | undefined> {
  if (paddlePromise) {
    return paddlePromise;
  }

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  if (!token) {
    return Promise.reject(
      new Error("Paddle client token is not configured.")
    );
  }

  paddlePromise = initializePaddle({
    environment: "sandbox",
    token,
  });

  return paddlePromise;
}
