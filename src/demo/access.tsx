import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "@/data/client";
import { dataMode } from "@/data/mode";

// Public fictional presentation credentials. This client-side check is not authentication.
export const presentationAccount = { identifier: "pm@gpl.example.test", password: "GPL-local-2026!" };
const accessKey = "gpl.demo.access.v1";
type Access = {
  signedIn: boolean;
  checking: boolean;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};
const AccessContext = createContext<Access | null>(null);
const ThemeContext = createContext<{ light: boolean; toggle: () => void; reset: () => void } | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [light, setLight] = useState(true);
  useEffect(() => { document.documentElement.classList.toggle("light", light); document.documentElement.classList.toggle("dark", !light); }, [light]);
  return <ThemeContext value={{ light, toggle: () => setLight(value => !value), reset: () => setLight(true) }}>{children}</ThemeContext>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error("Falta ThemeProvider."); return value; }
export function AccessProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(() => {
    if (dataMode === "api") return false;
    try { return sessionStorage.getItem(accessKey) === "active"; } catch { return false; }
  });
  const [checking, setChecking] = useState(() => dataMode === "api" && window.location.pathname !== "/login");
  const { reset } = useTheme();

  useEffect(() => {
    if (dataMode !== "api" || !checking) return;
    let active = true;
    api<{ identifier: string }>("/api/v1/sesion")
      .then(() => { if (active) { setSignedIn(true); setChecking(false); } })
      .catch(() => { if (active) { setSignedIn(false); setChecking(false); } });
    return () => { active = false; };
  }, [checking]);

  async function signIn(identifier: string, password: string): Promise<boolean> {
    if (dataMode === "demo") {
      if (identifier.trim().toLowerCase() !== presentationAccount.identifier || password !== presentationAccount.password) return false;
      try { sessionStorage.setItem(accessKey, "active"); } catch { /* The in-memory session still works. */ }
      reset();
      setSignedIn(true);
      return true;
    }
    try {
      await api("/api/v1/sesion", { method: "POST", body: JSON.stringify({ identifier, password }) });
      reset();
      setSignedIn(true);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return false;
      throw error;
    }
  }

  async function signOut(): Promise<void> {
    if (dataMode === "api") {
      try { await api("/api/v1/sesion", { method: "DELETE" }); } catch { /* The local view still closes. */ }
    } else {
      try { sessionStorage.removeItem(accessKey); } catch { /* No persistent session exists. */ }
    }
    reset();
    setSignedIn(false);
  }

  return <AccessContext value={{ signedIn, checking, signIn, signOut }}>{children}</AccessContext>;
}
export function useAccess() { const value = useContext(AccessContext); if (!value) throw new Error("Falta AccessProvider."); return value; }
