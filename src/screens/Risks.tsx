import { Sparkles } from "lucide-react";
import { Badge, Button, Empty, ExposureBadge, Filter, MetricStrip, PageHeading, SearchField, TableFooter, TableRegion, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { date, getPendingSuggestions, matches, officialRiskRows, projectRows, suggestionRows, unique } from "@/demo/view-models";
import { useDemoSession } from "@/demo/session";
import { contextualPath, Link, useNavigation } from "@/navigation";
import { NewRisk } from "./ManualForms";

export default function Risks({ projectId }: { projectId?: string }) {
  const { session } = useDemoSession();
  const { url, navigate } = useNavigation();
  const params = new URLSearchParams(url.split("?")[1]);
  const tab = params.get("bandeja") === "sugerencias" ? "suggestions" : "registered";
  const query = params.get("q") ?? "", type = params.get("type") ?? "", project = params.get("project") ?? "";
  const status = params.get("status") ?? "", scope = params.get("scope") ?? "", sort = params.get("sort") ?? "review";
  const owner = params.get("owner") ?? "", impacted = params.get("ambito") ?? "", category = params.get("category") ?? "";
  const navigateParams = (next: URLSearchParams, replace = true) => navigate(`${url.split("?")[0]}${next.size ? `?${next}` : ""}`, replace);
  const set = (field: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(field, value); else next.delete(field); navigateParams(next); };
  const setQuery = (value: string) => set("q", value), setType = (value: string) => set("type", value), setProject = (value: string) => set("project", value);
  const setStatus = (value: string) => set("status", value), setScope = (value: string) => set("scope", value), setSort = (value: string) => set("sort", value);
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
    {isOfficial && projectId && <><Filter label="Responsable" value={owner} onChange={value => set("owner", value)} options={[...new Map(official.map(row => [row.ownerId, { value: row.ownerId, label: row.owner.name }])).values()]} /><Filter label="Ámbito" value={impacted} onChange={value => set("ambito", value)} options={unique(official.flatMap(row => row.scopes))} /></>}
    <Filter label="Ordenar" value={sort} onChange={setSort} all="" options={[{ value: "review", label: isOfficial ? "Próxima revisión" : "Detección más reciente" }, { value: "exposure", label: "Mayor puntuación" }, { value: "name", label: "Nombre A–Z" }]} />
    {(query || type || project || status || scope || owner || impacted || category || sort !== "review") && <Button variant="ghost" onClick={clear}>Limpiar filtros</Button>}
  </div><section className="table-card">{!visible ? (isOfficial ? official.length : suggestions.length) ? <Empty onClear={clear} /> : <div className="empty"><h3>{isOfficial ? "Sin riesgos registrados" : "Sin sugerencias"}</h3><p>No hay registros en este alcance.</p></div> : isOfficial ? <TableRegion label="Riesgos registrados, todas las columnas"><table className={projectId ? "risks-table project-risks-table" : "risks-table"}><thead><tr>
    {["Riesgo", ...(!projectId ? ["Proyecto / alcance"] : []), "Tipo", "Estado", "Puntuación", "Ámbitos", "Responsable", "Próxima revisión"].map(label => <th scope="col" key={label}>{label}</th>)}
  </tr></thead><tbody>{rows.map(row => <tr key={row.id}><th scope="row"><small>{row.id}</small><Link className="record-link" href={contextualPath(row.projectId ? `/proyectos/${row.projectId}/riesgos/${row.id}` : `/riesgos/${row.id}`, url, true)}>{row.title}</Link><small>{row.category}</small></th>{!projectId && <td>{row.projectName}</td>}<td><Badge tone={row.tone}>{row.type}</Badge></td><td><Badge tone={row.statusTone}>{row.status}</Badge></td>
    <td><ExposureBadge type={row.type} score={row.exposure} /></td><td><div className="scope-badges">{row.scopes.map(scope => <Badge key={scope}>{scope}</Badge>)}</div></td><td>{row.owner.name}</td><td className={row.overdue ? "review-overdue" : ""}>{date(row.reviewDate)}{row.overdue && <small className="review-overdue">Vencida</small>}</td>
  </tr>)}</tbody></table></TableRegion> : <TableRegion label="Sugerencias IA, separadas del registro oficial"><table className="suggestions-table"><thead><tr>{["Sugerencia IA", "Proyecto", "Tipo propuesto", "Estado de propuesta", "Puntuación propuesta", "Detección", "Vínculo oficial"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
    {proposalRows.map(row => <tr key={row.id}><th scope="row"><small>{row.id}</small><Link className="record-link" href={contextualPath(`/proyectos/${row.projectId}/sugerencias/${row.id}`, url, true)}>{row.title}</Link></th><td>{row.projectName}</td><td>{row.type}</td><td><Badge tone={row.statusTone}>{row.statusLabel}</Badge></td><td><ExposureBadge type={row.type} score={row.exposure} proposed /></td><td>{date(row.detectedAt)}</td><td>{row.linkedRiskId ?? "Sin registro oficial"}</td></tr>)}
  </tbody></table></TableRegion>}<TableFooter count={visible} total={isOfficial ? official.length : suggestions.length} noun={isOfficial ? "riesgos registrados" : "sugerencias"} /></section>
    <p className="footnote">{isOfficial ? "Las propuestas de IA se consultan por separado." : "Una sugerencia pendiente no es un riesgo registrado."}</p>
  </>;
  return <div className={projectId ? "project-register" : "page"}><PageHeading level={projectId ? "h2" : "h1"} title={projectId ? "Riesgos del proyecto" : "Riesgos"} description={projectId ? "Consulta los riesgos registrados, sus evaluaciones y el seguimiento de las acciones de respuesta." : "Supervisa la exposición y las revisiones de los riesgos de tus proyectos y del portafolio."}><NewRisk projectId={projectId} /></PageHeading>
    <MetricStrip items={isOfficial ? [{ value: rows.length, label: "Riesgos registrados" }, { value: rows.filter(row => row.overdue).length, label: "Revisiones vencidas", tone: "review" }, projectId ? { value: suggestions.filter(item => !item.pmDecision).length, label: "Sugerencias pendientes" } : { value: rows.filter(row => !row.projectId).length, label: "Riesgos transversales" }] : [{ value: proposalRows.length, label: "Sugerencias de IA" }, { value: proposalRows.filter(row => !row.pmDecision).length, label: "Pendientes de revisión" }]} />
    <Tabs value={tab} onValueChange={value => changeTab(String(value))}><TabsList aria-label="Registro y propuestas"><TabsTrigger value="registered">Riesgos registrados <span className="count">{official.length}</span></TabsTrigger><TabsTrigger value="suggestions"><Sparkles aria-hidden="true" />Sugerencias de IA <span className="count">{suggestions.length}</span></TabsTrigger></TabsList>
      <p className="tab-note">{pendingCount} {pendingCount === 1 ? "sugerencia pendiente · no registrada" : "sugerencias pendientes · no registradas"}</p>
      {["registered", "suggestions"].map(value => <TabsContent key={value} value={value}>{content}</TabsContent>)}
    </Tabs>
    {projectId && isOfficial && attention && <section className="panel context-panel risk-attention"><header className="panel-header"><Badge tone="review">Requiere revisión</Badge><Link href={contextualPath(`/proyectos/${projectId}/riesgos/${attention.id}`, url, true)}>Ver detalle del riesgo →</Link></header><h2>{attention.title}</h2><div className="risk-attention-facts"><span>{attention.owner.name}</span><span className="review-overdue">{date(attention.reviewDate)} · Vencida</span><ExposureBadge type={attention.type} score={attention.exposure} /><span>{attention.strategy}</span></div><p className="muted">La revisión programada está vencida; consulta la evaluación y el plan de respuesta registrados.</p></section>}
  </div>;
}
