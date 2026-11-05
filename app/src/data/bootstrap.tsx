import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./client";
import type { Bootstrap } from "./contracts";

type DataState = { data: Bootstrap | null; loading: boolean; error: string | null; refresh: () => Promise<void> };
const DataContext = createContext<DataState | null>(null);
export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  async function refresh() {
    setLoading(true);
    try { setData(await api<Bootstrap>("/api/v1/datos")); setError(null); }
    catch (cause) { setData(null); setError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  return <DataContext value={{ data, loading, error, refresh }}>{children}</DataContext>;
}
export function useData(): DataState {
  const context = useContext(DataContext);
  if (!context) throw new Error("Falta DataProvider.");
  return context;
}
