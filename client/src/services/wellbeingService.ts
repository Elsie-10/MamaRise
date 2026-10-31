import { api } from "./api";
import type { ApiResponse } from "../types/api";

export interface WellbeingCheckin {
  id: string;
  mood_score: number;
  stress_score: number;
  sleep_hours: number | null;
  note: string | null;
  created_at: string;
}

export interface CreateCheckinPayload {
  mood_score: number;
  stress_score: number;
  sleep_hours?: number;
  note?: string;
}

export interface CreateCheckinResponse extends WellbeingCheckin {
  suggest_breathing_exercise: boolean;
}

export interface TodayCheckinResponse {
  has_checked_in_today: boolean;
  checkin: WellbeingCheckin | null;
}

export interface CheckinHistoryResponse {
  items: WellbeingCheckin[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface WellbeingSummary {
  period_days: number;
  checkin_count: number;
  average_mood: number | null;
  average_stress: number | null;
  average_sleep_hours: number | null;
}

export interface BreathingStep {
  instruction: string;
  seconds: number;
}

export interface BreathingExercise {
  title: string;
  duration_seconds: number;
  steps: BreathingStep[];
  repeat: number;
}

// Premium advanced wellbeing insights

export type InsightsPeriod = 7 | 30 | 90;

export type TrendDirection =
  | "improving"
  | "declining"
  | "stable"
  | "insufficient_data";

export interface WellbeingTrend {
  direction: TrendDirection;
  change: number | null;
}

export interface AdvancedWellbeingInsights {
  period_days: number;
  checkin_count: number;
  checkin_days: number;
  consistency_percentage: number;

  averages: {
    mood: number | null;
    stress: number | null;
    sleep_hours: number | null;
  };

  trends: {
    mood: WellbeingTrend;
    stress: WellbeingTrend;
    sleep: WellbeingTrend;
  };

  observations: string[];
  disclaimer: string;
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

export function createCheckin(
  payload: CreateCheckinPayload,
): Promise<CreateCheckinResponse> {
  return extractData(
    api.post<ApiResponse<CreateCheckinResponse>>(
      "/wellbeing/checkins",
      payload,
    ),
  );
}

export function getTodayCheckin(): Promise<TodayCheckinResponse> {
  return extractData(
    api.get<ApiResponse<TodayCheckinResponse>>("/wellbeing/checkins/today"),
  );
}

export function getCheckinHistory(
  page = 1,
  perPage = 5,
): Promise<CheckinHistoryResponse> {
  return extractData(
    api.get<ApiResponse<CheckinHistoryResponse>>("/wellbeing/checkins", {
      params: {
        page,
        per_page: perPage,
      },
    }),
  );
}

export function getWellbeingSummary(days = 7): Promise<WellbeingSummary> {
  return extractData(
    api.get<ApiResponse<WellbeingSummary>>("/wellbeing/summary", {
      params: { days },
    }),
  );
}

export function getAdvancedWellbeingInsights(
  days: InsightsPeriod = 30,
): Promise<AdvancedWellbeingInsights> {
  return extractData(
    api.get<ApiResponse<AdvancedWellbeingInsights>>(
      "/wellbeing/advanced-insights",
      {
        params: { days },
      },
    ),
  );
}

export function getBreathingExercise(): Promise<BreathingExercise> {
  return extractData(
    api.get<ApiResponse<BreathingExercise>>("/wellbeing/breathing-exercise"),
  );
}
