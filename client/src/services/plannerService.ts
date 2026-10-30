import { api } from "./api";
import type { ApiResponse } from "../types/api";

export type WorkType =
  | "remote"
  | "corporate"
  | "hybrid"
  | "gig"
  | "informal"
  | "other";

export type ChecklistCategory = "logistics" | "career" | "wellbeing";

export interface ChecklistItem {
  id: string;
  title: string;
  category: ChecklistCategory;
  is_completed: boolean;
  is_custom: boolean;
  position: number;
}

export interface ChildcareArrangement {
  id: string;
  primary_caregiver: string;
  backup_plan: string;
  commute_notes: string;
  updated_at: string;
}

export interface PlannerPlan {
  id: string;
  work_type: WorkType;
  return_date: string;
  weeks_remaining: number;
  created_at: string;
  updated_at: string;
  checklist_items: ChecklistItem[];
  childcare_arrangement: ChildcareArrangement | null;
}

export interface CreatePlanPayload {
  work_type: WorkType;
  return_date: string;
}

export interface UpdatePlanPayload {
  work_type?: WorkType;
  return_date?: string;
}

export interface CreateChecklistPayload {
  title: string;
  category: ChecklistCategory;
}

export interface UpdateChecklistPayload {
  title?: string;
  category?: ChecklistCategory;
  is_completed?: boolean;
}

export interface ChildcarePayload {
  primary_caregiver: string;
  backup_plan: string;
  commute_notes: string;
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null) {
    throw new Error(
      response.error?.message || "The request could not be completed.",
    );
  }

  return response.data;
}

const plannerService = {
  async getMyPlan(): Promise<PlannerPlan | null> {
    const response =
      await api.get<ApiResponse<PlannerPlan>>("/planner/plans/me");

    return response.data.data;
  },

  async createPlan(payload: CreatePlanPayload): Promise<PlannerPlan> {
    const response = await api.post<ApiResponse<PlannerPlan>>(
      "/planner/plans",
      payload,
    );

    return unwrap(response.data);
  },

  async updatePlan(
    planId: string,
    payload: UpdatePlanPayload,
  ): Promise<PlannerPlan> {
    const response = await api.patch<ApiResponse<PlannerPlan>>(
      `/planner/plans/${planId}`,
      payload,
    );

    return unwrap(response.data);
  },

  async deletePlan(planId: string): Promise<void> {
    await api.delete(`/planner/plans/${planId}`);
  },

  async addChecklistItem(
    planId: string,
    payload: CreateChecklistPayload,
  ): Promise<ChecklistItem> {
    const response = await api.post<ApiResponse<ChecklistItem>>(
      `/planner/plans/${planId}/checklist`,
      payload,
    );

    return unwrap(response.data);
  },

  async updateChecklistItem(
    itemId: string,
    payload: UpdateChecklistPayload,
  ): Promise<ChecklistItem> {
    const response = await api.patch<ApiResponse<ChecklistItem>>(
      `/planner/checklist/${itemId}`,
      payload,
    );

    return unwrap(response.data);
  },

  async deleteChecklistItem(itemId: string): Promise<void> {
    await api.delete(`/planner/checklist/${itemId}`);
  },

  async saveChildcareArrangement(
    planId: string,
    payload: ChildcarePayload,
  ): Promise<ChildcareArrangement> {
    const response = await api.put<ApiResponse<ChildcareArrangement>>(
      `/planner/plans/${planId}/childcare`,
      payload,
    );

    return unwrap(response.data);
  },
};

export default plannerService;
