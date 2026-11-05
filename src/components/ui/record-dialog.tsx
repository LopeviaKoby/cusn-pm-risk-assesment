import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./primitives";

export function RecordDialog({ title, trigger, triggerNode, children }: { title: string; trigger?: string; triggerNode?: ReactNode; children: (controls: { close: () => void; cancel: () => void; dirty: () => void }) => ReactNode }) {
  const [open, setOpen] = useState(false), [dirty, setDirty] = useState(false), [confirm, setConfirm] = useState(false);
  const confirmation = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); setDirty(false); setConfirm(false); };
  const cancel = () => { if (dirty) setConfirm(true); else close(); };
  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty]);
  useEffect(() => { if (confirm) confirmation.current?.focus(); }, [confirm]);
  return <Dialog.Root open={open} onOpenChange={next => { if (next) setOpen(true); else if (dirty) setConfirm(true); else close(); }}><Dialog.Trigger asChild>{triggerNode ?? <Button variant="primary">{trigger}</Button>}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="record-backdrop" /><Dialog.Content className="record-dialog">
    <header className="record-dialog-header"><Dialog.Title>{title}</Dialog.Title><Dialog.Close asChild><Button variant="ghost" aria-label="Cerrar formulario"><X /></Button></Dialog.Close></header>
    <Dialog.Description className="sr-only">Completa los campos obligatorios para guardar el registro.</Dialog.Description>
    {confirm && <div className="discard-confirmation" role="alert" tabIndex={-1} ref={confirmation}><strong>Hay cambios sin guardar.</strong><p>¿Quieres descartarlos y cerrar el formulario?</p><div><Button onClick={() => setConfirm(false)}>Continuar editando</Button><Button onClick={close}>Descartar cambios</Button></div></div>}
    {open && children({ close, cancel, dirty: () => setDirty(true) })}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
