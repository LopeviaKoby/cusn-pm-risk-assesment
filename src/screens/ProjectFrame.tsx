import type { ReactNode } from "react";
import { Badge } from "@/components/ui/primitives";
import { dataMode } from "@/data/mode";
import { date, number, percent } from "@/demo/view-models";
import type { ProjectContext } from "@/demo/project-context";
import { contextualPath, Link, safeReturn, useNavigation } from "@/navigation";
import { Status } from "@/components/ui/project-indicators";

export function Panel({ title, children, after }: { title: string; children: ReactNode; after?: ReactNode }) {
  return <section className="panel context-panel"><header className="panel-header"><h2>{title}</h2>{after}</header>{children}</section>;
}
export function Facts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return <dl className="facts">{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}
export function Difference({ value }: { value: number | null }) {
  return <span className={value !== null && value < 0 ? "progress-behind" : ""}>{value === null ? "—" : `${value > 0 ? "+" : ""}${number(value)} pp`}</span>;
}
export function ProjectTabs({ model, active }: { model: ProjectContext; active: string }) {
  const { url } = useNavigation();
  return <nav className="project-tabs" aria-label="Vistas del proyecto">
    {[{ path: "resumen", label: "Resumen" }, { path: "ejecucion", label: "Ejecución y avance" }, { path: "riesgos", label: "Riesgos" }].map(tab => <Link key={tab.path} href={contextualPath(`/proyectos/${model.project.id}/${tab.path}`, url)} aria-current={active === tab.path ? "page" : undefined}>{tab.label}{tab.path === "riesgos" && <span className="count">{model.project.openRiskCount}</span>}</Link>)}
    <span aria-disabled="true">Cambios <span className="sr-only">No disponible</span></span><span aria-disabled="true">Gestión <span className="sr-only">No disponible</span></span>
  </nav>;
}
export function ProjectHeader({ model, active }: { model: ProjectContext; active: string }) {
  const { project: p, difference } = model;
  const { url } = useNavigation();
  const list = safeReturn(new URLSearchParams(url.split("?")[1]).get("lista"), "/proyectos");
  return <><div className="context-back"><Link href={list}>← Volver a proyectos</Link><small>Actualizado el {date(p.updatedAt)}</small></div>
    <header className="project-identity"><div className="identity-title"><h1>{p.name}</h1><Status value={p.status} /></div><p className="identity-meta">{p.client.name} · {p.country} · {p.code}</p>{p.description && <p className="identity-description">{p.description}</p>}</header>
    <div className="project-metrics">{[
      { label: "Avance planificado", value: percent(p.plannedProgress) }, { label: "Avance real", value: percent(p.actualProgress) },
      { label: "Índice SPI", value: p.spi === null ? "—" : number(p.spi) }, { label: "Diferencia plan / real", value: <Difference value={difference} /> }, { label: "Riesgos abiertos", value: p.openRiskCount },
    ].map(metric => <div key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong></div>)}</div>
    <ProjectTabs model={model} active={active} />
  </>;
}
export function UnavailableRecord({ title, back }: { title: string; back: string }) {
  return <div className="page"><h1>{title}</h1><p className="muted">El registro solicitado no está disponible en este contexto.</p><Link href={back}>Volver al listado</Link></div>;
}
export function PendingSuggestions({ model }: { model: ProjectContext }) {
  const { url } = useNavigation();
  if (dataMode === "api") return null;
  return <Panel title="Sugerencias pendientes" after={<Badge tone="info">{model.pendingSuggestions.length}</Badge>}>
    {model.pendingSuggestions.length ? <ul className="context-list">{model.pendingSuggestions.map(item => <li key={item.id}><div><small>{item.id}</small><Badge tone="info">No registrada</Badge></div><strong>{item.title}</strong><Link href={contextualPath(`/proyectos/${model.project.id}/sugerencias/${item.id}`, url, true)}>Ver sugerencia</Link></li>)}</ul> : <p className="muted">Sin sugerencias pendientes.</p>}
  </Panel>;
}
