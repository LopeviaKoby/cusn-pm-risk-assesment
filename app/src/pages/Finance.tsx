import { PageHeading, TableFooter, TableRegion } from "@/components/atoms/primitives";
import { useData } from "@/data/bootstrap";
import { money } from "@/data/format";

export default function Finance() {
  const { data } = useData();
  const rows = data?.facturacion ?? [];
  return <div className="page"><PageHeading title="Facturación" description="Importes registrados por proyecto, período y unidad. Sin dato se distingue de cero." />
    <section className="table-card"><TableRegion label="Facturación registrada"><table className="context-table"><thead><tr><th>Proyecto</th><th>Período</th><th>Tipo</th><th>Showpricing</th><th>Planificado</th><th>Real</th><th>Estado</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.proyectoTvt ?? row.proyectoId}</td><td>{row.periodo}</td><td>{row.tipo ?? "Sin dato"}</td><td>{money(row.showprice,row.unidad)}</td><td>{money(row.planificado,row.unidad)}</td><td>{money(row.real,row.unidad)}</td><td>{row.estado ?? "Sin dato"}</td></tr>)}</tbody></table></TableRegion><TableFooter count={rows.length} total={rows.length} noun="hitos" /></section>
  </div>;
}
