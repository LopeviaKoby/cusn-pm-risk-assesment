import {strict as assert} from 'node:assert';
import {SignJWT} from 'jose';
import {sql,closeDatabase} from '../src/db';
import {login,sessionFrom,renew,logout} from '../src/session';
if(Bun.env.NODE_ENV!=='test'||!Bun.env.TEST_DATABASE_URL?.includes('pmo_test_v210_'))throw new Error('Solo BD aislada.');
const password=Bun.env.TEST_PASSWORD!;
const email=`negative-${crypto.randomUUID()}@example.invalid`;
const key=new TextEncoder().encode(Bun.env.JWT_SIGNING_KEY!);
const req=(token:string)=>new Request('http://127.0.0.1/api/v1/sesion',{headers:{cookie:`pmo_access=${token}`}});
try{
  const [u]=await sql<{id:string}>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash)
    VALUES (${email},'Prueba seguridad',${await Bun.password.hash(password,{algorithm:'argon2id'})}) RETURNING id::text`;
  assert.equal(await login(email,password),null);
  await sql`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
    SELECT ${u!.id},id,'ASIGNADOS' FROM pmo_cusn.rol WHERE codigo='VISUALIZADOR'`;
  const valid=await login(email,password);assert.ok(valid?.accessToken);
  await sql`UPDATE pmo_cusn.usuario SET refresh_expires_at=now()-interval '1 second' WHERE id=${u!.id}`;
  await assert.rejects(()=>renew(new Request('http://127.0.0.1/api/v1/sesion/renovar',{headers:{cookie:`pmo_refresh=${valid.refreshToken}`}})));
  await logout(req(valid.accessToken));
  assert.equal(await sessionFrom(req(valid.accessToken)),null);
  const renewedLogin=await login(email,password);assert.ok(renewedLogin?.accessToken);
  const [current]=await sql<{version:string}>`SELECT session_version::text AS version FROM pmo_cusn.usuario WHERE id=${u!.id}`;
  const control=await new SignJWT({ver:current!.version}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setJti(crypto.randomUUID())
    .setSubject(u!.id).setIssuer('pmo-cusn').setAudience('pmo-web').setExpirationTime('5m').sign(key);
  assert.equal((await sessionFrom(req(control)))?.userId,u!.id);
  for(const variant of ['signature','issuer','audience','expired','subject']){
    const token=await new SignJWT({ver:current!.version}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setJti(crypto.randomUUID())
      .setSubject(variant==='subject'?'999999999999999999':u!.id)
      .setIssuer(variant==='issuer'?'invalid':'pmo-cusn').setAudience(variant==='audience'?'invalid':'pmo-web')
      .setExpirationTime(variant==='expired'?'0s':'5m').sign(variant==='signature'?new Uint8Array(32):key);
    assert.equal(await sessionFrom(req(token)),null,variant);
  }
  await sql`UPDATE pmo_cusn.usuario SET activo=false WHERE id=${u!.id}`;
  assert.equal(await sessionFrom(req(renewedLogin.accessToken)),null);
  assert.equal(await login(email,password),null);
  await sql`UPDATE pmo_cusn.usuario SET activo=true WHERE id=${u!.id}`;
  for(let i=0;i<5;i++)assert.equal(await login(email,'incorrecta'),null);
  assert.equal(await login(email,password),null);
  console.log('PASS sin rol, inactivo, firma/iss/aud/exp/sub inválidos y bloqueo por fuerza bruta.');
}finally{await closeDatabase();}
