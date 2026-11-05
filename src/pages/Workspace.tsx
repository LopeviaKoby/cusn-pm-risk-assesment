import { FileText, Folder, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, Button, Empty, ExposureBadge, Filter, PageHeading, SearchField, TableFooter, TableRegion, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/primitives";
import { RowActions, RowActionsHeader, RowEdit, SortHeader, useRowEdits, useTableSort } from "@/components/organisms/table-tools";
import { date, getSuggestionEvidence, matches, officialRiskRows, projectRows, relativeDate, unique, workItems, type WorkItem } from "@/demo/view-models";
import { sessionProject, useDemoSession } from "@/demo/session";
import { dataMode } from "@/data/mode";
import { contextualPath, Link, useNavigation } from "@/navigation";

function WorkspaceTable({ rows, selectedId, onSelect }: { rows: WorkItem[]; selectedId?: string; onSelect: (id: string) => void }) {
  const { session } = useDemoSession();
  const edits = useRowEdits("workspace", rows);
  const table = useTableSort(edits.rows, {
    title: row => row.title,
    project: row => sessionProject(row.projectId ?? "", session)?.name ?? "Transversal",
    kind: row => row.kind,
    date: row => row.date,
  });
  const fields = [
    { key: "title", label: "Asunto", value: (row: WorkItem) => row.title, required: true },
    { key: "kind", label: "Tipo", type: "select" as const, options: unique(rows.map(row => row.kind)).map(value => ({ value, label: value })), value: (row: WorkItem) => row.kind },
    { key: "date", label: "Fecha", type: "date" as const, value: (row: WorkItem) => row.date },
  ];
  return <TableRegion label="Bandeja de asuntos"><table className="workspace-table"><thead><tr>
    <SortHeader label="Asunto" column="title" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Proyecto" column="project" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Tipo" column="kind" sort={table.sort} onToggle={table.toggle} />
    <RowActionsHeader />
  </tr></thead><tbody>
    {table.rows.map(item => <tr key={item.id} className="data-row" data-selected={selectedId === item.id}>
      <th scope="row"><button className="row-select" onClick={() => onSelect(item.id)} aria-pressed={selectedId === item.id}><strong>{item.title}</strong><small>{item.id} · {relativeDate(item.date)}{item.overdue && " · Vencida"}</small></button></th>
      <td>{sessionProject(item.projectId ?? "", session)?.name ?? "Transversal"}</td><td><Badge tone={item.suggestionId ? "info" : item.overdue ? "review" : "neutral"}>{item.kind}</Badge></td>
      <RowActions><RowEdit row={item} label="asunto" record={item.title} fields={fields} onSave={edits.save} /></RowActions>
    </tr>)}
  </tbody></table></TableRegion>;
}

function Preview({ item }: { item: WorkItem | undefined }) {
  const { session } = useDemoSession();
  const { url } = useNavigation();
  const risk = item?.riskId ? officialRiskRows(session).find(risk => risk.id === item.riskId) : undefined;
  return <aside className="preview" aria-label="Vista previa" aria-live="polite">
    <div className="preview-label">Vista previa {item && <Badge tone={item.suggestionId ? "info" : "neutral"}>{item.kind}</Badge>}</div>
    {!item ? <p>Selecciona un asunto de la bandeja.</p> : <>
      {item.suggestionId && <div className="preview-status"><Sparkles aria-hidden="true" /><span>No registrada</span></div>}
      <h2>{item.title}</h2><p className="project-context"><Folder aria-hidden="true" />{sessionProject(item.projectId ?? "", session)?.name ?? "Transversal"}</p>
      <div className="preview-section"><h3>Resumen {item.suggestionId ? "analítico" : "del asunto"}</h3><p className="inset">{item.summary}</p></div>
      {item.suggestionId ? <>
        <div className="preview-section"><h3>Evidencias referenciadas <span>{getSuggestionEvidence(item.suggestionId).length} fuentes</span></h3>
          {getSuggestionEvidence(item.suggestionId).map(evidence => <details className="evidence" key={evidence.id}><summary><FileText aria-hidden="true" />{evidence.title}</summary><p>{evidence.excerpt}</p><small>{evidence.reference} · {date(evidence.documentDate)}</small></details>)}
        </div>
        <p className="notice"><ShieldCheck aria-hidden="true" /><span>Esta propuesta todavía no forma parte del registro oficial de riesgos. Requiere revisión y aprobación del Project Manager.</span></p>
      </> : <>
        <dl className="preview-facts"><div><dt>Referencia</dt><dd>{item.id}</dd></div><div><dt>{risk ? "Próxima revisión" : "Fecha de solicitud"}</dt><dd className={item.overdue ? "review-overdue" : ""}>{date(item.date)}{item.overdue && " · Vencida"}</dd></div>
          {risk && <><div><dt>Estado</dt><dd><Badge tone={risk.statusTone}>{risk.status}</Badge></dd></div><div><dt>Responsable</dt><dd>{risk.owner.name}</dd></div><div><dt>Puntuación</dt><dd><ExposureBadge type={risk.type} score={risk.exposure} /></dd></div></>}
        </dl>{risk && <div className="preview-section"><h3>Plan de respuesta</h3><p className={risk.responsePlan ? "inset" : "muted"}>{risk.responsePlan || "Sin plan de respuesta registrado."}</p></div>}
      </>}
      {(item.suggestionId || risk) && <Link className="section-link" href={contextualPath(item.suggestionId ? `/proyectos/${item.projectId}/sugerencias/${item.suggestionId}` : (item.projectId ? `/proyectos/${item.projectId}/riesgos/${risk!.id}` : `/riesgos/${risk!.id}`), url, true)}>{item.suggestionId ? "Ver sugerencia" : "Ver detalle del riesgo"} →</Link>}
    </>}
  </aside>;
}
export default function Workspace() {
  const { session } = useDemoSession();
  const { url, navigate } = useNavigation();
  const isApi = dataMode === "api";
  const params = new URLSearchParams(url.split("?")[1]);
  const tab = params.get("bandeja") === "seguimiento" ? "following" : "review";
  const query = params.get("q") ?? "", kind = params.get("type") ?? "", project = params.get("project") ?? "";
  const sort = params.get("sort") ?? "default", selectedId = params.get("asunto");
  const navigateParams = (next: URLSearchParams, replace = true) => navigate(`/workspace${next.size ? `?${next}` : ""}`, replace);
  const set = (field: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(field, value); else next.delete(field); navigateParams(next); };
  const setQuery = (value: string) => set("q", value), setKind = (value: string) => set("type", value), setProject = (value: string) => set("project", value);
  const setSelectedId = (value: string) => set("asunto", value);
  const all = workItems(tab === "following", session);
  const rows = all.filter(item => matches(query, item.title, item.id, sessionProject(item.projectId ?? "", session)?.name)
    && (!kind || item.kind === kind) && (!project || item.projectId === project))
    .sort((a, b) => sort === "recent" ? b.date.localeCompare(a.date) : sort === "oldest" ? a.date.localeCompare(b.date) : 0);
  const selected = rows.find(item => item.id === selectedId) ?? rows[0];
  const overdueCount = rows.filter(item => item.overdue).length;
  const suggestionCount = rows.filter(item => item.suggestionId).length;
  const cleared = () => { const next = new URLSearchParams(params); for (const key of ["q", "type", "project", "sort", "asunto"]) next.delete(key); return next; };
  const clear = () => navigateParams(cleared());
  const changeTab = (value: string) => { const next = cleared(); if (value === "following") next.set("bandeja", "seguimiento"); else next.delete("bandeja"); navigateParams(next, false); };
  const content = <><div className="toolbar workspace-toolbar"><SearchField label="Buscar en Workspace" value={query} onChange={setQuery} />
    <Filter label="Tipo" value={kind} onChange={setKind} options={unique(all.map(item => item.kind))} />
    <Filter label="Proyecto" value={project} onChange={setProject} options={projectRows(session).map(row => ({ value: row.id, label: row.name }))} />
    {(query || kind || project) && <Button variant="ghost" onClick={clear}>Limpiar filtros</Button>}</div>
    {rows.length ? <WorkspaceTable rows={rows} selectedId={selected?.id} onSelect={setSelectedId} /> : <Empty onClear={clear} />}<TableFooter count={rows.length} total={all.length} noun="asuntos" /></>;
  return <div className="workspace-layout"><div className="page workspace-main"><PageHeading title="Workspace" description="Asuntos que requieren atención y seguimiento en los proyectos." />
    <p className="workspace-summary" role="status"><span>{rows.length} {tab === "following" ? "en seguimiento" : "por revisar"}</span><span className="review-overdue">{overdueCount} {overdueCount === 1 ? "vencido" : "vencidos"}</span>{!isApi && <span><Sparkles aria-hidden="true" />{suggestionCount} {suggestionCount === 1 ? "sugerencia de IA" : "sugerencias de IA"}</span>}</p>
    <section className="table-card"><Tabs value={tab} onValueChange={value => changeTab(String(value))}><TabsList aria-label="Bandeja de trabajo"><TabsTrigger value="review">Por revisar <span className="count">{workItems(false, session).length}</span></TabsTrigger><TabsTrigger value="following">En seguimiento <span className="count">{workItems(true, session).length}</span></TabsTrigger></TabsList>
      {["review", "following"].map(value => <TabsContent key={value} value={value}>{content}</TabsContent>)}
    </Tabs></section></div><Preview item={selected} /></div>;
}
