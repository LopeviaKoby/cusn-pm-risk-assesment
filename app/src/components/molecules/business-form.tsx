import { useState,type ReactNode } from 'react';
import { Button } from '../atoms/primitives';
export function BusinessForm({children,submit,close,cancel,dirty,label='Guardar'}:{children:ReactNode;submit:(data:FormData)=>Promise<void>;close:()=>void;cancel:()=>void;dirty:()=>void;label?:string}) {
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  return <form className="context-stack" onChange={dirty} onSubmit={async event=>{event.preventDefault();const data=new FormData(event.currentTarget);setBusy(true);setError('');try{await submit(data);close();}catch(error){setError(error instanceof Error?error.message:'No se pudo guardar.');}finally{setBusy(false);}}}>
    {children}{error&&<p className="form-error" role="alert">{error}</p>}<div className="inline-between"><Button disabled={busy} onClick={cancel}>Cancelar</Button><Button variant="primary" type="submit" disabled={busy}>{busy?'Guardando…':label}</Button></div>
  </form>;
}
