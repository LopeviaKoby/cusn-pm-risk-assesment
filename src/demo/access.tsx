import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Public fictional presentation credentials. This client-side check is not authentication.
export const presentationAccount = { identifier: "pm@gpl.example.test", password: "GPL-local-2026!" };
const accessKey = "gpl.demo.access.v1";
type Access = { signedIn: boolean; signIn: (identifier: string, password: string) => boolean; signOut: () => void };
const AccessContext = createContext<Access | null>(null);
const ThemeContext = createContext<{ light: boolean; toggle: () => void; reset: () => void } | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [light, setLight] = useState(true);
  useEffect(() => { document.documentElement.classList.toggle("light", light); document.documentElement.classList.toggle("dark", !light); }, [light]);
  return <ThemeContext value={{ light, toggle: () => setLight(value => !value), reset: () => setLight(true) }}>{children}</ThemeContext>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error("Falta ThemeProvider."); return value; }
export function AccessProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(() => { try { return sessionStorage.getItem(accessKey) === "active"; } catch { return false; } });
  const { reset } = useTheme();
  function signIn(identifier: string, password: string) {
    if (identifier.trim().toLowerCase() !== presentationAccount.identifier || password !== presentationAccount.password) return false;
    try { sessionStorage.setItem(accessKey, "active"); } catch { /* The in-memory session still works. */ }
    reset(); setSignedIn(true); return true;
  }
  function signOut() { try { sessionStorage.removeItem(accessKey); } catch { /* No persistent session exists. */ } reset(); setSignedIn(false); }
  return <AccessContext value={{ signedIn, signIn, signOut }}>{children}</AccessContext>;
}
export function useAccess() { const value = useContext(AccessContext); if (!value) throw new Error("Falta AccessProvider."); return value; }
