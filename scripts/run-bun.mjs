import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const candidates = [
  process.env.BUN_BIN,
  resolve(".tools/bun-1.4.4/bun.exe"),
  resolve(".tools/bun-1.4.4/bun"),
  "bun",
].filter(value => Boolean(value));

const bin = candidates.find(candidate => candidate === "bun" || existsSync(candidate));
if (!bin) {
  console.error("Bun 1.4.4 no encontrado. Define BUN_BIN o instala Bun en PATH.");
  process.exit(1);
}

const result = spawnSync(bin, process.argv.slice(2), { stdio: "inherit", env: process.env });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
