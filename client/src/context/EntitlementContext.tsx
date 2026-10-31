import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "./AuthContext";
import { getEntitlements } from "../services/entitlementService";
import type { Entitlements } from "../types/entitlements";

interface EntitlementContextType {
  entitlements: Entitlements | null;
  isLoading: boolean;
  error: string | null;
  refreshEntitlements: () => void;
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(
  undefined,
);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setEntitlements(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    async function loadEntitlements() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getEntitlements();

        if (!cancelled) {
          setEntitlements(data);
        }
      } catch (err) {
        if (!cancelled) {
          setEntitlements(null);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load subscription entitlements.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEntitlements();

    return () => {
      cancelled = true;
    };
  }, [user?.id, refreshKey]);

  const refreshEntitlements = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  return (
    <EntitlementContext.Provider
      value={{
        entitlements,
        isLoading,
        error,
        refreshEntitlements,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementContext);

  if (!context) {
    throw new Error(
      "useEntitlements must be used within an EntitlementProvider",
    );
  }

  return context;
}
