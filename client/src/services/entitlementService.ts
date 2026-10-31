import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type { Entitlements } from "../types/entitlements";

export async function getEntitlements(): Promise<Entitlements> {
  const response = await api.get<ApiResponse<Entitlements>>(
    "/billing/entitlements",
  );

  const result = response.data;

  if (!result.success || !result.data) {
    throw new Error(
      result.error?.message || "Failed to load subscription entitlements.",
    );
  }

  return result.data;
}
