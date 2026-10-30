import { api } from "./api";
import { tokenStorage } from "./tokenStorage";

import type { ApiResponse, AuthResponse, User } from "../types/api";

interface RegisterPayload {
  email: string;
  phone_number: string;
  password: string;
  full_name: string;
  role: "mother" | "employer";
  consent_given: true;
  consent_version: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/register",
    payload,
  );

  const result = response.data;

  if (!result.success || !result.data) {
    throw new Error(result.error?.message ?? "Registration failed");
  }

  const { user, access_token, refresh_token } = result.data;

  tokenStorage.setTokens(access_token, refresh_token);

  return user;
}

export async function loginUser(payload: LoginPayload): Promise<User> {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    payload,
  );

  const result = response.data;

  if (!result.success || !result.data) {
    throw new Error(result.error?.message ?? "Login failed");
  }

  const { user, access_token, refresh_token } = result.data;

  tokenStorage.setTokens(access_token, refresh_token);

  return user;
}

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    tokenStorage.clearTokens();
  }
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<ApiResponse<User>>("/auth/me");

  const result = response.data;

  if (!result.success || !result.data) {
    throw new Error(result.error?.message ?? "Unable to retrieve profile");
  }

  return result.data;
}
