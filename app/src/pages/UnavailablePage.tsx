import { Link } from '@/navigation';
export default function UnavailablePage({ title = 'Sección no disponible' }: { title?: string }) {
  return <main className="page"><h1>{title}</h1><p>Aún no disponible en v2.1.0. Esta ruta anterior no tiene un contrato público equivalente habilitado.</p><Link href="/workspace">Volver a workspaces</Link></main>;
}
