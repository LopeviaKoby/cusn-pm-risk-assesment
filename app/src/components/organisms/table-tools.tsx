import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil } from "lucide-react";
import { RecordDialog } from "./record-dialog";

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection } | null;
export type EditPatch = Record<string, string | number | null>;

export function useTableSort<T>(rows: T[], sorters: Record<string, (row: T) => string | number | null>, initialKey: string | null = null) {
  const [sort, setSort] = useState<SortState>(initialKey ? { key: initialKey, direction: "asc" } : null);
  const toggle = (key: string) => {
    if (!sorters[key]) return;
    setSort(current => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      return current.direction === "asc" ? { key, direction: "desc" } : null;
    });
  };
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const sorter = sorters[sort.key];
    if (!sorter) return rows;
    return [...rows].sort((left, right) => {
      const a = sorter(left), b = sorter(right);
      if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
      if (b === null || b === undefined) return -1;
      const result = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "es", { numeric: true });
      return sort.direction === "asc" ? result : -result;
    });
  }, [rows, sort, sorters]);
  return { rows: sorted, sort, toggle };
}

export function SortHeader({ label, column, sort, onToggle, className = "" }: { label: string; column: string; sort: SortState; onToggle: (key: string) => void; className?: string }) {
  const active = sort?.key === column;
  const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : "none";
  return <th scope="col" aria-sort={ariaSort} className={className}><button type="button" className={`sort-trigger${active ? " is-active" : ""}`} onClick={() => onToggle(column)} aria-label={`Ordenar por ${label}${active ? `, ${sort.direction === "asc" ? "ascendente" : "descendente"}` : ""}`}>{label}{active ? (sort.direction === "asc" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />) : <ArrowUpDown aria-hidden="true" />}</button></th>;
}

export function RowActionsHeader() {
  return <th scope="col" className="row-actions-head"><span className="sr-only">Acciones</span></th>;
}

export function RowActions({ children }: { children: ReactNode }) {
  return <td className="row-actions">{children}</td>;
}

export type EditField<T> = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
  value: (row: T) => string | number | null;
  parse?: (raw: string) => string | number | null;
  min?: number;
  max?: number;
  required?: boolean;
};

export function RowEdit<T extends { id: string }>({ row, label, record, fields, onSave }: { row: T; label: string; record?: string; fields: EditField<T>[]; onSave: (id: string, patch: EditPatch) => void | Promise<void> }) {
  const name = record ?? label;
  return <RecordDialog title={`Editar ${label}`} triggerNode={<button type="button" className="row-edit" aria-label={`Editar ${name}`} title={`Editar ${name}`}><Pencil aria-hidden="true" /></button>}>
    {({ close, cancel, dirty }) => <EditForm row={row} fields={fields} onSave={async patch => { await onSave(row.id, patch); close(); }} onCancel={cancel} dirty={dirty} />}
  </RecordDialog>;
}

function EditForm<T extends { id: string }>({ row, fields, onSave, onCancel, dirty }: { row: T; fields: EditField<T>[]; onSave: (patch: EditPatch) => void | Promise<void>; onCancel: () => void; dirty: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(field => [field.key, String(field.value(row) ?? "")])));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: string) => { setValues(current => ({ ...current, [key]: value })); setError(""); dirty(); };
  return <form className="manual-form" onSubmit={async event => {
    event.preventDefault();
    if (saving) return;
    const patch: EditPatch = {};
    for (const field of fields) {
      const raw = values[field.key]?.trim() ?? "";
      const original = field.value(row);
      if (raw === (original === null || original === undefined ? "" : String(original).trim())) continue;
      patch[field.key] = field.parse ? field.parse(raw) : field.type === "number" ? (raw === "" ? null : Number(raw)) : raw;
    }
    setSaving(true);
    try {
      await onSave(patch);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  }}>
    <div className="record-dialog-body"><fieldset><legend>{fields.length === 1 ? `Editar ${fields[0]!.label.toLocaleLowerCase("es")}` : "Datos del registro"}</legend><div className="field-grid">{fields.map(field => <label className="field" key={field.key}>{field.label}{field.type === "select" ? <select value={values[field.key] ?? ""} required={field.required} onChange={event => update(field.key, event.target.value)}>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "date" ? <input type="date" value={values[field.key] ?? ""} required={field.required} onChange={event => update(field.key, event.target.value)} /> : <input type={field.type === "number" ? "number" : "text"} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined} value={values[field.key] ?? ""} required={field.required} onChange={event => update(field.key, event.target.value)} />}</label>)}</div></fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
    <footer className="record-dialog-footer"><button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button></footer>
  </form>;
}
