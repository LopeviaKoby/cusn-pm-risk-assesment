import { useEffect } from 'react';
import { loadScreen, RouteContent } from '@/components/molecules/route-loader';
import { AccessProvider, ThemeProvider, useAccess } from '@/data/access';
import { NavigationProvider, safeReturn, useNavigation } from '@/navigation';
const WorkspaceEntry = loadScreen(() => import('@/pages/WorkspaceEntry'));
const Login = loadScreen(() => import('@/pages/Login'));
const UnavailablePage = loadScreen(() => import('@/pages/UnavailablePage'));
export default function App() {
  return <NavigationProvider><ThemeProvider><AccessProvider><AccessGate /></AccessProvider></ThemeProvider></NavigationProvider>;
}
function AccessGate() {
  const { signedIn, checking } = useAccess();
  const { url, navigate } = useNavigation();
  const path = url.split('?')[0]!;
  const login = path === '/login';
  useEffect(() => {
    if (checking) return;
    if (!signedIn && !login) navigate('/login?destino=' + encodeURIComponent(safeReturn(url, '/workspace')), true);
    if (signedIn && login) navigate(safeReturn(new URLSearchParams(url.split('?')[1]).get('destino'), '/workspace'), true);
  }, [signedIn, checking, login, url, navigate]);
  if (checking) return <main className="page"><h1>Verificando sesión…</h1></main>;
  if (!signedIn) return <RouteContent><Login /></RouteContent>;
  const workspaceRoute = path === '/' || login || /^\/workspace(?:\/[^/]+(?:\/proyectos(?:\/[^/]+(?:\/[^/]+)?)?)?)?$/.test(path);
  return <RouteContent>{workspaceRoute ? <WorkspaceEntry /> : <UnavailablePage />}</RouteContent>;
}
