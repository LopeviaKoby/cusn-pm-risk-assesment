export function registrationFixture(method:string,path:string,body:unknown):unknown {
 if(method!=='POST'||!body||typeof body!=='object')return body;
 if(path==='clientes')return {estadoCliente:'NUEVO',...body};
 if(path==='proyectos')return {fechaInicio:'2026-01-01',fechaTerminoBaseline:'2026-12-31',condicionComercial:{tcvTipo:'ILIMITADO',tcvValor:null,unidadCodigo:null},...body};
 return body;
}
