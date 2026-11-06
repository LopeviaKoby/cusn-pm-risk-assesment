import {registrationFixture} from './registration-fixture';
import { strict as assert } from "node:assert";
import { SQL } from "bun";

if (Bun.env.NODE_ENV !== "test" || !Bun.env.TEST_DATABASE_URL?.includes("pmo_test_v210_")) {
  throw new Error("Solo BD aislada de prueba.");
}
const password = Bun.env.TEST_PASSWORD;
if (!password) throw new Error("Falta TEST_PASSWORD.");

const fixture = new SQL({ url: Bun.env.TEST_DATABASE_URL, max: 1 });
const hash = await Bun.password.hash(password, { algorithm: "argon2id" });
const mark = crypto.randomUUID().slice(0, 8);
let serial = 0;

async function createActor(
  role: "ADMIN" | "PM" | "ESPECIALISTA" | "VISUALIZADOR",
  scope: "GLOBAL" | "ASIGNADOS" = role === "ADMIN" || role === "PM" ? "GLOBAL" : "ASIGNADOS",
  kind: "INTERNO" | "EXTERNO" = "INTERNO",
) {
  const email = `g1-${role.toLowerCase()}-${++serial}-${mark}@example.invalid`;
  const [user] = await fixture<{ id: string }>`
    INSERT INTO pmo_cusn.usuario(email,nombre,password_hash,tipo_usuario)
    VALUES (${email},${`G1 ${role} ${serial}`},${hash},${kind})
    RETURNING id::text`;
  await fixture`
    INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
    SELECT ${user!.id},id,${scope} FROM pmo_cusn.rol WHERE codigo=${role}`;
  return { id: user!.id, email, cookie: "" };
}

const head = await createActor("ADMIN");
const pmCreator = await createActor("PM");
const pmReassigned = await createActor("PM");
const pmSubstitute = await createActor("PM");
const pmOutsider = await createActor("PM");
const specialist = await createActor("ESPECIALISTA");
const viewerAssigned = await createActor("VISUALIZADOR", "ASIGNADOS", "INTERNO");
const external = await createActor("VISUALIZADOR", "ASIGNADOS", "EXTERNO");

const [clientA] = await fixture<{ id: string }>`
  INSERT INTO pmo_cusn.cliente(estado_cliente,nombre,sector) VALUES ('ANTIGUO',${`Cliente Alfa ${mark}`},'Banca') RETURNING id::text`;
const [clientB] = await fixture<{ id: string }>`
  INSERT INTO pmo_cusn.cliente(estado_cliente,nombre,sector) VALUES ('ANTIGUO',${`Cliente Beta ${mark}`},'Retail') RETURNING id::text`;
const [country] = await fixture<{ id: string }>`
  INSERT INTO pmo_cusn.pais(codigo,nombre) VALUES (${`G${mark.slice(0, 2).toUpperCase()}`},${`País G1 ${mark}`}) RETURNING id::text`;
const [lob] = await fixture<{ id: string }>`
  INSERT INTO pmo_cusn.lob(nombre) VALUES (${`LOB G1 ${mark}`}) RETURNING id::text`;
const [squad] = await fixture<{ id: string }>`
  INSERT INTO pmo_cusn.squad(nombre) VALUES (${`Squad G1 ${mark}`}) RETURNING id::text`;

