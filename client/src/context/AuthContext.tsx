import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService";

import { tokenStorage } from "../services/tokenStorage";

import type { User } from "../types/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterPayload {
  email: string;
  phone_number: string;
  password: string;
  full_name: string;
  role: "mother" | "employer";
  consent_given: true;
  consent_version: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the user's session when the application starts.
  useEffect(() => {
    async function restoreSession() {
      const accessToken = tokenStorage.getAccessToken();

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        tokenStorage.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();

    // Listen for expired sessions from the API interceptor.
    function handleSessionExpired() {
      setUser(null);
    }

    window.addEventListener("mamarise:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener(
        "mamarise:session-expired",
        handleSessionExpired,
      );
    };
  }, []);

  async function login(email: string, password: string) {
    const authenticatedUser = await loginUser({ email, password });
    setUser(authenticatedUser);
  }

  async function register(payload: RegisterPayload) {
    const registeredUser = await registerUser(payload);
    setUser(registeredUser);
  }

  async function logout() {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
