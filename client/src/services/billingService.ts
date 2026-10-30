import { api } from "./api";
import type { ApiResponse } from "../types/api";

export type SubscriptionTier = "free" | "premium";

export type SubscriptionStatus = "active" | "pending_payment" | "cancelled";

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  updated_at: string;
}

export interface UpgradeSubscriptionPayload {
  tier: "premium";
}

export interface UpgradeSubscriptionResponse {
  subscription: Subscription;
  message: string;
}

async function extractData<T>(
  request: Promise<{ data: ApiResponse<T> }>,
): Promise<T> {
  const response = await request;
  const result = response.data;

  if (!result.success || !result.data) {
    throw new Error(
      result.error?.message || "The request could not be completed.",
    );
  }

  return result.data;
}

export function getSubscription(): Promise<Subscription> {
  return extractData(
    api.get<ApiResponse<Subscription>>("/billing/subscription"),
  );
}

export function requestPremiumUpgrade(): Promise<UpgradeSubscriptionResponse> {
  return extractData(
    api.post<ApiResponse<UpgradeSubscriptionResponse>>(
      "/billing/subscription/upgrade",
      { tier: "premium" },
    ),
  );
}
