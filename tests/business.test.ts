import { describe,it,expect } from 'vitest';
import { closureIssues,savingsText,decimalText } from '../app/src/data/business';
describe('contratos de presentación de negocio',()=>{
  it('cierre ignora riesgos transversales y enumera faltantes',()=>{
    expect(closureIssues({id:'1',items:[{completed:true,requiresDocument:false,hasCurrentDocument:false}],lessonCount:1,risks:[{projectId:null,state:'Contingencia'}]})).toEqual([]);
    expect(closureIssues({id:'1',items:[],lessonCount:0,risks:[{projectId:'1',state:'Pendiente'}]})).toHaveLength(3);
  });
  it('adjudicación cero conserva el presupuesto completo y cuatro decimales',()=>{
    expect(savingsText('123.4567','0')).toBe('123.4567');
    expect(savingsText('123.4567','')).toBeNull();
    expect(decimalText('123.4567')).toBe('123,4567');
  });
});
