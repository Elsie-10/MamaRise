export type EntitlementRole = "mother" | "employer" | "admin";

export type SubscriptionTier = "free" | "premium";

export type SubscriptionStatus = "active" | "pending_payment" | "cancelled";

export type EntitlementFeature =
  | "return_to_work_planning"
  | "checklist_management"
  | "childcare_planning"
  | "wellbeing_checkins"
  | "wellbeing_history"
  | "wellbeing_summary"
  | "milestones"
  | "reminders"
  | "breathing_exercises"
  | "advanced_wellbeing_insights"
  | "organization_management"
  | "invitations"
  | "aggregate_workforce_stats"
  | "employee_roster"
  | "advanced_workforce_reports";

export interface Entitlements {
  role: EntitlementRole;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  is_premium: boolean;
  features: Partial<Record<EntitlementFeature, boolean>>;
}
