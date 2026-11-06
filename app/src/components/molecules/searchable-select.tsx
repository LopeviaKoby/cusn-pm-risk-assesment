import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from 'react';
import { LuCheck, LuChevronDown, LuSearch } from 'react-icons/lu';
import { Button, Icon, Spinner, TextInput } from '@/components/atoms/catalog';

export interface SearchOption { value: string; label: string; detail?: string }
type Status = 'idle' | 'loading' | 'ready' | 'error' | 'disabled';
interface Props {
  id: string; label: string; value: string; options: readonly SearchOption[]; onChange: (value: string) => void;
  status?: Status; disabled?: boolean; required?: boolean; message?: string; error?: string;
  placeholder?: string; searchLabel?: string; emptyMessage?: string; complete?: boolean;
  filterMode?: 'local' | 'remote'; onQueryChange?: (query: string) => void; onRetry?: () => void;
  triggerRef?: Ref<HTMLButtonElement>;
  renderEmptyAction?: (context: { query: string; close: () => void }) => ReactNode;
}
const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

// Searchable disclosure: native buttons/input retain Tab, Enter and Space.
// It does not claim ARIA listbox/combobox semantics or invent arrow navigation.
export function SearchableSelect({ id, label, value, options, onChange, status = 'ready', disabled = false, required = false, message, error, placeholder = 'Selecciona una opción', searchLabel = 'Buscar…', emptyMessage = 'No hay coincidencias', complete = true, filterMode = 'local', onQueryChange, onRetry, triggerRef, renderEmptyAction }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const lastSelection = useRef<SearchOption | undefined>(undefined);
  const panelId = useId();
  const blocked = disabled || status === 'disabled';
  const selected = options.find(option => option.value === value) ?? (lastSelection.current?.value === value ? lastSelection.current : undefined);
  const filtered = filterMode === 'remote' ? options : options.filter(option => normalize(`${option.label} ${option.detail ?? ''}`).includes(normalize(query)));
  const state = blocked ? 'disabled' : status === 'ready' ? filtered.length ? 'results' : 'empty' : status;
  useEffect(() => {
    if (selected) lastSelection.current = selected;
  }, [selected]);
  useEffect(() => {
    if (!open || blocked) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, blocked]);
  return <div className="catalog-field" data-state={state} ref={root}>
    <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
    <Button id={id} ref={node => { trigger.current = node; if (typeof triggerRef === 'function') triggerRef(node); else if (triggerRef) triggerRef.current = node; }} className="catalog-trigger" disabled={blocked} aria-expanded={open && !blocked} aria-controls={open && !blocked ? panelId : undefined} aria-invalid={!!error} aria-describedby={message || error ? `${id}-feedback` : undefined} onClick={() => setOpen(previous => !previous)}>
      <span>{selected?.label ?? placeholder}</span><Icon glyph={LuChevronDown} size="sm" />
    </Button>
    {(message || error) && <p id={`${id}-feedback`} className={error ? 'form-error' : 'pmo-help'} role={error ? 'alert' : undefined}>{error || message}</p>}
    {open && !blocked && <div className="catalog-panel" id={panelId} role="group" aria-label={`Opciones de ${label}`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } }}>
      <div className="catalog-search"><Icon glyph={LuSearch} size="sm" /><TextInput ref={search} maxLength={filterMode === 'remote' ? 120 : undefined} aria-label={searchLabel} placeholder={searchLabel} value={query} onChange={event => { setQuery(event.target.value); onQueryChange?.(event.target.value); }} /></div>
      {status === 'loading' ? <p role="status" className="catalog-feedback"><Spinner size="sm" /> Cargando opciones…</p> : status === 'idle' ? <p role="status" className="catalog-feedback">Escribe para consultar las opciones.</p> : status === 'error' ? <div className="catalog-feedback" role="alert"><p>{message ?? 'No pudimos consultar las opciones. Inténtalo otra vez.'}</p>{onRetry && <Button onClick={onRetry}>Reintentar</Button>}</div> : <>
        {filtered.length ? <ul className="catalog-options">{filtered.map(option => <li key={option.value}><Button variant="ghost" aria-pressed={value === option.value} onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }}><span>{option.label}{option.detail && <small>{option.detail}</small>}</span>{value === option.value && <Icon glyph={LuCheck} size="sm" />}</Button></li>)}</ul> : <div className="catalog-feedback"><p role="status">{complete ? emptyMessage : 'No hay coincidencias en los resultados recibidos.'}</p>{complete && renderEmptyAction?.({ query, close: () => setOpen(false) })}</div>}
        {!complete && <p className="catalog-feedback pmo-help">Mostrando resultados parciales. Puede haber más registros.</p>}
      </>}
    </div>}
  </div>;
}
