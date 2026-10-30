import { api } from "./api";
import type { ApiResponse } from "../types/api";

export interface TodaysCheckin {
  id: string;
  mood_score: number;
  stress_score: number;
  sleep_hours: number;
  note: string | null;
  created_at: string;
}

export interface DashboardMilestone {
  id: string;
  title: string;
  type: string;
  due_date: string;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface ReturnToWorkTask {
  id: string;
  title: string;
  category: string;
  is_completed: boolean;
  is_custom: boolean;
  position: number;
}

export interface ReturnToWorkSummary {
  has_plan: boolean;
  weeks_remaining: number | null;
  top_tasks: ReturnToWorkTask[];
}

export interface DashboardSummary {
  greeting: string;
  postpartum_weeks: number | null;
  has_checked_in_today: boolean;
  todays_checkin: TodaysCheckin | null;
  next_milestone: DashboardMilestone | null;
  return_to_work: ReturnToWorkSummary;
}

export async function getDashboard(): Promise<DashboardSummary> {
  const response = await api.get<ApiResponse<DashboardSummary>>("/dashboard");

  const result = response.data;

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Unable to load your dashboard.");
  }

  return result.data;
}
