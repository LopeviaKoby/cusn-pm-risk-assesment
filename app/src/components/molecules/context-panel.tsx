import {useRef, type ReactNode} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Button} from '@/components/atoms/catalog';
export function ContextPanel({title, description, onClose, children, dismissible = true}: {title: string; description: string; onClose: () => void; children: ReactNode; dismissible?: boolean}) {
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  return <Dialog.Root open modal={false} onOpenChange={open => {if (!open && dismissible) onClose();}}><Dialog.Portal><Dialog.Content className="pmo-context-panel" onCloseAutoFocus={event => {event.preventDefault(); if (previousFocus.current?.isConnected) previousFocus.current.focus();}} onEscapeKeyDown={event => {if (!dismissible) event.preventDefault();}} onInteractOutside={event => event.preventDefault()}><header><Dialog.Title>{title}</Dialog.Title><Dialog.Close asChild><Button aria-label="Cerrar panel" disabled={!dismissible}>Cerrar</Button></Dialog.Close></header><Dialog.Description>{description}</Dialog.Description>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
