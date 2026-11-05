import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "./client";
type Access = { signedIn: boolean; checking: boolean; signIn: (identifier: string, password: string) => Promise<boolean>; signOut: () => Promise<void> };
const AccessContext = createContext<Access | null>(null);
const ThemeContext = createContext<{ light: boolean; toggle: () => void; reset: () => void } | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [light, setLight] = useState(true);
  useEffect(() => { document.documentElement.classList.toggle("light", light); document.documentElement.classList.toggle("dark", !light); }, [light]);
  return <ThemeContext value={{ light, toggle: () => setLight(value => !value), reset: () => setLight(true) }}>{children}</ThemeContext>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error("Falta ThemeProvider."); return value; }
export function AccessProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const { reset } = useTheme();
  useEffect(() => {
    let active = true;
    api("/api/v1/sesion").then(() => { if (active) setSignedIn(true); })
      .catch(() => { if (active) setSignedIn(false); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);
  async function signIn(identifier: string, password: string) {
    try { await api("/api/v1/sesion", { method: "POST", body: JSON.stringify({ identifier, password }) }); reset(); setSignedIn(true); return true; }
    catch (cause) { if (cause instanceof ApiError && cause.status === 401) return false; throw cause; }
  }
  async function signOut() { await api("/api/v1/sesion", { method: "DELETE" }); reset(); setSignedIn(false); }
  return <AccessContext value={{ signedIn, checking, signIn, signOut }}>{children}</AccessContext>;
}
export function useAccess() { const value = useContext(AccessContext); if (!value) throw new Error("Falta AccessProvider."); return value; }
