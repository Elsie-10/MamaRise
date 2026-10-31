import { useEntitlements } from "../context/EntitlementContext";
import type { EntitlementFeature } from "../types/entitlements";

export function useFeatureAccess(feature: EntitlementFeature) {
  const { entitlements, isLoading, error, refreshEntitlements } =
    useEntitlements();

  const hasAccess = entitlements?.features[feature] === true;

  return {
    hasAccess,
    isLocked: !isLoading && entitlements !== null && !hasAccess,
    isLoading,
    error,
    isPremium: entitlements?.is_premium ?? false,
    refreshEntitlements,
  };
}
