import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

export function loadScreen<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  return lazy(async () => {
    try { return await load(); }
    catch {
      return { default: () => <div role="alert"><p>No se pudo cargar esta pantalla. Tus registros locales se conservan.</p><button className="button button-secondary" onClick={() => window.location.reload()}>Volver a cargar</button></div> };
    }
  });
}
export function RouteContent({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p role="status">Cargando…</p>}>{children}</Suspense>;
}
