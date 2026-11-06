import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from '../app/src/App';
const session = {identifier:'persona@example.test',expiresAt:'2099-01-01T00:00:00Z',role:'PM',permissions:['workspaces.consultar','workspaces.crear']};
const workspace = {id:'12',nombre:'Equipo PMO',slug:'equipo-pmo',version:'1'};
function service(items: typeof workspace[], permission=true, status=201) {
  const calls: string[]=[];
  const fetcher=vi.fn(async (path: string | URL | Request, init?: RequestInit) => {
    const url=String(path); calls.push(url);
    if(url==='/api/v1/sesion') return new Response(JSON.stringify({data:permission?session:{...session,permissions:['workspaces.consultar']}}));
    if(url==='/api/v1/workspaces' && init?.method==='POST') {
      expect(JSON.parse(String(init.body))).toEqual({nombre:'Equipo PMO'});
      if(status!==201)return new Response(JSON.stringify({error:{code:'CONFLICT',message:'Nombre existente',fields:{nombre:'Escoge otro nombre'}}}),{status});
      items.push(workspace);return new Response(JSON.stringify({data:workspace}),{status:201});
    }
    if(url==='/api/v1/workspaces')return new Response(JSON.stringify({data:items}));
    return new Response(JSON.stringify({error:{message:'Legacy no disponible'}}),{status:500});
  });
  vi.stubGlobal('fetch',fetcher); return {calls,fetcher};
}
test('crea con contrato estricto y entra al workspace sin bootstrap legacy',async()=>{
  const {calls,fetcher}=service([]);render(<App/>);
  const input=await screen.findByLabelText('Nombre del workspace', {}, {timeout:5000});
  fireEvent.change(input,{target:{value:'  Equipo PMO  '}});
  fireEvent.click(screen.getByRole('button',{name:'Crear workspace'}));
  expect(await screen.findByRole('heading',{name:'Te damos la bienvenida a Equipo PMO'})).toBeVisible();
  expect(location.pathname).toBe('/workspace/12');
  expect(calls).not.toContain('/api/v1/datos');
  expect(fetcher.mock.calls.filter(([,init])=>init?.method==='POST')).toHaveLength(1);
});
test('cero espacios sin grant no ofrece creación',async()=>{
  service([],false);render(<App/>);await screen.findByText(/No tienes workspaces accesibles/);
  expect(screen.queryByRole('button',{name:'Crear workspace'})).not.toBeInTheDocument();
});
test('selector de varios espacios y home no invocan datos legacy',async()=>{
  const {calls}=service([workspace,{...workspace,id:'13',nombre:'Otro equipo'}]);render(<App/>);
  fireEvent.click(await screen.findByRole('button',{name:/Otro equipo/}));
  await screen.findByRole('heading',{name:'Te damos la bienvenida a Otro equipo'});
  expect(calls).not.toContain('/api/v1/datos');
});
test.each([403,409,422,500])('error %s conserva nombre y expone respuesta',async status=>{
  service([],true,status);render(<App/>);
  fireEvent.change(await screen.findByLabelText('Nombre del workspace'),{target:{value:'Equipo PMO'}});
  fireEvent.click(screen.getByRole('button',{name:'Crear workspace'}));
  await screen.findByText(/Nombre existente/);
  expect(screen.getByLabelText('Nombre del workspace')).toHaveValue('Equipo PMO');
});
test('la ruta retirada no solicita bootstrap y permite volver al flujo nuevo',async()=>{
  service([workspace]);window.history.replaceState(null,'','/legacy/workspace');render(<App/>);
  await screen.findByText('Sección no disponible');
  fireEvent.click(screen.getByText('Volver a workspaces'));
  await waitFor(()=>expect(screen.getByRole('button',{name:/Equipo PMO/})).toBeVisible());
});
test('validación local rechaza whitespace y conserva el contrato de longitud',async()=>{
  const {fetcher}=service([]);render(<App/>);
  fireEvent.change(await screen.findByLabelText('Nombre del workspace'),{target:{value:'   '}});
  fireEvent.click(screen.getByRole('button',{name:'Crear workspace'}));
  await screen.findByText('Ingresa un nombre de 1 a 200 caracteres.');
  expect(fetcher.mock.calls.some(([,init])=>init?.method==='POST')).toBe(false);
});
test('403 del listado no se presenta como lista vacía',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(path:string)=>new Response(JSON.stringify(path==='/api/v1/sesion'?{data:session}:{error:{code:'FORBIDDEN',message:'Sin grant'}}),{status:path==='/api/v1/sesion'?200:403})));
  render(<App/>);await screen.findByText('Acceso denegado. Sin grant');
  expect(screen.queryByLabelText('Nombre del workspace')).not.toBeInTheDocument();
});
test('pérdida de red se informa y permite reintentar',async()=>{
  let offline=true;
  vi.stubGlobal('fetch',vi.fn(async(path:string)=>{
    if(path==='/api/v1/sesion')return new Response(JSON.stringify({data:session}));
    if(offline)throw new TypeError('offline');
    return new Response(JSON.stringify({data:[workspace]}));
  }));
  render(<App/>);await screen.findByText(/No se pudo conectar/);
  offline=false;fireEvent.click(screen.getByRole('button',{name:'Reintentar'}));
  await screen.findByRole('button',{name:/Equipo PMO/});
});
test('401 al crear termina la sesión y vuelve a login sin bootstrap',async()=>{
  const {calls}=service([],true,401);render(<App/>);
  fireEvent.change(await screen.findByLabelText('Nombre del workspace'),{target:{value:'Equipo PMO'}});
  fireEvent.click(screen.getByRole('button',{name:'Crear workspace'}));
  await screen.findByRole('heading',{name:'Inicia sesión'});
  expect(location.pathname).toBe('/login');expect(calls).not.toContain('/api/v1/datos');
});
test('login real por contrato llega al selector sin datos legacy',async()=>{
  let authenticated=false;const calls:string[]=[];
  vi.stubGlobal('fetch',vi.fn(async(path:string,init?:RequestInit)=>{
    calls.push(path);
    if(path==='/api/v1/sesion') {
      if(init?.method==='POST'){expect(JSON.parse(String(init.body))).toEqual({identifier:'persona@example.test',password:'clave-prueba'});authenticated=true;}
      return new Response(JSON.stringify(authenticated?{data:session}:{error:{message:'Sin sesión'}}),{status:authenticated?200:401});
    }
    return new Response(JSON.stringify({data:[workspace]}));
  }));
  render(<App/>);
  fireEvent.change(await screen.findByLabelText('Identificación'),{target:{value:'persona@example.test'}});
  fireEvent.change(screen.getByLabelText('Contraseña'),{target:{value:'clave-prueba'}});
  fireEvent.click(screen.getByRole('button',{name:/Entrar a mi espacio/}));
  await screen.findByRole('button',{name:/Equipo PMO/});expect(calls).not.toContain('/api/v1/datos');
});
test('doble envío solo inicia una creación',async()=>{
  let finish!:()=>void;let posts=0;
  vi.stubGlobal('fetch',vi.fn(async(path:string,init?:RequestInit)=>{
    if(path==='/api/v1/sesion')return new Response(JSON.stringify({data:session}));
    if(init?.method==='POST'){posts++;await new Promise<void>(resolve=>{finish=resolve;});return new Response(JSON.stringify({data:workspace}),{status:201});}
    return new Response(JSON.stringify({data:posts?[workspace]:[]}));
  }));
  render(<App/>);fireEvent.change(await screen.findByLabelText('Nombre del workspace'),{target:{value:'Equipo PMO'}});
  const button=screen.getByRole('button',{name:'Crear workspace'});fireEvent.click(button);fireEvent.click(button);
  expect(posts).toBe(1);expect(button).toBeDisabled();finish();await screen.findByRole('heading',{name:'Te damos la bienvenida a Equipo PMO'});
});
