"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/user";

interface UserContextValue {
  user: SessionUser | null;
  login: (user: SessionUser | null) => void;
  signOut: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    // Lectura de localStorage diferida al montaje para evitar mismatch de hidratación SSR (spec §Implementation plan, paso 2).
    try {
      const stored = JSON.parse(localStorage.getItem("av_user") || "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(stored);
    } catch {
      setUser(null);
    }
  }, []);

  const login = (u: SessionUser | null) => {
    setUser(u);
    localStorage.setItem("av_user", JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("av_user");
  };

  return (
    <UserContext.Provider value={{ user, login, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
