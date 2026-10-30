const password = process.argv[2] ?? Bun.env.GPL_NEW_PASSWORD;

if (!password) {
  console.error("Uso: bun run server/scripts/hash-password.ts '<contraseña>' o define GPL_NEW_PASSWORD.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("La contraseña debe tener al menos 12 caracteres.");
  process.exit(1);
}

const hash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 12 });
console.error("Copia la salida en GPL_PASSWORD_HASH_B64. No guardes la contraseña ni el hash en el repositorio.");
console.log(Buffer.from(hash, "utf8").toString("base64"));

export {};