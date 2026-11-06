import {useState} from 'react';
import {Button, TextInput} from '@/components/atoms/catalog';
export function EditableProjectName({name, onSave, onCancel}: {name: string; onSave: (name: string) => Promise<void>; onCancel: () => void}) {
  const [value, setValue] = useState(name), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <form className="pmo-inline-editor" onSubmit={event => {event.preventDefault(); if (busy || error) return; setBusy(true); void onSave(value.trim()).catch(cause => setError(cause instanceof Error ? cause.message : 'No se pudo guardar.')).finally(() => setBusy(false));}}><label>Editar nombre del proyecto<TextInput value={value} required maxLength={200} disabled={busy} onChange={event => setValue(event.target.value)}/></label><Button type="submit" loading={busy} disabled={!value.trim() || !!error}>Guardar</Button><Button disabled={busy} onClick={onCancel}>Cancelar</Button>{error && <><p role="alert">{error} El valor ingresado se conserva; no se sobrescribió el registro.</p><Button onClick={onCancel}>Consultar ficha vigente</Button></>}</form>;
}
