import { loadScreen, RouteContent } from "@/components/ui/route-loader";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChartPie, ChevronRight, FolderKanban, LayoutGrid, Menu, Moon, Sun, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { dataMode } from "@/data/mode";
import { loadBootstrap } from "@/data/bootstrap";
import { ApiError } from "@/data/client";
const Workspace = loadScreen(() => import("@/screens/Workspace"));
const Projects = loadScreen(() => import("@/screens/Projects"));
const Risks = loadScreen(() => import("@/screens/Risks"));
const Portfolio = loadScreen(() => import("@/screens/Portfolio"));
const Project = loadScreen(() => import("@/screens/Project"));
import { DemoSessionProvider, currentUser, sessionProject, useDemoSession } from "@/demo/session";
import { AccessProvider, ThemeProvider, useAccess, useTheme } from "@/demo/access";
const Login = loadScreen(() => import("@/screens/Login"));
const RiskDetail = loadScreen(() => import("@/screens/RiskDetail"));
import { contextualPath, Link, NavigationProvider, safeReturn, useNavigation } from "@/navigation";

const destinations = [
  { path: "/workspace", label: "Workspace", icon: LayoutGrid, screen: Workspace },
  { path: "/proyectos", label: "Proyectos", icon: FolderKanban, screen: Projects },
  { path: "/riesgos", label: "Riesgos", icon: TriangleAlert, screen: Risks },
  { path: "/portafolio", label: "Portafolio", icon: ChartPie, screen: Portfolio },
];
function Shell() {
  const { url } = useNavigation();
  const { session, storageIssue, clearDecisions } = useDemoSession();
  const { signOut } = useAccess();
  const { light, toggle } = useTheme();
  const path = url.split("?")[0]!;
  const segments = path.split("/").filter(Boolean);
  const projectId = segments[0] === "proyectos" ? segments[1] : undefined;
  const project = projectId ? sessionProject(projectId, session) : undefined;
  const transversalRiskId = segments[0] === "riesgos" ? segments[1] : undefined;
  const projectList = safeReturn(new URLSearchParams(url.split("?")[1]).get("lista"), "/proyectos");
  const [menuOpen, setMenuOpen] = useState(false);
  const main = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const current = destinations.find(item => item.path === path || (item.path === "/proyectos" && !!projectId) || (item.path === "/riesgos" && !!transversalRiskId)) ?? (path === "/" ? destinations[0] : undefined);
  useEffect(() => {
    const back = () => { setMenuOpen(false); main.current?.focus(); };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => { document.title = `${project?.name ?? current?.label ?? "Página no encontrada"} · GPL`; }, [current, project]);
  useEffect(() => { if (menuOpen) document.querySelector<HTMLAnchorElement>("#sidebar nav a")?.focus(); }, [menuOpen]);
  const Screen = current?.screen;
  return <div className={`app-shell ${light ? "light" : "dark"}`}>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <aside id="sidebar" className="sidebar" data-open={menuOpen} onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); } }}>
      <div className="brand"><span>GPL</span><small>Gestión de proyectos</small></div>
      <p className="nav-label">Módulos</p><nav aria-label="Navegación principal">{destinations.map(item => <Link href={item.path} key={item.path} aria-current={item === current ? "page" : undefined} onClick={() => { setMenuOpen(false); }}><item.icon aria-hidden="true" />{item.label}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="user-card"><span className="avatar">{currentUser.initials}</span><span><strong>{currentUser.name}</strong><small>{currentUser.role}</small></span></div></div>
    </aside>
    <div className="app-content"><header className="topbar"><Button ref={menuButton} className="menu-toggle" variant="ghost" aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"} aria-expanded={menuOpen} aria-controls="sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
      <nav aria-label="Ubicación" className="breadcrumb"><span>GPL</span><ChevronRight aria-hidden="true" />{projectId ? <><Link href={projectList}>Proyectos</Link><ChevronRight aria-hidden="true" /><Link href={contextualPath(`/proyectos/${projectId}/resumen`, url)}>{project?.name ?? "Proyecto"}</Link><ChevronRight aria-hidden="true" /><span aria-current="page">{segments[3] ? (segments[2] === "sugerencias" ? "Revisión IA" : "Detalle del riesgo") : segments[2] === "ejecucion" ? "Ejecución y avance" : segments[2] === "riesgos" ? "Riesgos" : "Resumen"}</span></> : transversalRiskId ? <><Link href="/riesgos">Riesgos</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Detalle del riesgo</span></> : <span aria-current="page">{current?.label ?? "Página no encontrada"}</span>}</nav>
      <div className="topbar-end"><Button variant="ghost" aria-label={light ? "Activar tema oscuro" : "Activar tema claro"} onClick={toggle}>{light ? <Moon /> : <Sun />}</Button><span className="avatar" title={currentUser.name}>{currentUser.initials}</span><Button variant="ghost" onClick={() => { clearDecisions(); signOut(); }}>Cerrar sesión</Button></div>
    </header><main id="contenido" tabIndex={-1} ref={main}>{storageIssue && <p className="form-error" role="alert">{storageIssue}</p>}<RouteContent>{projectId ? <Project projectId={projectId} view={segments[2] ?? "resumen"} recordId={segments[3]} /> : transversalRiskId ? <RiskDetail riskId={transversalRiskId} /> : Screen ? <Screen /> : <div className="page"><h1>Página no encontrada</h1><p>Elige uno de los cuatro módulos de la navegación.</p><Link href="/workspace">Ir a Workspace</Link></div>}</RouteContent></main></div>
  </div>;
}
export default function App() {
  return <NavigationProvider><ThemeProvider><AccessProvider><DemoSessionProvider><AccessGate /></DemoSessionProvider></AccessProvider></ThemeProvider></NavigationProvider>;
}
function AccessGate() {
  const { signedIn, checking } = useAccess(), { url, navigate } = useNavigation();
  const login = url.split("?")[0] === "/login";
  useEffect(() => {
    if (checking) return;
    if (!signedIn && !login) navigate(`/login?destino=${encodeURIComponent(safeReturn(url, "/workspace"))}`, true);
    if (signedIn && login) navigate(safeReturn(new URLSearchParams(url.split("?")[1]).get("destino"), "/workspace"), true);
  }, [signedIn, checking, login, url, navigate]);
  if (checking) return <div className="page"><h1>Verificando sesión…</h1><p>Consultando la sesión.</p></div>;
  return signedIn ? <ApiDataGate><Shell /></ApiDataGate> : <RouteContent><Login /></RouteContent>;
}
function ApiDataGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "ready" | "error">(dataMode === "api" ? "loading" : "ready");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (dataMode !== "api" || state !== "loading") return;
    let active = true;
    loadBootstrap()
      .then(() => { if (active) setState("ready"); })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof ApiError ? error.message : "No se pudieron cargar los datos.");
        setState("error");
      });
    return () => { active = false; };
  }, [state]);
  if (state === "loading") return <div className="page"><h1>Cargando</h1><p>Cargando datos del servicio…</p></div>;
  if (state === "error") return <div className="page"><h1>No se pudieron cargar los datos</h1><p className="form-error" role="alert">{message}</p><p>Verifica la conexión con el servicio de datos y vuelve a iniciar sesión.</p></div>;
  return <>{children}</>;
}
