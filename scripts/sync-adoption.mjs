import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canonical = resolve(root, ".agents/foundry");
if (!existsSync(resolve(canonical, "source.json"))) {
  console.error("Local adoption is absent. Restore the authorized local .agents/foundry files; this command never downloads or installs them.");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(resolve(canonical, "source.json"), "utf8"));
const write = process.argv.includes("--write");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
let errors = 0;
function pair(source, target, transform = bytes => bytes) {
  const expected = transform(readFileSync(resolve(root, source)));
  const destination = resolve(root, target);
  if (write) { mkdirSync(dirname(destination), { recursive: true }); writeFileSync(destination, expected); }
  if (!existsSync(destination) || !Buffer.from(expected).equals(readFileSync(destination))) {
    console.error(`DRIFT: ${source} -> ${target}`); errors++;
  }
}
pair(".agents/foundry/PROFILE.md", ".opencode/PROFILE.md");
pair(".agents/foundry/source.json", ".opencode/foundry-source.json");
pair(".agents/foundry/skill-catalog.json", ".opencode/skill-catalog.json");
pair(".agents/foundry/LICENSE", ".opencode/FOUNDRY-LICENSE");
for (const role of ["orchestrator", "design", "delivery", "control"]) {
  const permissions = role === "delivery" ? { edit: "ask", shell: "ask", task: "deny" }
    : { edit: "deny", shell: "ask", task: role === "orchestrator" ? { "*": "deny", design: "allow", delivery: "allow", control: "allow" } : "deny" };
  const header = `---\ndescription: ${role} for the existing GPL frontend\nmode: ${role === "orchestrator" ? "primary" : "subagent"}\npermission: ${JSON.stringify(permissions)}\n---\n\n`;
  pair(`.agents/roles/${role}.md`, `.opencode/agents/${role}.md`, bytes => header + bytes.toString("utf8"));
}
for (const skill of manifest.skills) {
  const base = `.agents/skills/${skill.name}`;
  for (const [relative, hash] of Object.entries(skill.files)) {
    const path = resolve(root, base, relative);
    if (!existsSync(path) || sha(readFileSync(path)) !== hash) { console.error(`SOURCE DRIFT: ${base}/${relative}`); errors++; continue; }
    pair(`${base}/${relative}`, `.opencode/skills/${skill.name}/${relative}`);
  }
}
// Preserve the existing project skills as the canonical copy, including their
// source records, references and licenses. Never alter them during synchronization.
function mirrorExisting(source, target) {
  for (const entry of readdirSync(resolve(root, source), { withFileTypes: true })) {
    if (entry.isDirectory()) mirrorExisting(`${source}/${entry.name}`, `${target}/${entry.name}`);
    else if (entry.isFile()) pair(`${source}/${entry.name}`, `${target}/${entry.name}`);
    else throw new Error(`Unsupported skill entry: ${source}/${entry.name}`);
  }
}
for (const entry of readdirSync(resolve(root, ".agents/skills"), { withFileTypes: true })) {
  if (!entry.isDirectory() || manifest.skills.some(skill => skill.name === entry.name)) continue;
  mirrorExisting(`.agents/skills/${entry.name}`, `.opencode/skills/${entry.name}`);
}
pair(".agents/skill-sources.json", ".opencode/frontend-skill-sources.json");
mirrorExisting(".agents/licenses", ".opencode/licenses");
// A single skill ID is effective in OpenCode: .opencode takes precedence over
// .agents. Codex discovers .agents only. Do not add a second skills config path.
const config = JSON.parse(readFileSync(resolve(root, "opencode.json"), "utf8"));
if (config.skills || config.mcp || config.instructions?.length !== 1 || config.instructions[0] !== ".opencode/PROFILE.md") {
  console.error("Unexpected extra skill/MCP/instruction loading in opencode.json"); errors++;
}
for (const path of [".agents/skills", ".opencode/skills"]) {
  const ids = new Set();
  for (const entry of readdirSync(resolve(root, path), { withFileTypes: true })) {
    const file = resolve(root, path, entry.name, "SKILL.md");
    if (!entry.isDirectory() || !existsSync(file)) continue;
    const id = /^name:\s*(.+)$/m.exec(readFileSync(file, "utf8"))?.[1]?.trim();
    if (!id || ids.has(id)) { console.error(`Duplicate/missing skill ID in ${path}: ${id}`); errors++; }
    ids.add(id);
  }
}
console.log(`${write ? "Synchronized" : "Checked"} local roles, profile, provenance and ${manifest.skills.length} Foundry skills. No upstream update, installation seal or execution history created.`);
process.exitCode = errors ? 1 : 0;
