import { useRef, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LuX } from 'react-icons/lu';
import { Button, Icon, TextInput } from '@/components/atoms/catalog';
import { ApiError } from '@/data/client';
import type { ClientCreateInput, ClientRecord } from '@/data/project-catalogs';

interface Props {
  initialName: string; create?: (input: ClientCreateInput) => Promise<ClientRecord>;
  onCreated: (client: ClientRecord) => void; onCancel: () => void; onRestoreFocus?: () => void;
  onRefresh?: () => void | Promise<void>; onAuthorizationError?: (status: number) => void;
}
export function CreateClientDialog({ initialName, create, onCreated, onCancel, onRestoreFocus, onRefresh, onAuthorizationError }: Props) {
  const [nombre, setNombre] = useState(initialName);
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending.current) return;
    const clean = nombre.trim();
    if (!clean) { setFieldError('Ingresa el nombre del cliente.'); return; }
    if (!create) { setError('No pudimos guardar el cliente. Inténtalo más tarde.'); return; }
    pending.current = true; setBusy(true); setError(''); setConflict(false); setFieldError('');
    try {
      const result = await create({ nombre: clean });
      if (!result || typeof result.id !== 'string' || !/^[1-9][0-9]{0,18}$/.test(result.id) || BigInt(result.id) > 9223372036854775807n || typeof result.nombre !== 'string' || !result.nombre.trim()) { setError('No pudimos confirmar el registro del cliente. Inténtalo más tarde.'); return; }
      onCreated(result);
    } catch (cause) {
      if (cause instanceof ApiError) {
        const prefix: Record<number, string> = { 401: 'Tu sesión venció. ', 403: 'No tienes permiso para guardar este cliente. ', 409: 'No se pudo registrar por un conflicto. ', 422: 'Revisa los datos del cliente. ' };
        setError((prefix[cause.status] ?? (cause.status >= 500 ? 'El servicio no está disponible. ' : 'No se pudo guardar el cliente. ')) + cause.message);
        setFieldError(cause.fields?.nombre ?? ''); setConflict(cause.status === 409);
        if ([401, 403].includes(cause.status)) onAuthorizationError?.(cause.status);
      } else setError('Se perdió la conexión. Comprueba si el cliente ya existe antes de volver a guardarlo.');
    } finally { pending.current = false; setBusy(false); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open && !pending.current) onCancel(); }}><Dialog.Portal><Dialog.Overlay className="record-backdrop client-dialog-overlay" /><Dialog.Content className="record-dialog client-dialog" onOpenAutoFocus={event => { event.preventDefault(); nameInput.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); onRestoreFocus?.(); }} onEscapeKeyDown={event => { if (pending.current) event.preventDefault(); }} onInteractOutside={event => { if (pending.current) event.preventDefault(); }}>
    <header className="record-dialog-header"><Dialog.Title>Agregar cliente</Dialog.Title><Button variant="ghost" disabled={busy} aria-label="Cerrar alta de cliente" onClick={onCancel}><Icon glyph={LuX} /></Button></header>
    <Dialog.Description className="client-dialog-description">Registra un cliente y continúa con el proyecto.</Dialog.Description>
    <form onSubmit={event => { void submit(event); }} noValidate><div className="record-dialog-body"><label htmlFor="client-name">Nombre del cliente *</label><TextInput ref={nameInput} id="client-name" name="nombre" required disabled={busy} value={nombre} onChange={event => { setNombre(event.target.value); setFieldError(''); }} error={!!fieldError} aria-describedby={fieldError ? 'client-name-error' : undefined} />{fieldError && <p id="client-name-error" role="alert" className="form-error">{fieldError}</p>}{error && <p role="alert" className="form-error">{error}</p>}{conflict && onRefresh && <Button onClick={() => { void Promise.resolve().then(onRefresh).catch(() => setError('No pudimos actualizar los clientes. Inténtalo más tarde.')); }}>Actualizar clientes para buscar el registro existente</Button>}</div><footer className="record-dialog-footer"><Button disabled={busy} onClick={onCancel}>Cancelar</Button><Button type="submit" variant="primary" loading={busy}>Guardar cliente</Button></footer></form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
