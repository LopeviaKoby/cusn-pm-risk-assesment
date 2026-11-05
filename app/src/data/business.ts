export function closureIssues(value:{items:{completed:boolean;requiresDocument:boolean;hasCurrentDocument:boolean}[];lessonCount:number;risks:{projectId:string|null;state:string}[];id:string}) {
  const issues:string[]=[];
  if(!value.lessonCount)issues.push('Registra al menos una lección aprendida con título y contenido.');
  if(!value.items.length)issues.push('Define el checklist de entregables.');
  const incomplete=value.items.filter(i=>!i.completed).length;
  if(incomplete)issues.push(`Completa ${incomplete} entregables pendientes del checklist.`);
  const missing=value.items.filter(i=>i.requiresDocument&&!i.hasCurrentDocument).length;
  if(missing)issues.push(`Vincula evidencia vigente a ${missing} entregables.`);
  const open=value.risks.filter(r=>r.projectId===value.id&&['Pendiente','Contingencia'].includes(r.state)).length;
  if(open)issues.push(`Resuelve ${open} riesgos Pendiente/Contingencia del proyecto.`);
  return issues;
}
export function decimalText(value:string|null) {
  if(value===null)return 'Sin dato';
  const [whole,fraction='']=value.split('.');
  return `${whole!.replace(/\B(?=(\d{3})+(?!\d))/g,'.')},${fraction.padEnd(4,'0')}`;
}
export function savingsText(budget:string,awarded:string):string|null {
  const scaled=(value:string)=>{if(!/^\d{1,16}(?:\.\d{1,4})?$/.test(value))return null;const [w='0',f='']=value.split('.');return BigInt(w)*10000n+BigInt(f.padEnd(4,'0'));};
  const b=scaled(budget),a=scaled(awarded);if(b===null||a===null)return null;
  const delta=b-a,abs=delta<0n?-delta:delta;
  return `${delta<0n?'-':''}${abs/10000n}.${String(abs%10000n).padStart(4,'0')}`;
}
