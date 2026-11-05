import { Sparkles } from "lucide-react";
import { Badge, Button, Empty, ExposureBadge, Filter, MetricStrip, PageHeading, SearchField, TableFooter, TableRegion, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { RowActions, RowActionsHeader, RowEdit, SortHeader, useRowEdits, useTableSort } from "@/components/ui/table-tools";
import { persistRiskEdit } from "@/data/edits";
import { date, getPendingSuggestions, matches, officialRiskRows, projectRows, suggestionRows, unique } from "@/demo/view-models";
import { useDemoSession } from "@/demo/session";
import { dataMode } from "@/data/mode";
import { contextualPath, Link, useNavigation } from "@/navigation";
import { NewRisk } from "./ManualForms";

type RiskRow = ReturnType<typeof officialRiskRows>[number];
type SuggestionRow = ReturnType<typeof suggestionRows>[number];
function RegisteredRiskTable({ rows, projectId, isApi }: { rows: RiskRow[]; projectId?: string; isApi: boolean }) {
  const { url } = useNavigation();
  const edits = useRowEdits(`riesgos-${projectId ?? "portafolio"}`, rows, isApi ? persistRiskEdit : undefined);
  const table = useTableSort(edits.rows, {
    title: row => row.title,
    project: row => row.projectName ?? "",
    type: row => row.type,
    status: row => row.status,
    exposure: row => row.exposure,
    owner: row => row.owner.name,
    review: row => row.reviewDate,
  });
  const fields = [
    { key: "title", label: "Riesgo", value: (row: RiskRow) => row.title, required: true },
    { key: "status", label: "Estado", type: "select" as const, options: unique(rows.map(row => row.status)).map(value => ({ value, label: value })), value: (row: RiskRow) => row.status },
    { key: "category", label: "Categoría", type: "select" as const, options: unique(rows.map(row => row.category)).map(value => ({ value, label: value })), value: (row: RiskRow) => row.category },
    { key: "probability", label: "Probabilidad (1-5)", type: "number" as const, min: 1, max: 5, value: (row: RiskRow) => row.probability },
    { key: "impact", label: "Impacto (1-5)", type: "number" as const, min: 1, max: 5, value: (row: RiskRow) => row.impact },
    { key: "strategy", label: "Estrategia", type: "select" as const, options: unique(rows.map(row => row.strategy)).map(value => ({ value, label: value })), value: (row: RiskRow) => row.strategy },
    { key: "responsePlan", label: "Plan de mitigación", value: (row: RiskRow) => row.responsePlan },
    { key: "contingency", label: "Plan de contingencia", value: (row: RiskRow) => row.contingency ?? "" },
    { key: "ownerName", label: "Responsable", value: (row: RiskRow) => row.owner.name },
  ];
  return <TableRegion label="Riesgos registrados, todas las columnas"><table className={projectId ? "risks-table project-risks-table" : "risks-table"}><thead><tr>
    <SortHeader label="Riesgo" column="title" sort={table.sort} onToggle={table.toggle} />
    {!projectId && <SortHeader label="Proyecto / alcance" column="project" sort={table.sort} onToggle={table.toggle} />}
    <SortHeader label="Tipo" column="type" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Estado" column="status" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Puntuación" column="exposure" sort={table.sort} onToggle={table.toggle} />
    {!isApi && <th scope="col">Ámbitos</th>}
    <SortHeader label="Responsable" column="owner" sort={table.sort} onToggle={table.toggle} />
    {!isApi && <SortHeader label="Próxima revisión" column="review" sort={table.sort} onToggle={table.toggle} />}
    <RowActionsHeader />
  </tr></thead><tbody>{table.rows.map(row => <tr key={row.id} className="data-row"><th scope="row"><small>{row.id}</small><Link className="record-link" href={contextualPath(row.projectId ? `/proyectos/${row.projectId}/riesgos/${row.id}` : `/riesgos/${row.id}`, url, true)}>{row.title}</Link><small>{row.category}</small></th>{!projectId && <td>{row.projectName}</td>}<td><Badge tone={row.tone}>{row.type}</Badge></td><td><Badge tone={row.statusTone}>{row.status}</Badge></td>
    <td><ExposureBadge type={row.type} score={row.exposure} /></td>{!isApi && <td><div className="scope-badges">{row.scopes.map(scope => <Badge key={scope}>{scope}</Badge>)}</div></td>}<td>{(row as RiskRow & { ownerName?: string }).ownerName ?? row.owner.name}</td>{!isApi && <td className={row.overdue ? "review-overdue" : ""}>{date(row.reviewDate)}{row.overdue && <small className="review-overdue">Vencida</small>}</td>}
    <RowActions><RowEdit row={row} label="riesgo" record={row.title} fields={fields} onSave={edits.save} /></RowActions>
  </tr>)}</tbody></table></TableRegion>;
}
function SuggestionTable({ rows }: { rows: SuggestionRow[] }) {
  const { url } = useNavigation();
  const edits = useRowEdits("sugerencias", rows);
  const table = useTableSort(edits.rows, {
    title: row => row.title,
    project: row => row.projectName ?? "",
    type: row => row.type,
    status: row => row.statusLabel,
    exposure: row => row.exposure,
    detected: row => row.detectedAt,
    linked: row => row.linkedRiskId,
  });
  const fields = [
    { key: "title", label: "Sugerencia", value: (row: SuggestionRow) => row.title, required: true },
    { key: "type", label: "Tipo propuesto", type: "select" as const, options: unique(rows.map(row => row.type)).map(value => ({ value, label: value })), value: (row: SuggestionRow) => row.type },
    { key: "statusLabel", label: "Estado de propuesta", value: (row: SuggestionRow) => row.statusLabel },
    { key: "detectedAt", label: "Detección", type: "date" as const, value: (row: SuggestionRow) => row.detectedAt },
  ];
  return <TableRegion label="Sugerencias IA, separadas del registro oficial"><table className="suggestions-table"><thead><tr>
    <SortHeader label="Sugerencia IA" column="title" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Proyecto" column="project" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Tipo propuesto" column="type" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Estado de propuesta" column="status" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Puntuación propuesta" column="exposure" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Detección" column="detected" sort={table.sort} onToggle={table.toggle} />
    <SortHeader label="Vínculo oficial" column="linked" sort={table.sort} onToggle={table.toggle} />
    <RowActionsHeader />
  </tr></thead><tbody>
    {table.rows.map(row => <tr key={row.id} className="data-row"><th scope="row"><small>{row.id}</small><Link className="record-link" href={contextualPath(`/proyectos/${row.projectId}/sugerencias/${row.id}`, url, true)}>{row.title}</Link></th><td>{row.projectName}</td><td>{row.type}</td><td><Badge tone={row.statusTone}>{row.statusLabel}</Badge></td><td><ExposureBadge type={row.type} score={row.exposure} proposed /></td><td>{date(row.detectedAt)}</td><td>{row.linkedRiskId ?? "Sin registro oficial"}</td>
    <RowActions><RowEdit row={row} label="sugerencia" record={row.title} fields={fields} onSave={edits.save} /></RowActions>
  </tr>)}
  </tbody></table></TableRegion>;
}

export default function Risks({ projectId }: { projectId?: string }) {
  const { session } = useDemoSession();
  const { url, navigate } = useNavigation();
  const params = new URLSearchParams(url.split("?")[1]);
  const isApi = dataMode === "api";
  const tab = isApi ? "registered" : params.get("bandeja") === "sugerencias" ? "suggestions" : "registered";
  const query = params.get("q") ?? "", type = params.get("type") ?? "", project = params.get("project") ?? "";
  const status = params.get("status") ?? "", scope = params.get("scope") ?? "", sort = params.get("sort") ?? (isApi ? "name" : "review");
  const owner = params.get("owner") ?? "", impacted = params.get("ambito") ?? "", category = params.get("category") ?? "";
  const navigateParams = (next: URLSearchParams, replace = true) => navigate(`${url.split("?")[0]}${next.size ? `?${next}` : ""}`, replace);
  const set = (field: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(field, value); else next.delete(field); navigateParams(next); };
  const setQuery = (value: string) => set("q", value), setType = (value: string) => set("type", value), setProject = (value: string) => set("project", value);
  const setStatus = (value: string) => set("status", value), setScope = (value: string) => set("scope", value);
  const official = officialRiskRows(session).filter(risk => !projectId || risk.projectId === projectId);
  const suggestions = suggestionRows(session).filter(item => !projectId || item.projectId === projectId);
  const isOfficial = tab === "registered";
  const cleared = () => { const next = new URLSearchParams(params); for (const key of ["q", "type", "project", "status", "scope", "sort", "owner", "ambito", "category"]) next.delete(key); return next; };
  const clear = () => navigateParams(cleared());
  const changeTab = (value: string) => { const next = cleared(); if (value === "suggestions") next.set("bandeja", "sugerencias"); else next.delete("bandeja"); navigateParams(next, false); };
  const filter = (row: { title: string; id: string; type: string; projectId: string | null; projectName?: string }, rowStatus: string, rowScope: string) => matches(query, row.title, row.id, row.projectName)
    && (!type || row.type === type) && (!project || row.projectId === project) && (!status || rowStatus === status) && (!scope || rowScope === scope);
  const rows = official.filter(row => filter(row, row.status, row.scopeType) && (!category || row.category === category) && (!owner || row.ownerId === owner) && (!impacted || row.scopes.includes(impacted)))
    .sort((a, b) => sort === "exposure" ? b.exposure - a.exposure : sort === "name" ? a.title.localeCompare(b.title, "es") : (a.reviewDate ?? "9999").localeCompare(b.reviewDate ?? "9999"));
  const proposalRows = suggestions.filter(row => filter(row, row.statusLabel, ""))
    .sort((a, b) => sort === "exposure" ? b.exposure - a.exposure : sort === "name" ? a.title.localeCompare(b.title, "es") : b.detectedAt.localeCompare(a.detectedAt));
  const visible = isOfficial ? rows.length : proposalRows.length;
  const attention = rows.find(row => row.overdue);
  const pendingCount = getPendingSuggestions(session).filter(item => !projectId || item.projectId === projectId).length;
  const content = <><div className="toolbar surface-toolbar"><SearchField label="Buscar riesgo o código" value={query} onChange={setQuery} />
    <Filter label="Tipo" value={type} onChange={setType} options={unique((isOfficial ? official : suggestions).map(row => row.type))} />
    {!projectId && <Filter label="Proyecto" value={project} onChange={setProject} options={projectRows(session).map(row => ({ value: row.id, label: row.name }))} />}
    <Filter label="Estado" value={status} onChange={setStatus} options={unique(isOfficial ? official.map(row => row.status) : suggestions.map(row => row.statusLabel))} />
    {isOfficial && <Filter label="Categoría" value={category} onChange={value => set("category", value)} options={unique(official.map(row => row.category))} />}
    {isOfficial && !projectId && <Filter label="Alcance" value={scope} onChange={setScope} options={unique(official.map(row => row.scopeType))} />}
    {isOfficial && projectId && !isApi && <><Filter label="Responsable" value={owner} onChange={value => set("owner", value)} options={[...new Map(official.map(row => [row.ownerId, { value: row.ownerId, label: row.owner.name }])).values()]} /><Filter label="Ámbito" value={impacted} onChange={value => set("ambito", value)} options={unique(official.flatMap(row => row.scopes))} /></>}
    {(query || type || project || status || scope || owner || impacted || category) && <Button variant="ghost" onClick={clear}>Limpiar filtros</Button>}
  </div><section className="table-card">{!visible ? (isOfficial ? official.length : suggestions.length) ? <Empty onClear={clear} /> : <div className="empty"><h3>{isOfficial ? "Sin riesgos registrados" : "Sin sugerencias"}</h3><p>No hay registros en este alcance.</p></div> : isOfficial ? <RegisteredRiskTable rows={rows} projectId={projectId} isApi={isApi} /> : <SuggestionTable rows={proposalRows} />}<TableFooter count={visible} total={isOfficial ? official.length : suggestions.length} noun={isOfficial ? "riesgos registrados" : "sugerencias"} /></section>
    <p className="footnote">{isApi ? "Registro de riesgos." : isOfficial ? "Las propuestas de IA se consultan por separado." : "Una sugerencia pendiente no es un riesgo registrado."}</p>
  </>;
  return <div className={projectId ? "project-register" : "page"}><PageHeading level={projectId ? "h2" : "h1"} title={projectId ? "Riesgos del proyecto" : "Riesgos"} description={projectId ? (isApi ? "Consulta los riesgos registrados y su evaluación actual." : "Consulta los riesgos registrados, sus evaluaciones y el seguimiento de las acciones de respuesta.") : "Supervisa la exposición y las revisiones de los riesgos de tus proyectos y del portafolio."}><NewRisk projectId={projectId} /></PageHeading>
    <MetricStrip items={isApi ? [{ value: rows.length, label: "Riesgos registrados" }, projectId ? { value: unique(rows.map(row => row.category)).length, label: "Categorías" } : { value: rows.filter(row => !row.projectId).length, label: "Riesgos transversales" }] : isOfficial ? [{ value: rows.length, label: "Riesgos registrados" }, { value: rows.filter(row => row.overdue).length, label: "Revisiones vencidas", tone: "review" }, projectId ? { value: suggestions.filter(item => !item.pmDecision).length, label: "Sugerencias pendientes" } : { value: rows.filter(row => !row.projectId).length, label: "Riesgos transversales" }] : [{ value: proposalRows.length, label: "Sugerencias de IA" }, { value: proposalRows.filter(row => !row.pmDecision).length, label: "Pendientes de revisión" }]} />
    <Tabs value={tab} onValueChange={value => changeTab(String(value))}><TabsList aria-label="Registro y propuestas"><TabsTrigger value="registered">Riesgos registrados <span className="count">{official.length}</span></TabsTrigger>{!isApi && <TabsTrigger value="suggestions"><Sparkles aria-hidden="true" />Sugerencias de IA <span className="count">{suggestions.length}</span></TabsTrigger>}</TabsList>
      {!isApi && <p className="tab-note">{pendingCount} {pendingCount === 1 ? "sugerencia pendiente · no registrada" : "sugerencias pendientes · no registradas"}</p>}
      {["registered", ...(!isApi ? ["suggestions"] : [])].map(value => <TabsContent key={value} value={value}>{content}</TabsContent>)}
    </Tabs>
    {projectId && isOfficial && !isApi && attention && <section className="panel context-panel risk-attention"><header className="panel-header"><Badge tone="review">Requiere revisión</Badge><Link href={contextualPath(`/proyectos/${projectId}/riesgos/${attention.id}`, url, true)}>Ver detalle del riesgo →</Link></header><h2>{attention.title}</h2><div className="risk-attention-facts"><span>{attention.owner.name}</span><span className="review-overdue">{date(attention.reviewDate)} · Vencida</span><ExposureBadge type={attention.type} score={attention.exposure} /><span>{attention.strategy}</span></div><p className="muted">La revisión programada está vencida; consulta la evaluación y el plan de respuesta registrados.</p></section>}
  </div>;
}
