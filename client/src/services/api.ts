import axios, { type InternalAxiosRequestConfig } from "axios";

import { tokenStorage } from "./tokenStorage";
import type { ApiResponse, RefreshResponse } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Separate request client prevents refresh interceptor recursion.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post<ApiResponse<RefreshResponse>>(
    `${API_BASE_URL}/auth/refresh`,
    null,
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
      timeout: 15000,
    },
  );

  const result = response.data;

  if (!result.success || !result.data) {
    throw new Error("Token refresh failed");
  }

  const { access_token, refresh_token } = result.data;

  tokenStorage.setTokens(access_token, refresh_token);

  return access_token;
}

// Attach the access token to outgoing requests.
api.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

// Refresh expired access tokens and retry failed requests once.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);

      return api(originalRequest);
    } catch (refreshError) {
      tokenStorage.clearTokens();

      window.dispatchEvent(new Event("mamarise:session-expired"));

      return Promise.reject(refreshError);
    }
  },
);
