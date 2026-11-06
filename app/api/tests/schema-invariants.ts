import {strict as assert} from 'node:assert';
import {SQL} from 'bun';

if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_'))throw new Error('Solo BD aislada.');
const db=new SQL({url:Bun.env.TEST_DATABASE_URL,max:1});
const [project]=await db<{id:string;tvt:string;workspaceId:string;ownerId:string;creatorId:string;clienteId:string;paisId:string;lobId:string}>`
  SELECT p.id::text,p.tvt,p.workspace_id::text AS "workspaceId",pp.usuario_id::text AS "ownerId",
    p.creado_por_id::text AS "creatorId",p.cliente_id::text AS "clienteId",p.pais_id::text AS "paisId",p.lob_id::text AS "lobId"
  FROM pmo_cusn.proyecto p JOIN pmo_cusn.participacion_proyecto pp ON pp.proyecto_id=p.id
  WHERE pp.funcion='PM_TITULAR' AND pp.fecha_fin IS NULL ORDER BY p.id LIMIT 1`;
assert.ok(project,'Se necesita un proyecto válido creado por la prueba HTTP.');
const [otherWorkspace]=await db<{id:string}>`SELECT id::text FROM pmo_cusn.workspace WHERE id<>${project.workspaceId} LIMIT 1`;
assert.ok(otherWorkspace);
const insertProject=(tx:SQL,tvt:string,workspaceId=project.workspaceId)=>tx<{id:string}>`
  INSERT INTO pmo_cusn.proyecto(tvt,nombre,workspace_id,creado_por_id,cliente_id,pais_id,lob_id)
  VALUES (${tvt},'Prueba de restricción',${workspaceId},${project.creatorId},${project.clienteId},${project.paisId},${project.lobId})
  RETURNING id::text`;
async function rejects(label:string,operation:()=>Promise<unknown>){
  let rejected=false;
  try{await operation();}catch(error){
    const state=(error as {errno?:string}).errno;
    assert.ok(state && ['P0001','23505','23P01','23514'].includes(state),`${label}: SQLSTATE inesperado ${state}`);
    rejected=true;
  }
  assert.ok(rejected,label);
}
try{
  await rejects('T05 TVT normalizado global',()=>db.begin(async tx=>{
    await insertProject(tx,` ${project.tvt.toLowerCase()} `,otherWorkspace.id);
  }));
  await rejects('T06 proyecto sin titular al COMMIT',()=>db.begin(async tx=>{
    await insertProject(tx,`T06-SIN-${crypto.randomUUID()}`);
  }));
  await rejects('T06 dos titulares vigentes',()=>db.begin(async tx=>{
    await tx`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion)
      VALUES (${project.id},${project.creatorId},'PM_TITULAR')`;
  }));
  const [specialist]=await db<{id:string}>`SELECT u.id::text FROM pmo_cusn.usuario u
    JOIN pmo_cusn.asignacion_rol a ON a.usuario_id=u.id AND a.revocado_at IS NULL
    JOIN pmo_cusn.rol r ON r.id=a.rol_id AND r.codigo='ESPECIALISTA' LIMIT 1`;
  assert.ok(specialist);
  await rejects('T07 titular no PM',()=>db.begin(async tx=>{
    const [created]=await insertProject(tx,`T07-ES-${crypto.randomUUID()}`);
    await tx`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion)
      VALUES (${created!.id},${specialist.id},'PM_TITULAR')`;
  }));
  await rejects('T07 titular no miembro',()=>db.begin(async tx=>{
    const [newPm]=await tx<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash)
      VALUES (${`nomember-${crypto.randomUUID()}@example.invalid`},'PM sin membresía','test-only') RETURNING id::text`;
    await tx`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
      SELECT ${newPm!.id},id,'GLOBAL' FROM pmo_cusn.rol WHERE codigo='PM'`;
    const [created]=await insertProject(tx,`T07-NM-${crypto.randomUUID()}`);
    await tx`INSERT INTO pmo_cusn.participacion_proyecto(proyecto_id,usuario_id,funcion)
      VALUES (${created!.id},${newPm!.id},'PM_TITULAR')`;
  }));
  await rejects('T18 auditoría append-only UPDATE',()=>db`UPDATE pmo_cusn.auditoria_seguridad SET operacion='alterada'
    WHERE id=(SELECT id FROM pmo_cusn.auditoria_seguridad ORDER BY id LIMIT 1)`);
  await rejects('T18 auditoría append-only DELETE',()=>db`DELETE FROM pmo_cusn.auditoria_seguridad
    WHERE id=(SELECT id FROM pmo_cusn.auditoria_seguridad ORDER BY id LIMIT 1)`);
  await rejects('T19 retiro del titular',()=>db.begin(async tx=>{
    await tx`UPDATE pmo_cusn.membresia_workspace SET estado='RETIRADA'
      WHERE workspace_id=${project.workspaceId} AND usuario_id=${project.ownerId}`;
  }));
  await rejects('T19 revocación de rol del titular',()=>db.begin(async tx=>{
    await tx`UPDATE pmo_cusn.asignacion_rol SET revocado_at=now() WHERE usuario_id=${project.ownerId} AND revocado_at IS NULL`;
  }));
  await rejects('T07 titular inactivo',()=>db.begin(async tx=>{
    await tx`UPDATE pmo_cusn.usuario SET activo=false WHERE id=${project.ownerId}`;
  }));
  await db`UPDATE pmo_cusn.proyecto SET fecha_inicio='2026-11-01',fecha_termino_baseline='2026-12-31',fecha_termino_actual='2026-12-31' WHERE id=${project.id} AND fecha_termino_baseline IS NULL`;
  await rejects('G1 baseline de término inmutable una vez fijada',()=>db`UPDATE pmo_cusn.proyecto SET fecha_termino_baseline='2027-01-31' WHERE id=${project.id}`);
  await rejects('G1 fecha_termino_actual coherente con fecha_inicio',()=>db`UPDATE pmo_cusn.proyecto SET fecha_termino_actual='2026-10-15' WHERE id=${project.id}`);
  const [unchanged]=await db<{owner:boolean}>`SELECT EXISTS(SELECT 1 FROM pmo_cusn.membresia_workspace
    WHERE workspace_id=${project.workspaceId} AND usuario_id=${project.ownerId} AND estado='ACTIVA') AS owner`;
  assert.equal(unchanged?.owner,true);
  const [pmo]=await db<{value:string}>`SELECT value FROM pmo.sentinel WHERE value='intacto'`;
  assert.equal(pmo?.value,'intacto');
  console.log('PASS T05, T06, T07 (no PM/no miembro), T18, T19 y T20 sobre PostgreSQL real.');
}finally{await db.close();}
