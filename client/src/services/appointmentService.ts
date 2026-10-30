import { api } from "./api";
import type { ApiResponse } from "../types/api";

export type MilestoneType =
  | "pediatric_checkup"
  | "family_planning"
  | "postpartum_checkup"
  | "vaccination"
  | "other";

export interface Milestone {
  id: string;
  title: string;
  type: MilestoneType;
  due_date: string;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface CreateMilestonePayload {
  title: string;
  type: MilestoneType;
  due_date: string;
  notes?: string;
}

export interface UpdateMilestonePayload {
  title?: string;
  type?: MilestoneType;
  due_date?: string;
  notes?: string;
  is_completed?: boolean;
}

export interface MilestoneListResponse {
  items: Milestone[];
}

export interface UpcomingMilestoneResponse {
  milestone: Milestone | null;
}

export interface NotificationPreferences {
  daily_wellbeing_nudges: boolean;
  vitamin_reminders: boolean;
  milestone_reminders: boolean;
  updated_at: string;
}

export type UpdateNotificationPreferencesPayload = Partial<
  Pick<
    NotificationPreferences,
    "daily_wellbeing_nudges" | "vitamin_reminders" | "milestone_reminders"
  >
>;

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

export function createMilestone(
  payload: CreateMilestonePayload,
): Promise<Milestone> {
  return extractData(
    api.post<ApiResponse<Milestone>>("/appointments/milestones", payload),
  );
}

export function getMilestones(
  includeCompleted = false,
): Promise<MilestoneListResponse> {
  return extractData(
    api.get<ApiResponse<MilestoneListResponse>>("/appointments/milestones", {
      params: {
        include_completed: includeCompleted,
      },
    }),
  );
}

export function getUpcomingMilestone(): Promise<UpcomingMilestoneResponse> {
  return extractData(
    api.get<ApiResponse<UpcomingMilestoneResponse>>(
      "/appointments/milestones/upcoming",
    ),
  );
}

export function updateMilestone(
  milestoneId: string,
  payload: UpdateMilestonePayload,
): Promise<Milestone> {
  return extractData(
    api.patch<ApiResponse<Milestone>>(
      `/appointments/milestones/${milestoneId}`,
      payload,
    ),
  );
}

export function deleteMilestone(milestoneId: string): Promise<{
  message: string;
}> {
  return extractData(
    api.delete<ApiResponse<{ message: string }>>(
      `/appointments/milestones/${milestoneId}`,
    ),
  );
}

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return extractData(
    api.get<ApiResponse<NotificationPreferences>>(
      "/appointments/notification-preferences",
    ),
  );
}

export function updateNotificationPreferences(
  payload: UpdateNotificationPreferencesPayload,
): Promise<NotificationPreferences> {
  return extractData(
    api.patch<ApiResponse<NotificationPreferences>>(
      "/appointments/notification-preferences",
      payload,
    ),
  );
}
