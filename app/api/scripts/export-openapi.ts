import {readFileSync,writeFileSync} from 'node:fs';
import {app} from '../src/index';
const response=await app.request('/api/v1/openapi.json');
if(response.status!==200)throw new Error('OpenAPI no disponible.');
const content=JSON.stringify(await response.json(),null,2)+'\n';
const target='specs/openapi-v210.json';
if(process.argv.includes('--check')){
  if(readFileSync(target,'utf8')!==content)throw new Error('OpenAPI versionado divergente de Zod/handlers.');
  console.log('PASS OpenAPI versionado coincide con Zod y rutas efectivas.');
}else{writeFileSync(target,content);console.log('OpenAPI exportado desde las rutas y esquemas efectivos.');}
