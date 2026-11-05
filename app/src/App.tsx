import { loadScreen, RouteContent } from "@/components/molecules/route-loader";
import { useEffect, useRef, useState } from "react";
import { ChartPie, ChevronRight, FolderKanban, LayoutGrid, Menu, Moon, Sun, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/atoms/primitives";
import { DataProvider, useData } from "@/data/bootstrap";
const Workspace = loadScreen(() => import("@/pages/Workspace"));
const Projects = loadScreen(() => import("@/pages/Projects"));
const Risks = loadScreen(() => import("@/pages/Risks"));
const Portfolio = loadScreen(() => import("@/pages/Portfolio"));
const Project = loadScreen(() => import("@/pages/Project"));
const Governance = loadScreen(() => import('@/pages/Governance'));
const Complexity = loadScreen(() => import('@/pages/Complexity'));
const Purchases = loadScreen(() => import('@/pages/Purchases'));
import { AccessProvider, ThemeProvider, useAccess, useTheme } from "@/data/access";
const Login = loadScreen(() => import("@/pages/Login"));
const RiskDetail = loadScreen(() => import("@/pages/RiskDetail"));
import { contextualPath, Link, NavigationProvider, safeReturn, useNavigation } from "@/navigation";

const destinations = [
  { path: "/workspace", label: "Workspace", icon: LayoutGrid, screen: Workspace },
  { path: "/proyectos", label: "Proyectos", icon: FolderKanban, screen: Projects },
  { path: "/riesgos", label: "Riesgos", icon: TriangleAlert, screen: Risks },
  { path: "/portafolio", label: "Portafolio", icon: ChartPie, screen: Portfolio },
  { path: '/aprobaciones', label: 'Aprobaciones', icon: FolderKanban, screen: Governance },
  { path: '/complejidad', label: 'Complejidad', icon: ChartPie, screen: Complexity },
  { path: '/compras', label: 'Compras', icon: FolderKanban, screen: Purchases },
];
function Shell() {
  const { url } = useNavigation();
  const { data } = useData();
  const { signOut } = useAccess();
  const { light, toggle } = useTheme();
  const path = url.split("?")[0]!;
  const segments = path.split("/").filter(Boolean);
  const projectId = segments[0] === "proyectos" ? segments[1] : undefined;
  const project = data?.proyectos.find(item => item.id === projectId);
  const user = data?.catalogos.users.find(item => item.id === data.usuarioActualId);
  const transversalRiskId = segments[0] === "riesgos" ? segments[1] : undefined;
  const projectList = safeReturn(new URLSearchParams(url.split("?")[1]).get("lista"), "/proyectos");
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const main = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const current = destinations.find(item => item.path === path || (item.path === "/proyectos" && !!projectId) || (item.path === "/riesgos" && !!transversalRiskId)) ?? (path === "/" ? destinations[0] : undefined);
  useEffect(() => {
    const back = () => { setMenuOpen(false); main.current?.focus(); };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => { document.title = `${project?.nombre ?? current?.label ?? "Página no encontrada"} · GPL`; }, [current, project]);
  useEffect(() => { if (menuOpen) document.querySelector<HTMLAnchorElement>("#sidebar nav a")?.focus(); }, [menuOpen]);
  const Screen = current?.screen;
  return <div className={`app-shell ${light ? "light" : "dark"}`}>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <aside id="sidebar" className="sidebar" data-open={menuOpen} onKeyDown={event => { if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); } }}>
      <div className="brand"><span>GPL</span><small>Gestión de proyectos</small></div>
      <p className="nav-label">Módulos</p><nav aria-label="Navegación principal">{destinations.map(item => <Link href={item.path} key={item.path} aria-current={item === current ? "page" : undefined} onClick={() => { setMenuOpen(false); }}><item.icon aria-hidden="true" />{item.label}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="user-card"><span className="avatar">{user?.initials ?? "—"}</span><span><strong>{user?.name ?? "Usuario"}</strong></span></div></div>
    </aside>
    <div className="app-content"><header className="topbar"><Button ref={menuButton} className="menu-toggle" variant="ghost" aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"} aria-expanded={menuOpen} aria-controls="sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
      <nav aria-label="Ubicación" className="breadcrumb"><span>GPL</span><ChevronRight aria-hidden="true" />{projectId ? <><Link href={projectList}>Proyectos</Link><ChevronRight aria-hidden="true" /><Link href={contextualPath(`/proyectos/${projectId}/resumen`, url)}>{project?.nombre ?? "Proyecto"}</Link><ChevronRight aria-hidden="true" /><span aria-current="page">{segments[3] ? "Detalle del riesgo" : segments[2] === "ejecucion" ? "Ejecución y avance" : segments[2] === "riesgos" ? "Riesgos" : "Resumen"}</span></> : transversalRiskId ? <><Link href="/riesgos">Riesgos</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Detalle del riesgo</span></> : <span aria-current="page">{current?.label ?? "Página no encontrada"}</span>}</nav>
      <div className="topbar-end"><Button variant="ghost" aria-label={light ? "Activar tema oscuro" : "Activar tema claro"} onClick={toggle}>{light ? <Moon /> : <Sun />}</Button><span className="avatar" title={user?.name}>{user?.initials ?? "—"}</span><Button variant="ghost" onClick={() => { setSignOutError(""); void signOut().catch(cause => setSignOutError(cause instanceof Error ? cause.message : "No se pudo cerrar la sesión.")); }}>Cerrar sesión</Button></div>
    </header><main id="contenido" tabIndex={-1} ref={main}>{signOutError && <p role="alert" className="form-error">{signOutError}</p>}<RouteContent>{projectId ? <Project projectId={projectId} view={segments[2] ?? "resumen"} recordId={segments[3]} /> : transversalRiskId ? <RiskDetail riskId={transversalRiskId} /> : Screen ? <Screen /> : <div className="page"><h1>Página no encontrada</h1><Link href="/workspace">Ir a Workspace</Link></div>}</RouteContent></main></div>
  </div>;
}
export default function App() {
  return <NavigationProvider><ThemeProvider><AccessProvider><AccessGate /></AccessProvider></ThemeProvider></NavigationProvider>;
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
  return signedIn ? <DataProvider><ApiDataGate /></DataProvider> : <RouteContent><Login /></RouteContent>;
}
function ApiDataGate() {
  const { data, loading, error, refresh } = useData();
  if (loading) return <div className="page"><h1>Cargando</h1><p>Cargando datos del servicio…</p></div>;
  if (error || !data) return <div className="page"><h1>No se pudieron cargar los datos</h1><p className="form-error" role="alert">{error}</p><Button onClick={() => { void refresh(); }}>Reintentar</Button></div>;
  return <Shell />;
}
