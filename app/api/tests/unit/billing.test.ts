import {describe,test,expect} from 'bun:test';
import {billingGroups,billingIndicators,type BillingLine} from '../../src/domain/performance/billing';
const row:BillingLine={id:'1',periodo:'2026-02',unidadCodigo:'USD',tipoHito:'Proyecto',tipoCuota:'SetUp',showprice:'9007199254740993.1234',planificado:'100.0000',realReportado:'50.0000',comentario:null,origen:'MANUAL',claveRegistro:null,version:'1'};
describe('facturación exacta por moneda y corte',()=>{
 test('ausencia real no crea series ni indicadores',()=>{expect(billingGroups([])).toEqual([]);expect(billingIndicators([],'2026-02')).toEqual({corte:'2026-02',estado:'SIN_HITOS_EXIGIBLES',porMoneda:[]});});
 test('corte inclusivo y sin exigibles',()=>{expect(billingIndicators([row],'2026-01').porMoneda[0]).toEqual({unidadCodigo:'USD',valor:null,estado:'SIN_HITOS_EXIGIBLES'});expect(billingIndicators([row],'2026-02').porMoneda[0]!.valor).toBe('50.0000');});
 test('monedas nunca se suman entre sí ni pierden precisión',()=>{const groups=billingGroups([row,{...row,id:'2',unidadCodigo:'UF'}]);expect(groups.length).toBe(2);expect(groups[0]!.showprice).toBe('9007199254740993.1234');});
 test('cero y desconocido son estados distintos, sin CPI inventado',()=>{expect(billingIndicators([{...row,planificado:'0'}],'2026-02').porMoneda[0]!.estado).toBe('BASE_CERO_PENDIENTE_POLITICA');expect(billingIndicators([{...row,planificado:null}],'2026-02').porMoneda[0]!.estado).toBe('DATOS_INCOMPLETOS');expect(billingGroups([{...row,showprice:null}])[0]!.showprice).toBe(null);});
});