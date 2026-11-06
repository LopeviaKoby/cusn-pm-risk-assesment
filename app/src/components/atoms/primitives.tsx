import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { Search } from "lucide-react";
import { riskPresentation } from "@/data/presentation";

// Canonical product button. Existing consumers keep their default and class contract.
export function Button({ variant = "secondary", size = "md", loading = false, className = "", type = "button", disabled, children, ...props }: Omit<ComponentProps<"button">, "size"> & { variant?: "secondary" | "primary" | "ghost" | "destructive"; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  return <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={`button button-${variant} button-${size} ${className}`}>{loading && <span className="atom-spinner atom-spinner-sm" aria-hidden="true" />}{children}</button>;
}
export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;
export function TabsList(props: ComponentProps<typeof RadixTabs.List>) {
  return <RadixTabs.List {...props} className="tabs-list" />;
}
export function TabsTrigger(props: ComponentProps<typeof RadixTabs.Trigger>) {
  return <RadixTabs.Trigger {...props} className="tabs-trigger" />;
}
type BadgeTone = "neutral" | "info" | "danger" | "positive" | "review";
export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}
export function ExposureBadge({ type, score, proposed = false }: { type: string; score: number | null; proposed?: boolean }) {
  if (score === null) return <span className="exposure" title="Sin evaluación">Sin evaluación</span>;
  const presentation = riskPresentation(type, score);
  const description = `${presentation.description}${proposed ? ", puntuación propuesta" : ""}`;
  return <span className="exposure" data-band={presentation.band} title={description}><span aria-hidden="true">{score}</span><span className="sr-only">{description}</span></span>;
}
export function SearchField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">{label}</span><input type="search" placeholder={label} value={value} onChange={event => onChange(event.target.value)} /></label>;
}
export function Filter({ label, value, onChange, options, all = "Todos" }: {
  label: string; value: string; onChange: (value: string) => void;
  options: (string | { value: string; label: string })[]; all?: string;
}) {
  return <label className="filter"><span>{label}:</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
    {all && <option value="">{all}</option>}
    {options.map(option => { const item = typeof option === "string" ? { value: option, label: option } : option; return <option key={item.value} value={item.value}>{item.label}</option>; })}
  </select></label>;
}
export function Empty({ onClear }: { onClear: () => void }) {
  return <div className="empty"><h3>Sin resultados</h3><p>Prueba otra búsqueda o limpia los filtros.</p><Button onClick={onClear}>Limpiar filtros</Button></div>;
}
export function TableRegion({ label, children, overflowHint = "Desplázate horizontalmente para consultar todas las columnas." }: { label: string; children: ReactNode; overflowHint?: string }) {
  const region = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const element = region.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setOverflow(element.scrollWidth > element.clientWidth));
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, []);
  return <><div ref={region} className="table-region" role="region" aria-label={label} tabIndex={0}>{children}</div>{overflow && <p className="scroll-hint">{overflowHint}</p>}</>;
}
export function TableFooter({ count, total, noun }: { count: number; total: number; noun: string }) {
  return <div className="table-footer" role="status">Mostrando {count} de {total} {noun}<span>Todos los resultados</span></div>;
}
export function MetricStrip({ items }: { items: { value: number; label: string; tone?: "review" | "progress" }[] }) {
  return <div className="metric-strip">{items.map(item => <div key={item.label} data-tone={item.tone}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div>;
}
export function PageHeading({ title, description, children, level = "h1" }: { title: string; description: string; children?: ReactNode; level?: "h1" | "h2" }) {
  const Heading = level;
  return <header className="page-heading"><div><Heading>{title}</Heading><p>{description}</p></div>{children}</header>;
}
