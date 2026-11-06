import {registrationFixture} from './registration-fixture';
import { strict as assert } from 'node:assert';
import { SQL } from 'bun';

if (Bun.env.NODE_ENV !== 'test' || !Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_')) throw new Error('Solo BD aislada.');
const fixture = new SQL({ url: Bun.env.TEST_DATABASE_URL, max: 1 });
const password = Bun.env.TEST_PASSWORD!;
const hash = await Bun.password.hash(password, { algorithm: 'argon2id' });
const mark = crypto.randomUUID();
let serial = 0;
async function actor(role: string, kind = 'INTERNO') {
  const email = `clients-${++serial}-${mark}@example.invalid`;
  const [u] = await fixture<{ id: string }>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash,tipo_usuario)
    VALUES (${email},'Actor de prueba',${hash},${kind}) RETURNING id::text`;
  if (role) await fixture`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
    SELECT ${u!.id},id,${['ADMIN','PM'].includes(role) ? 'GLOBAL' : 'ASIGNADOS'} FROM pmo_cusn.rol WHERE codigo=${role}`;
  return { id: u!.id, email, cookie: '' };
}
const head = await actor('ADMIN'), pm = await actor('PM'), specialist = await actor('ESPECIALISTA'),
  viewer = await actor('VISUALIZADOR'), external = await actor('VISUALIZADOR', 'EXTERNO'),
  inactive = await actor('PM'), noRole = await actor('');
const { handleRequest } = await import('../src/index');
const { sql, closeDatabase } = await import('../src/db');
const send = (method: string, path: string, cookie?: string, body?: unknown) => handleRequest(new Request(`http://127.0.0.1:43001/api/v1/${path}`, {
  method, headers: { origin: 'http://127.0.0.1:4173', ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
  body: body === undefined ? undefined : JSON.stringify(registrationFixture(method,path,body)),
}));
type Client = { id: string; nombre: string; sector: string | null };
type Page = { items: Client[]; paginacion: { limit: number; total: number; hasMore: boolean; nextCursor: string | null } };
async function data<T>(r: Response, status = 200): Promise<T> {
  const json = await r.json(); assert.equal(r.status, status, JSON.stringify(json));
  assert.ok(!/password_hash|token_hash|estado_cliente|contactos/.test(JSON.stringify(json)), 'Sin campos internos ni contactos');
  return json.data as T;
}
const search = (q: string, suffix = '') => send('GET', `clientes?q=${encodeURIComponent(q)}${suffix}`, pm.cookie);
try {
  for (const user of [head, pm, specialist, viewer, external, inactive]) {
    const r = await send('POST', 'sesion', undefined, { identifier: user.email, password }); await data(r);
    user.cookie = r.headers.getSetCookie().find(c => c.startsWith('pmo_access='))!.split(';')[0]!;
  }
  await fixture`UPDATE pmo_cusn.usuario SET activo=false WHERE id=${inactive.id}`;
  assert.equal((await send('POST', 'sesion', undefined, { identifier: noRole.email, password })).status, 401);
  for (const method of ['GET', 'POST']) assert.equal((await send(method, 'clientes', undefined, method === 'POST' ? { nombre: 'Sin sesión' } : undefined)).status, 401);
  for (const user of [specialist, viewer, external, inactive]) {
    const expected = user === inactive ? 401 : 403;
    assert.equal((await send('GET', 'clientes', user.cookie)).status, expected);
    assert.equal((await send('POST', 'clientes', user.cookie, { nombre: 'No autorizado' })).status, expected);
  }
  const [permission] = await fixture<{ id: string }>`SELECT id::text FROM pmo_cusn.permiso WHERE codigo='clientes.crear' AND NOT delegable`;
  assert.ok(permission);
  await fixture`DELETE FROM pmo_cusn.rol_permiso WHERE permiso_id=${permission.id} AND rol_id=(SELECT id FROM pmo_cusn.rol WHERE codigo='PM')`;
  try { assert.equal((await send('POST', 'clientes', pm.cookie, { nombre: 'PM sin permiso independiente' })).status, 403); }
  finally { await fixture`INSERT INTO pmo_cusn.rol_permiso(rol_id,permiso_id) SELECT id,${permission.id} FROM pmo_cusn.rol WHERE codigo='PM'`; }
  const [projectPermission] = await fixture<{ id: string }>`SELECT id::text FROM pmo_cusn.permiso WHERE codigo='proyectos.crear'`;
  await fixture`DELETE FROM pmo_cusn.rol_permiso WHERE permiso_id=${projectPermission!.id} AND rol_id=(SELECT id FROM pmo_cusn.rol WHERE codigo='PM')`;
  try { await data(await send('POST', 'clientes', pm.cookie, { nombre: `Alta independiente ${mark}` }), 201); }
  finally { await fixture`INSERT INTO pmo_cusn.rol_permiso(rol_id,permiso_id) SELECT id,${projectPermission!.id} FROM pmo_cusn.rol WHERE codigo='PM'`; }
  const sharedName = `Cliente vertical ${mark}`;
  const created = await data<Client>(await send('POST', 'clientes', pm.cookie, { nombre: `  ${sharedName}  ` }), 201);
  const repeated = await data<Client>(await send('POST', 'clientes', head.cookie, { nombre: sharedName }), 201);
  assert.equal(created.nombre, sharedName); assert.equal(created.sector, null);
  assert.notEqual(created.id, repeated.id); assert.equal(typeof created.id, 'string');
  assert.deepEqual(Object.keys(created).sort(), ['estadoCliente', 'id', 'nombre', 'sector']);
  for (const body of [{ nombre: '' }, { nombre: '   ' }, { nombre: null }, { nombre: 7 }, { nombre: 'x'.repeat(201) }, { nombre: 'Valido', sector: 'No permitido' }, { nombre: 'Valido', activo: false }, { nombre: 'Valido', id: '1' }]) {
    assert.equal((await send('POST', 'clientes', pm.cookie, body)).status, 422);
  }
  assert.equal((await handleRequest(new Request('http://127.0.0.1/api/v1/clientes', { method: 'POST', headers: { cookie: pm.cookie, 'content-type': 'application/json' }, body: JSON.stringify({ nombre: 'Sin Origin' }) }))).status, 403);
  const found = await data<Page>(await search(`VERTICAL ${mark}`));
  assert.deepEqual(found.items.map(c => c.id), [created.id, repeated.id]);
  assert.equal((await data<Page>(await search(`No existe ${mark}`))).items.length, 0);
  const special = `Literal ${mark} 100%_\\ O'Reilly`;
  const literal = await data<Client>(await send('POST', 'clientes', pm.cookie, { nombre: special }), 201);
  await data(await send('POST', 'clientes', pm.cookie, { nombre: `Literal ${mark} 100XY O'Reilly` }), 201);
  assert.deepEqual((await data<Page>(await search(`${mark} 100%_\\`))).items.map(c => c.id), [literal.id]);
  assert.deepEqual((await data<Page>(await search("' OR true --"))).items, []);
  const expected: string[] = [];
  for (let n = 0; n < 7; n++) expected.push((await data<Client>(await send('POST', 'clientes', pm.cookie, { nombre: `Página ${mark}` }), 201)).id);
  await fixture`INSERT INTO pmo_cusn.cliente(estado_cliente,nombre,activo) VALUES ('ANTIGUO',${`Página ${mark}`},false)`;
  const seen: string[] = []; let cursor: string | null = null;
  do {
    const page: Page = await data<Page>(await search(`Página ${mark}`, `&limit=2${cursor ? `&after=${cursor}` : ''}`));
    assert.equal(page.paginacion.total, 7); assert.ok(page.items.length <= 2);
    seen.push(...page.items.map(c => c.id)); cursor = page.paginacion.nextCursor;
    assert.equal(page.paginacion.hasMore, cursor !== null);
  } while (cursor);
  assert.deepEqual(seen, expected); assert.equal(new Set(seen).size, 7);
  const largeIds = [String(900000000000000000n + BigInt(Date.now())), String(1000000000000000000n + BigInt(Date.now()))];
  for (const value of largeIds) await fixture`INSERT INTO pmo_cusn.cliente(estado_cliente,id,nombre) OVERRIDING SYSTEM VALUE VALUES ('ANTIGUO',${value},${`Orden numérico ${mark}`})`;
  const numericFirst = await data<Page>(await search(`Orden numérico ${mark}`, '&limit=1'));
  assert.equal(numericFirst.items[0]?.id, largeIds[0]);
  const numericSecond = await data<Page>(await search(`Orden numérico ${mark}`, `&limit=1&after=${numericFirst.paginacion.nextCursor}`));
  assert.equal(numericSecond.items[0]?.id, largeIds[1]); assert.equal(numericSecond.paginacion.hasMore, false);
  const big = String(9007199254740995n + BigInt(Date.now()));
  await fixture`INSERT INTO pmo_cusn.cliente(estado_cliente,id,nombre,sector) OVERRIDING SYSTEM VALUE VALUES ('ANTIGUO',${big},${`Big ${mark}`},'Prueba')`;
  assert.equal((await data<Page>(await search(`Big ${mark}`))).items[0]?.id, big);
  const first = await data<Page>(await send('GET', 'clientes', pm.cookie)); assert.equal(first.paginacion.limit, 50); assert.ok(first.items.length <= 50);
  for (const query of ['limit=0', 'limit=101', 'after=9223372036854775808', 'q=', 'q=%20', 'offset=2']) {
    assert.equal((await send('GET', `clientes?${query}`, pm.cookie)).status, 422);
  }
  console.log('PASS clientes: autorización, permiso independiente, alta ADMIN/PM, duplicados, validación, búsqueda literal/case-insensitive, paginación y BIGINT.');

  await fixture`INSERT INTO pmo_cusn.pais(codigo,nombre) SELECT 'Q'||lpad(to_hex(n),2,'0'),'País de prueba '||n FROM generate_series(1,110) n ON CONFLICT(codigo) DO NOTHING`;
  await fixture`INSERT INTO pmo_cusn.lob(nombre) SELECT ${`LOB recursos ${mark} `}||n FROM generate_series(1,105) n`;
  const [inactiveCountry] = await fixture<{ id: string }>`INSERT INTO pmo_cusn.pais(codigo,nombre,activo)
    SELECT 'I'||lpad(to_hex(n),2,'0'),'País inactivo',false FROM generate_series(0,255) n
    WHERE NOT EXISTS(SELECT 1 FROM pmo_cusn.pais WHERE codigo='I'||lpad(to_hex(n),2,'0')) ORDER BY n LIMIT 1 RETURNING id::text`;
  const [inactiveLob] = await fixture<{ id: string }>`INSERT INTO pmo_cusn.lob(nombre,activo) VALUES (${`LOB inactiva ${mark}`},false) RETURNING id::text`;
  const paises = await data<Array<{ id: string; codigo: string; nombre: string }>>(await send('GET', 'paises', pm.cookie));
  const lobs = await data<Array<{ id: string; nombre: string }>>(await send('GET', 'lobs', pm.cookie));
  const allCountries = await fixture<{ id: string }>`SELECT id::text FROM pmo_cusn.pais WHERE activo ORDER BY nombre,id`;
  const allLobs = await fixture<{ id: string }>`SELECT id::text FROM pmo_cusn.lob WHERE activo ORDER BY nombre,id`;
  assert.deepEqual(paises.map(p => p.id), allCountries.map(p => p.id)); assert.ok(paises.length > 100);
  assert.deepEqual(lobs.map(l => l.id), allLobs.map(l => l.id)); assert.ok(lobs.length > 100);
  for (const user of [head, specialist, viewer]) for (const resource of ['paises', 'lobs']) await data(await send('GET', resource, user.cookie));
  for (const resource of ['paises', 'lobs']) {
    assert.equal((await send('GET', resource, external.cookie)).status, 403);
    for (const method of ['POST', 'PATCH', 'DELETE']) for (const path of [resource, `${resource}/1`]) assert.equal((await send(method, path, head.cookie, { nombre: 'No CRUD' })).status, 404);
  }
  for (const path of ['catalogos', 'catalogos/clientes', 'catalogos/paises', 'catalogos/lobs', 'catalogos/servicios-lob']) {
    assert.equal((await send('GET', path, pm.cookie)).status, 404);
  }
  const spec = await (await send('GET', 'openapi.json')).json() as { paths: Record<string, unknown> };
  assert.ok(Object.keys(spec.paths).every(p => !p.startsWith('/api/v1/catalogos')));
  for (const path of ['/api/v1/clientes', '/api/v1/paises', '/api/v1/lobs']) assert.ok(spec.paths[path]);
  console.log('PASS países/LOB completos (>100), activos, política G1, sin CRUD; agregado/derivados 404 y ausentes de OpenAPI.');

  const workspace = await data<{ id: string }>(await send('POST', 'workspaces', pm.cookie, { nombre: `Vertical recursos ${mark}` }), 201);
  const input = { workspaceId: workspace.id, tvt: `CLIENT-${mark}`, nombre: 'Alta real de proyecto', clienteId: created.id, paisId: paises[0]!.id, lobId: lobs[0]!.id };
  const project = await data<{ id: string }>(await send('POST', 'proyectos', pm.cookie, input), 201);
  // Project presentation contains expected internal base fields; inspect its actual contract separately.
  const detailResponse = await send('GET', `proyectos/${project.id}`, pm.cookie);
  assert.equal(detailResponse.status, 200); const detail = (await detailResponse.json()).data;
  assert.equal(detail.identidad.cliente.id, created.id);
  const portfolioResponse = await send('GET', `portafolio?clienteId=${created.id}`, pm.cookie);
  assert.equal(portfolioResponse.status, 200);
  assert.deepEqual((await portfolioResponse.json()).data.items.map((p: { id: string }) => p.id), [project.id]);
  const [persisted] = await fixture<{ cliente: string; titular: string }>`SELECT p.cliente_id::text cliente,pp.usuario_id::text titular
    FROM pmo_cusn.proyecto p JOIN pmo_cusn.participacion_proyecto pp ON pp.proyecto_id=p.id AND pp.funcion='PM_TITULAR' AND pp.fecha_fin IS NULL WHERE p.id=${project.id}`;
  assert.equal(persisted?.cliente, created.id); assert.equal(persisted.titular, pm.id);
  for (const invalid of [{ clienteId: 'No es ID' }, { clienteId: big, paisId: inactiveCountry!.id }, { lobId: inactiveLob!.id }]) {
    assert.equal((await send('POST', 'proyectos', pm.cookie, { ...input, ...invalid, tvt: `INVALID-${crypto.randomUUID()}` })).status, 422);
  }
  const [inactiveClient] = await fixture<{ id: string }>`SELECT id::text FROM pmo_cusn.cliente WHERE NOT activo LIMIT 1`;
  assert.equal((await send('POST', 'proyectos', pm.cookie, { ...input, clienteId: inactiveClient!.id, tvt: `INVALID-${crypto.randomUUID()}` })).status, 422);
  const [audit] = await fixture<{ n: string }>`SELECT count(*)::text n FROM pmo_cusn.auditoria_seguridad WHERE actor_id=${pm.id} AND operacion='clientes.crear' AND recurso_id=${created.id}`;
  assert.equal(audit?.n, '1');
  const [denied] = await fixture<{ n: string }>`SELECT count(*)::text n FROM pmo_cusn.auditoria_seguridad
    WHERE actor_id=${specialist.id} AND operacion='http.denegado' AND resultado='DENEGADO'
      AND detalle->>'path'='/api/v1/clientes'`;
  assert.ok(Number(denied?.n) >= 2);
  const [privilege] = await sql<{ insert: boolean; update: boolean; delete: boolean; ddl: boolean }>`SELECT
    has_table_privilege(current_user,'pmo_cusn.cliente','INSERT') insert,has_table_privilege(current_user,'pmo_cusn.cliente','UPDATE') update,
    has_table_privilege(current_user,'pmo_cusn.cliente','DELETE') delete,has_schema_privilege(current_user,'pmo_cusn','CREATE') ddl`;
  assert.deepEqual(privilege, { insert: true, update: false, delete: false, ddl: false });
  for (const statement of ['UPDATE pmo_cusn.cliente SET nombre=nombre', 'DELETE FROM pmo_cusn.cliente']) await assert.rejects(() => sql.unsafe(statement), (e: unknown) => (e as { errno?: string }).errno === '42501');
  console.log('PASS flujo API cliente → búsqueda → proyecto → ficha/portafolio → titularidad PostgreSQL; INSERT exclusivo y auditoría real.');
} finally { await fixture.close(); await closeDatabase(); }
