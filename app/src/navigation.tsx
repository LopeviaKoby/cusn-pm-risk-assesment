import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from "react";

type Navigation = { url: string; navigate: (url: string, replace?: boolean) => void };
const NavigationContext = createContext<Navigation | null>(null);
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState(() => window.location.pathname + window.location.search);
  useEffect(() => {
    const sync = () => setUrl(window.location.pathname + window.location.search);
    window.addEventListener("popstate", sync);
    if (window.location.pathname === "/") { window.history.replaceState(null, "", "/workspace"); sync(); }
    return () => window.removeEventListener("popstate", sync);
  }, []);
  function navigate(next: string, replace = false) {
    if (next === url) return;
    const previousPath = window.location.pathname;
    if (replace) window.history.replaceState(null, "", next);
    else window.history.pushState(null, "", next);
    setUrl(window.location.pathname + window.location.search);
    if (!replace && previousPath !== window.location.pathname) { window.scrollTo(0, 0); document.getElementById("contenido")?.focus(); }
  }
  return <NavigationContext value={{ url, navigate }}>{children}</NavigationContext>;
}
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("Falta NavigationProvider.");
  return context;
}
export function Link({ href, onClick, ...props }: ComponentProps<"a"> & { href: string }) {
  const { navigate } = useNavigation();
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target) return;
    event.preventDefault(); navigate(href);
  }} />;
}
export function safeReturn(value: string | null, fallback: string) {
  if (!value || !/^\/(workspace|proyectos|riesgos|portafolio|aprobaciones|complejidad|compras)(\/|\?|$)/.test(value)) return fallback;
  return value;
}
export function contextualPath(path: string, current: string, origin = false) {
  const params = new URLSearchParams(current.split("?")[1]);
  const next = new URLSearchParams();
  const list = current.split("?")[0] === "/proyectos" ? current : params.get("lista");
  if (list) next.set("lista", safeReturn(list, "/proyectos"));
  if (origin) next.set("origen", current);
  return path + (next.size ? `?${next}` : "");
}
