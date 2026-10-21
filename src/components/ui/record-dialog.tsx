import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "./primitives";

export function RecordDialog({ title, trigger, children }: { title: string; trigger: string; children: (controls: { close: () => void; cancel: () => void; dirty: () => void }) => ReactNode }) {
  const [open, setOpen] = useState(false), [dirty, setDirty] = useState(false), [confirm, setConfirm] = useState(false);
  const triggerRef = useRef<HTMLElement>(null), confirmation = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); setDirty(false); setConfirm(false); };
  const cancel = () => { if (dirty) setConfirm(true); else close(); };
  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty]);
  useEffect(() => { if (confirm) confirmation.current?.focus(); }, [confirm]);
  return <><Button ref={triggerRef} variant="primary" onClick={() => setOpen(true)}>{trigger}</Button><Dialog.Root open={open} onOpenChange={(next, details) => { if (!next && dirty) { details.cancel(); setConfirm(true); } else if (!next) close(); }}><Dialog.Portal><Dialog.Backdrop className="record-backdrop" /><Dialog.Popup className="record-dialog" finalFocus={triggerRef}>
    <header className="record-dialog-header"><Dialog.Title>{title}</Dialog.Title><Dialog.Close render={<Button variant="ghost" aria-label="Cerrar formulario" />}><X /></Dialog.Close></header>
    <Dialog.Description className="sr-only">Completa los campos obligatorios para guardar el registro.</Dialog.Description>
    {confirm && <div className="discard-confirmation" role="alert" tabIndex={-1} ref={confirmation}><strong>Hay cambios sin guardar.</strong><p>¿Quieres descartarlos y cerrar el formulario?</p><div><Button onClick={() => setConfirm(false)}>Continuar editando</Button><Button onClick={close}>Descartar cambios</Button></div></div>}
    {open && children({ close, cancel, dirty: () => setDirty(true) })}
  </Dialog.Popup></Dialog.Portal></Dialog.Root></>;
}
