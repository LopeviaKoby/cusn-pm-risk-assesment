import {describe,test,expect} from 'bun:test';
import tree from '../../src/application/drive/tree.json';
import {driveError} from '../../src/infrastructure/drive/google';
describe('Drive: árbol fuente y errores seguros',()=>{
 test('83 nodos, cinco etapas y padres anteriores',()=>{expect(tree.nodes.length).toBe(83);expect(tree.nodes.filter(n=>n.parent==='ROOT').length).toBe(5);const keys=new Set(['ROOT']);for(const n of tree.nodes){expect(keys.has(n.parent)).toBe(true);expect(keys.has(n.key)).toBe(false);keys.add(n.key);}});
 test('erratas del documento permanecen literales',()=>{expect(tree.nodes.some(n=>n.name==='Gestióon de Crisis')).toBe(true);expect(tree.nodes.some(n=>n.name==='Cargda de CMDB')).toBe(true);});
 test('permanentes no reintentan; transitorios sí y no filtran secretos',()=>{const error=(status:number,reason:string)=>({response:{status,data:{error:{errors:[{reason}]}}},message:'secret'});expect(driveError(error(403,'storageQuotaExceeded')).transient).toBe(false);expect(driveError(error(403,'insufficientFilePermissions')).code).toBe('PERMISSION_DENIED');expect(driveError(error(429,'rateLimitExceeded')).transient).toBe(true);expect(driveError(error(503,'backendError')).transient).toBe(true);expect(driveError(error(403,'userRateLimitExceeded')).message).not.toContain('secret');});
});