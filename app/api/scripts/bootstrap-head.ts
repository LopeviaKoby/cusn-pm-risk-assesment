import { SQL } from "bun";

const url = Bun.env.MIGRATOR_DATABASE_URL;
const email = Bun.env.BOOTSTRAP_HEAD_EMAIL?.trim().toLowerCase();
const password = Bun.env.BOOTSTRAP_HEAD_PASSWORD;
const confirmed = Bun.env.BOOTSTRAP_CONFIRM_DATABASE;
if (!url || !email || !password || password.length < 14 || !confirmed) {
  throw new Error("Requiere MIGRATOR_DATABASE_URL, BOOTSTRAP_HEAD_EMAIL, BOOTSTRAP_HEAD_PASSWORD (14+ caracteres) y BOOTSTRAP_CONFIRM_DATABASE.");
}
const db = new SQL({ url, max: 1 });
try {
  const [target] = await db<{ name: string }>`SELECT current_database() AS name`;
  if (target?.name !== confirmed) throw new Error("La confirmación no coincide con la base de destino.");
  const hashed = await Bun.password.hash(password, { algorithm: "argon2id" });
  await db.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(81420262101)`;
    const [existing] = await tx<{ n: string }>`SELECT count(*)::text AS n FROM pmo_cusn.asignacion_rol a
      JOIN pmo_cusn.rol r ON r.id=a.rol_id WHERE r.codigo='ADMIN' AND a.revocado_at IS NULL`;
    if (existing?.n !== "0") throw new Error("Ya existe un Head activo; usa el gobierno de usuarios.");
    const [user] = await tx<{ id: string }>`INSERT INTO pmo_cusn.usuario(email,nombre,password_hash)
      VALUES (${email},'Head PMO',${hashed}) RETURNING id::text`;
    await tx`INSERT INTO pmo_cusn.asignacion_rol(usuario_id,rol_id,alcance_lectura)
      SELECT ${user!.id},id,'GLOBAL' FROM pmo_cusn.rol WHERE codigo='ADMIN'`;
    await tx`INSERT INTO pmo_cusn.auditoria_seguridad(actor_id,operacion,recurso_tipo,recurso_id,resultado)
      VALUES (${user!.id},'bootstrap.head','usuario',${user!.id},'PERMITIDO')`;
  });
  console.log("Primer Head creado en la base confirmada.");
} finally { await db.close(); }
