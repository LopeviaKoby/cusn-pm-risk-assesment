import { SQL } from "bun";

const url=Bun.env.MIGRATOR_DATABASE_URL;
if(!url)throw new Error("Falta MIGRATOR_DATABASE_URL.");
const role=(Bun.env.APP_DB_ROLE??"pmo_app").trim();
if(!/^[a-z_][a-z0-9_]*$/.test(role))throw new Error("APP_DB_ROLE no válido.");
const sql=new SQL({url,max:1});
try {
  await sql.begin(async tx=>{
    const [owner]=await tx<{owner:string;current_user:string}>`SELECT tableowner AS owner,current_user FROM pg_tables WHERE schemaname='pmo_cusn' AND tablename='proyecto'`;
    if(!owner||owner.owner!==owner.current_user)throw new Error("Conectar como propietario de pmo_cusn.proyecto.");
    const [existing]=await tx<{rolsuper:boolean;rolcreaterole:boolean;rolcreatedb:boolean;rolreplication:boolean;rolbypassrls:boolean}>`SELECT rolsuper,rolcreaterole,rolcreatedb,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=${role}`;
    const execute=async (template:string,values:string[])=>{
      const [r]=await tx<{ddl:string}>`SELECT format(${template}::text,VARIADIC ${values}::text[]) AS ddl`;
      if(!r)throw new Error("No se pudo construir DDL.");
      await tx.unsafe(r.ddl);
    };
    if(!existing){
      const password=Bun.env.APP_DB_PASSWORD;
      if(!password||password.length<12||/cambia-por|change-me/.test(password))throw new Error("Crear rol exige APP_DB_PASSWORD válida (12+ caracteres).");
      await execute('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',[role,password]);
    }else if(existing.rolsuper||existing.rolcreaterole||existing.rolcreatedb||existing.rolreplication||existing.rolbypassrls)throw new Error("Runtime con privilegios elevados; no se modifica el rol existente.");
    for(const statement of [
      'GRANT USAGE ON SCHEMA pmo_cusn,pmo_cusn_meta TO %I',
      'GRANT SELECT ON ALL TABLES IN SCHEMA pmo_cusn TO %I',
      'REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON ALL TABLES IN SCHEMA pmo_cusn FROM %I',
      'GRANT INSERT,UPDATE ON pmo_cusn.usuario,pmo_cusn.asignacion_rol,pmo_cusn.workspace,pmo_cusn.membresia_workspace,pmo_cusn.invitacion_workspace,pmo_cusn.proyecto,pmo_cusn.participacion_proyecto,pmo_cusn.delegacion_acceso,pmo_cusn.delegacion_permiso TO %I',
      'GRANT INSERT ON pmo_cusn.evento_proyecto,pmo_cusn.auditoria_seguridad TO %I',
      'GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA pmo_cusn TO %I',
      'GRANT SELECT ON pmo_cusn_meta.migracion TO %I',
      'REVOKE UPDATE,DELETE,TRUNCATE ON pmo_cusn.evento_proyecto,pmo_cusn.auditoria_seguridad FROM %I',
      'REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON pmo_cusn.rol_permiso,pmo_cusn.rol,pmo_cusn.permiso FROM %I',
    ])await execute(statement,[role]);
    console.log(`Runtime ${role}: solo grants de pmo_cusn y lectura de pmo_cusn_meta. No cambia credenciales ni pmo.`);
  });
}finally{await sql.close();}
