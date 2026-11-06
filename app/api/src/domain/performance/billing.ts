import {addMoney,money,moneyText,percentOf} from '../shared/money';
export type BillingLine={id:string;periodo:string;unidadCodigo:string|null;tipoHito:string|null;tipoCuota:string|null;showprice:string|null;planificado:string|null;realReportado:string|null;comentario:string|null;origen:string|null;claveRegistro:string|null;version:string};
const sum=(rows:BillingLine[],key:'showprice'|'planificado'|'realReportado')=>rows.some(r=>r[key]===null)?null:moneyText(addMoney(rows.map(r=>money(r[key]!))));
export function billingGroups(rows:BillingLine[],monthly=false){
 const groups=new Map<string,BillingLine[]>();
 for(const row of rows){const key=JSON.stringify([monthly?row.periodo:null,row.unidadCodigo]);groups.set(key,[...(groups.get(key)??[]),row]);}
 return [...groups.values()].map(g=>({...monthly?{periodo:g[0]!.periodo}:{},unidadCodigo:g[0]!.unidadCodigo,showprice:sum(g,'showprice'),planificado:sum(g,'planificado'),realReportado:sum(g,'realReportado')})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
export function billingIndicators(rows:BillingLine[],cutoff:string){
 const due=rows.filter(r=>r.periodo<=cutoff);
 const units=[...new Set(rows.map(r=>r.unidadCodigo))].sort();
 return {corte:cutoff,estado:due.length?'CON_HITOS_EXIGIBLES':'SIN_HITOS_EXIGIBLES',porMoneda:units.map(unidadCodigo=>{
  const selected=due.filter(r=>r.unidadCodigo===unidadCodigo);
  if(!selected.length)return {unidadCodigo,valor:null,estado:'SIN_HITOS_EXIGIBLES'};
  if(unidadCodigo===null||selected.some(r=>r.planificado===null||r.realReportado===null))return {unidadCodigo,valor:null,estado:'DATOS_INCOMPLETOS'};
  const planned=addMoney(selected.map(r=>money(r.planificado!)));
  return {unidadCodigo,valor:planned>0n?percentOf(addMoney(selected.map(r=>money(r.realReportado!))),planned):null,estado:planned>0n?'CALCULADO':'BASE_CERO_PENDIENTE_POLITICA'};
 })};
}