const { handleRequest } = await import("../src/index");
const { closeDatabase } = await import("../src/db");
const origin = "http://127.0.0.1:4173";
const send = (method: string, path: string, cookie?: string, body?: unknown) =>
  handleRequest(
    new Request(`http://127.0.0.1:43001/api/v1/${path}`, {
      method,
      headers: {
        origin,
        ...(cookie ? { cookie } : {}),
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(registrationFixture(method,path,body)),
    }),
  );

async function expectData<T>(response: Response, expectedStatus = 200): Promise<T> {
  const json = await response.json();
  assert.equal(response.status, expectedStatus, JSON.stringify(json));
  assert.ok(
    !/password_hash|token_hash|session_version|recovery_expires|locked_until/.test(JSON.stringify(json)),
    "La respuesta no debe exponer hashes ni secretos.",
  );
  return json.data as T;
}

try {
  for (const actor of [
    head,
    pmCreator,
    pmReassigned,
    pmSubstitute,
    pmOutsider,
    specialist,
    viewerAssigned,
    external,
  ]) {
    const r = await send("POST", "sesion", undefined, { identifier: actor.email, password });
    await expectData(r);
    actor.cookie = r.headers.getSetCookie().find(v => v.startsWith("pmo_access="))!.split(";")[0]!;
  }

  // G1.6: Recursos independientes de selección; el agregado retirado devuelve 404.
  const paises=await expectData<{id:string}[]>(await send('GET','paises',pmCreator.cookie));
  const lobs=await expectData<{id:string}[]>(await send('GET','lobs',pmCreator.cookie));
  const clientes=await expectData<{items:{id:string}[]}>(await send('GET',`clientes?q=Alfa%20${mark}`,pmCreator.cookie));
  assert.ok(paises.some(p=>p.id===country!.id));
  assert.ok(lobs.some(l=>l.id===lob!.id));
  assert.ok(clientes.items.some(c=>c.id===clientA!.id));
  for(const resource of ['paises','lobs','clientes'])assert.equal((await send('GET',resource,external.cookie)).status,403);
  for(const path of ['catalogos','catalogos/clientes'])assert.equal((await send('GET',path,pmCreator.cookie)).status,404);

  // G1.1: Creación de workspace, detalle, miembros e invitaciones sin token
  const ws = await expectData<{ id: string; slug: string; version: string }>(
    await send("POST", "workspaces", pmCreator.cookie, { nombre: `Portafolio G1 ${mark}` }),
    201,
  );
  const wsSearch = await expectData<{ id: string }[]>(
    await send("GET", `workspaces?q=Portafolio%20G1%20${mark}&limit=10`, pmCreator.cookie),
  );
  assert.ok(wsSearch.some(w => w.id === ws.id));

  // No miembro recibe 403 en detalle/miembros/invitaciones/proyectos del workspace
  assert.equal((await send("GET", `workspaces/${ws.id}`, pmOutsider.cookie)).status, 403);
  assert.equal((await send("GET", `workspaces/${ws.id}/miembros`, pmOutsider.cookie)).status, 403);
  assert.equal((await send("GET", `workspaces/${ws.id}/invitaciones`, pmOutsider.cookie)).status, 403);
  assert.equal((await send("GET", `workspaces/${ws.id}/proyectos`, pmOutsider.cookie)).status, 403);

  // Incorporar miembros al workspace y emitir invitación
  for (const actor of [pmReassigned, specialist, viewerAssigned, external]) {
    await fixture`
      INSERT INTO pmo_cusn.membresia_workspace(workspace_id,usuario_id,incorporado_por_id)
      VALUES (${ws.id},${actor.id},${head.id})`;
  }
  const inviteRes = await expectData<{ id: string; token: string }>(
    await send("POST", `workspaces/${ws.id}/invitaciones`, pmCreator.cookie, {
      email: `invited-${mark}@example.invalid`,
      rol: "ESPECIALISTA",
    }),
    201,
  );
  assert.ok(inviteRes.token.length >= 40);

  const wsDetail = await expectData<{
    id: string;
    miMembresia: { puedeCrearProyectos: boolean; estado: string } | null;
    permisos: { puedeConfigurar: boolean; puedeCrearProyectos: boolean; puedeInvitar: boolean };
    resumen: { miembrosActivos: number; invitacionesPendientes: number };
  }>(await send("GET", `workspaces/${ws.id}`, pmCreator.cookie));
  assert.equal(wsDetail.miMembresia?.puedeCrearProyectos, true);
  assert.equal(wsDetail.permisos.puedeCrearProyectos, true);
  assert.equal(wsDetail.permisos.puedeInvitar, true);
  assert.equal(wsDetail.resumen.miembrosActivos, 5);
  assert.equal(wsDetail.resumen.invitacionesPendientes, 1);

  const invitationsList = await send("GET", `workspaces/${ws.id}/invitaciones`, pmCreator.cookie);
  const invitationsJson = await invitationsList.text();
  assert.equal(invitationsList.status, 200);
  assert.ok(!invitationsJson.includes(inviteRes.token), "El listado de invitaciones jamás debe exponer el token.");
  assert.equal((await send("GET", `workspaces/${ws.id}/invitaciones`, specialist.cookie)).status, 403);

  const membersForInternal = await expectData<{
    items: { usuarioId: string; email: string | null; esElegibleTitular: boolean }[];
    total: number;
  }>(await send("GET", `workspaces/${ws.id}/miembros`, pmCreator.cookie));
  assert.equal(membersForInternal.total, 5);
  assert.ok(membersForInternal.items.some(m => m.usuarioId === pmReassigned.id && m.esElegibleTitular && m.email !== null));

  const membersForExternal = await expectData<{
    items: { usuarioId: string; email: string | null }[];
  }>(await send("GET", `workspaces/${ws.id}/miembros`, external.cookie));
  assert.ok(membersForExternal.items.every(m => m.email === null), "Externo no debe ver correos internos.");

  // Elegibles del workspace
  const eligibles = await expectData<{ items: { usuarioId: string }[] }>(
    await send("GET", `workspaces/${ws.id}/elegibles?para=PM_TITULAR`, pmCreator.cookie),
  );
  assert.ok(eligibles.items.some(u => u.usuarioId === pmCreator.id));
  assert.ok(eligibles.items.some(u => u.usuarioId === pmReassigned.id));
  assert.equal((await send("GET", `workspaces/${ws.id}/elegibles`, specialist.cookie)).status, 403);

  // G1.3: Creación de proyectos con atributos de ficha y validación de fechas
  assert.equal(
    (
      await send("POST", "proyectos", pmCreator.cookie, {
        workspaceId: ws.id,
        tvt: `G1-BADDATE-${mark}`,
        nombre: "Fecha inválida",
        clienteId: clientA!.id,
        paisId: country!.id,
        lobId: lob!.id,
        fechaInicio: "2026-06-10",
        fechaTerminoBaseline: "2026-06-01",
      })
    ).status,
    422,
  );

  const p1 = await expectData<{ id: string; tvt: string; version: string }>(
    await send("POST", "proyectos", pmCreator.cookie, {
      workspaceId: ws.id,
      tvt: `G1-ALFA-${mark}`,
      nombre: `Migración Core ${mark}`,
      clienteId: clientA!.id,
      paisId: country!.id,
      lobId: lob!.id,
      squadId: squad!.id,
      descripcion: "Descripción inicial del proyecto Alfa",
      situacionInicial: "Situación inicial Alfa",
      fechaRecepcionP1p2: "2026-10-01",
      fechaInicio: "2026-10-15",
      fechaTerminoBaseline: "2026-12-31",
      referenciaSap: "SAP-001",
      referenciaCeco: "CECO-001",
      referenciaPep: "PEP-001",
    }),
    201,
  );

  const p2 = await expectData<{ id: string; tvt: string; version: string }>(
    await send("POST", "proyectos", head.cookie, {
      workspaceId: ws.id,
      tvt: `G1-BETA-${mark}`,
      nombre: `Plataforma Retail ${mark}`,
      clienteId: clientB!.id,
      paisId: country!.id,
      lobId: lob!.id,
      pmTitularId: pmCreator.id,
    }),
    201,
  );

  // Planificacion completa se fija en alta y PATCH ya no puede alterarla.
  assert.equal((await send('PATCH',`proyectos/${p2.id}`,pmCreator.cookie,{version:p2.version,fechaInicio:'2026-11-01'})).status,422);
  assert.equal((await send('PATCH',`proyectos/${p2.id}`,pmCreator.cookie,{version:p2.version,fechaTerminoBaseline:'2027-02-28'})).status,422);

  // Incorporar participantes a p1 (specialist y external)
  await expectData(
    await send("POST", `proyectos/${p1.id}/participantes`, pmCreator.cookie, {
      userId: specialist.id,
      funcion: "ESPECIALISTA",
    }),
    201,
  );
  await expectData(
    await send("POST", `proyectos/${p1.id}/participantes`, pmCreator.cookie, {
      userId: external.id,
      funcion: "OBSERVADOR",
    }),
    201,
  );

  // G1.2: Transferir p1 a pmReassigned (quien NO fue el creador) y verificar que puede designar y revocar suplencias
  await expectData(
    await send("POST", `proyectos/${p1.id}/transferencia`, head.cookie, {
      workspaceId: ws.id,
      pmTitularId: pmReassigned.id,
      version: p1.version,
    }),
  );
  // Antiguo titular ya no puede designar suplencia
  const subPayload = {
    delegateId: pmSubstitute.id,
    start: new Date(Date.now() - 60_000).toISOString(),
    end: new Date(Date.now() + 3_600_000).toISOString(),
    reason: "Suplencia autorizada por titular reasignado",
    permissions: ["proyectos.editar"],
  };
  assert.equal((await send("POST", `proyectos/${p1.id}/suplencias`, pmCreator.cookie, subPayload)).status, 403);
  // Nuevo titular reasignado sí designa suplencia
  const subCreated = await expectData<{ id: string; state: string }>(
    await send("POST", `proyectos/${p1.id}/suplencias`, pmReassigned.cookie, subPayload),
    201,
  );
  assert.equal(subCreated.state, "ACTIVA");

  // G1.2: Consulta de asignaciones del proyecto para interno vs externo
  const assignInternal = await expectData<{
    titular: { usuarioId: string; email: string | null };
    participantes: { usuarioId: string; funcion: string }[];
    suplenciasVigentes: { id: string; delegadoId: string }[];
    permisosDelegables: { codigo: string }[];
  }>(await send("GET", `proyectos/${p1.id}/asignaciones`, pmReassigned.cookie));
  assert.equal(assignInternal.titular.usuarioId, pmReassigned.id);
  assert.ok(assignInternal.titular.email !== null);
  assert.equal(assignInternal.participantes.length, 2);
  assert.equal(assignInternal.suplenciasVigentes.length, 1);
  assert.ok(assignInternal.permisosDelegables.some(p => p.codigo === "proyectos.editar"));

  const assignExternal = await expectData<{
    titular: { email: string | null };
    suplenciasVigentes: unknown[];
    permisosDelegables: unknown[];
  }>(await send("GET", `proyectos/${p1.id}/asignaciones`, external.cookie));
  assert.equal(assignExternal.titular.email, null);
  assert.equal(assignExternal.suplenciasVigentes.length, 0);
  assert.equal(assignExternal.permisosDelegables.length, 0);

  // G1.5: Ficha de presentación del proyecto (interno titular, suplente, PM ajeno y externo)
  const fichaTitular = await expectData<{
    id: string;
    identidad: {
      descripcion: string | null;
      situacionInicial: string | null;
      squad: { id: string } | null;
      referenciasInternas: { sap: string | null } | null;
    };
    gobierno: {
      titular: { usuarioId: string; email: string | null };
      suplenciaEfectiva: { id: string; delegadoId: string } | null;
    };
    planificacion: {
      fechaInicio: string | null;
      fechaTerminoBaseline: string | null;
      fechaTerminoActual: string | null;
      baselineCongelada: boolean;
    };
    accionesDisponibles: {
      puedeEditarFicha: boolean;
      puedeFijarBaseline: boolean;
      puedeTransferir: boolean;
      puedeDesignarSuplencia: boolean;
      puedeRevocarSuplencia: boolean;
    };
    modulosPendientes: { complejidad: string; seguimientoCurvaS: string };
  }>(await send("GET", `proyectos/${p1.id}`, pmReassigned.cookie));
  assert.equal(fichaTitular.identidad.descripcion, "Descripción inicial del proyecto Alfa");
  assert.equal(fichaTitular.identidad.squad?.id, squad!.id);
  assert.equal(fichaTitular.identidad.referenciasInternas?.sap, "SAP-001");
  assert.equal(fichaTitular.gobierno.titular.usuarioId, pmReassigned.id);
  assert.equal(fichaTitular.gobierno.suplenciaEfectiva?.delegadoId, pmSubstitute.id);
  assert.equal(fichaTitular.planificacion.fechaTerminoBaseline, "2026-12-31");
  assert.equal(fichaTitular.planificacion.fechaTerminoActual, "2026-12-31");
  assert.equal(fichaTitular.planificacion.baselineCongelada, true);
  assert.equal(fichaTitular.accionesDisponibles.puedeEditarFicha, true);
  assert.equal(fichaTitular.accionesDisponibles.puedeFijarBaseline, false);
  assert.equal(fichaTitular.accionesDisponibles.puedeTransferir, false);
  assert.equal(fichaTitular.accionesDisponibles.puedeDesignarSuplencia, true);
  assert.equal(fichaTitular.accionesDisponibles.puedeRevocarSuplencia, true);
  assert.equal(fichaTitular.modulosPendientes.complejidad, "PENDIENTE_P1");

  const fichaExterno = await expectData<{
    identidad: { referenciasInternas: unknown };
    gobierno: { titular: { email: string | null } };
    accionesDisponibles: { puedeEditarFicha: boolean };
  }>(await send("GET", `proyectos/${p1.id}`, external.cookie));
  assert.equal(fichaExterno.identidad.referenciasInternas, null);
  assert.equal(fichaExterno.gobierno.titular.email, null);
  assert.equal(fichaExterno.accionesDisponibles.puedeEditarFicha, false);
  assert.equal((await send("GET", `proyectos/${p2.id}`, external.cookie)).status, 403);

  // El titular reasignado revoca la suplencia
  await expectData(
    await send("POST", `proyectos/${p1.id}/suplencias/${subCreated.id}/revocacion`, pmReassigned.cookie),
  );

  // G1.4: Portafolio denso (búsqueda, filtros, orden, paginación sin duplicados ni omisiones, aislamiento de perfiles)
  const page1 = await expectData<{
    items: { id: string; tvt: string; indicadoresPendientes: { spi: null; cpi: null } }[];
    paginacion: { total: number; hasMore: boolean; nextOffset: number | null };
    resumenPorEstado: { total: number; porEstado: Record<string, number> };
  }>(
    await send(
      "GET",
      `workspaces/${ws.id}/proyectos?ordenarPor=tvt&direccion=asc&limit=1&offset=0`,
      pmReassigned.cookie,
    ),
  );
  const page2 = await expectData<{
    items: { id: string; tvt: string }[];
    paginacion: { total: number; hasMore: boolean };
  }>(
    await send(
      "GET",
      `workspaces/${ws.id}/proyectos?ordenarPor=tvt&direccion=asc&limit=1&offset=1`,
      pmReassigned.cookie,
    ),
  );
  assert.equal(page1.paginacion.total, 2);
  assert.equal(page1.resumenPorEstado.total, 2);
  assert.equal(page1.resumenPorEstado.porEstado["Requiere P1P2"], 2);
  assert.equal(page1.paginacion.hasMore, true);
  assert.equal(page2.paginacion.hasMore, false);
  assert.equal(page1.items[0]!.id, p1.id);
  assert.equal(page2.items[0]!.id, p2.id);
  assert.equal(page1.items[0]!.indicadoresPendientes.spi, null);
  assert.equal(page1.items[0]!.indicadoresPendientes.cpi, null);

  // Búsqueda por cliente en portafolio global
  const byClient = await expectData<{ items: { id: string }[]; paginacion: { total: number } }>(
    await send("GET", `portafolio?q=Cliente%20Beta%20${mark}`, pmReassigned.cookie),
  );
  assert.deepEqual(byClient.items.map(i => i.id), [p2.id]);

  // Aislamiento de portafolio para Especialista y Externo (solo ven p1 donde participan, nunca p2)
  for (const assignedActor of [specialist, external]) {
    const scoped = await expectData<{
      items: { id: string }[];
      paginacion: { total: number };
      resumenPorEstado: { total: number };
    }>(await send("GET", `portafolio?workspaceId=${ws.id}`, assignedActor.cookie));
    assert.deepEqual(scoped.items.map(i => i.id), [p1.id]);
    assert.equal(scoped.paginacion.total, 1);
    assert.equal(scoped.resumenPorEstado.total, 1);
  }

  // incluirInactivos solo permitido para Head
  assert.equal((await send("GET", "portafolio?incluirInactivos=true", pmReassigned.cookie)).status, 403);
  assert.equal((await send("GET", "portafolio?incluirInactivos=true", head.cookie)).status, 200);

  console.log(
    "PASS G1 completo: workspace/detalle/miembros/invitaciones sin token, suplencia por titular reasignado, alta/edición con baseline inmutable, portafolio denso paginado y ficha con confidencialidad.",
  );
} finally {
  await fixture.close();
  await closeDatabase();
}
