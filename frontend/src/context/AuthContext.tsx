"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("library_jwt_token");
      const storedUser = localStorage.getItem("library_user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          const res = await api.get<User>("/auth/me");
          setUser(res.data);
          localStorage.setItem("library_user", JSON.stringify(res.data));
        } catch {
          localStorage.removeItem("library_jwt_token");
          localStorage.removeItem("library_user");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await api.post("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const { access_token, user: userData } = res.data;

    localStorage.setItem("library_jwt_token", access_token);
    localStorage.setItem("library_user", JSON.stringify(userData));

    setToken(access_token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("library_jwt_token");
    localStorage.removeItem("library_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
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
