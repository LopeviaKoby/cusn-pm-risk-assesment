import { useEffect, useRef, useState } from "react";
import { ChartPie, ChevronRight, FolderKanban, LayoutGrid, Menu, Moon, Sun, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { demoUser } from "@/demo/view-models";
import Workspace from "@/screens/Workspace";
import Projects from "@/screens/Projects";
import Risks from "@/screens/Risks";
import Portfolio from "@/screens/Portfolio";
import Project from "@/screens/Project";
import { DemoSessionProvider, sessionProject, useDemoSession } from "@/demo/session";
import { AccessProvider, ThemeProvider, useAccess, useTheme } from "@/demo/access";
import Login from "@/screens/Login";
import RiskDetail from "@/screens/RiskDetail";
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
  const menuButton = useRef<HTMLElement>(null);
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
      <div className="sidebar-bottom"><div className="user-card"><span className="avatar">{demoUser.initials}</span><span><strong>{demoUser.name}</strong><small>{demoUser.role}</small></span></div></div>
    </aside>
    <div className="app-content"><header className="topbar"><Button ref={menuButton} className="menu-toggle" variant="ghost" aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"} aria-expanded={menuOpen} aria-controls="sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</Button>
      <nav aria-label="Ubicación" className="breadcrumb"><span>GPL</span><ChevronRight aria-hidden="true" />{projectId ? <><Link href={projectList}>Proyectos</Link><ChevronRight aria-hidden="true" /><Link href={contextualPath(`/proyectos/${projectId}/resumen`, url)}>{project?.name ?? "Proyecto"}</Link><ChevronRight aria-hidden="true" /><span aria-current="page">{segments[3] ? (segments[2] === "sugerencias" ? "Revisión IA" : "Detalle del riesgo") : segments[2] === "ejecucion" ? "Ejecución y avance" : segments[2] === "riesgos" ? "Riesgos" : "Resumen"}</span></> : transversalRiskId ? <><Link href="/riesgos">Riesgos</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Detalle del riesgo</span></> : <span aria-current="page">{current?.label ?? "Página no encontrada"}</span>}</nav>
      <div className="topbar-end"><Button variant="ghost" aria-label={light ? "Activar tema oscuro" : "Activar tema claro"} onClick={toggle}>{light ? <Moon /> : <Sun />}</Button><span className="avatar" title={demoUser.name}>{demoUser.initials}</span><Button variant="ghost" onClick={() => { clearDecisions(); signOut(); }}>Cerrar sesión</Button></div>
    </header><main id="contenido" tabIndex={-1} ref={main}>{storageIssue && <p className="form-error" role="alert">{storageIssue}</p>}{projectId ? <Project projectId={projectId} view={segments[2] ?? "resumen"} recordId={segments[3]} /> : transversalRiskId ? <RiskDetail riskId={transversalRiskId} /> : Screen ? <Screen /> : <div className="page"><h1>Página no encontrada</h1><p>Elige uno de los cuatro módulos de la navegación.</p><Link href="/workspace">Ir a Workspace</Link></div>}</main></div>
  </div>;
}
export default function App() {
  return <NavigationProvider><ThemeProvider><AccessProvider><DemoSessionProvider><AccessGate /></DemoSessionProvider></AccessProvider></ThemeProvider></NavigationProvider>;
}
function AccessGate() {
  const { signedIn } = useAccess(), { url, navigate } = useNavigation();
  const login = url.split("?")[0] === "/login";
  useEffect(() => {
    if (!signedIn && !login) navigate(`/login?destino=${encodeURIComponent(safeReturn(url, "/workspace"))}`, true);
    if (signedIn && login) navigate(safeReturn(new URLSearchParams(url.split("?")[1]).get("destino"), "/workspace"), true);
  }, [signedIn, login, url, navigate]);
  return signedIn ? <Shell /> : <Login />;
}
