import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const opencode = resolve(root, ".opencode");
const foundry = resolve(root, ".agents/foundry");
const manifestPath = resolve(foundry, "seal-manifest.json");
const sha = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const problems = [];
const warnings = [];

function fail(message) { problems.push(message); }
function warn(message) { warnings.push(message); }
function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }

if (!existsSync(resolve(opencode, "skills-index.json")) || !existsSync(resolve(opencode, "validators/run-all.ps1"))) {
  console.log("Local Foundry seal payload is absent: .opencode is not the official installed tree.");
  console.log("This is a reported limitation, not permission to invent adoption rules.");
  process.exit(0);
}

const index = readJson(resolve(opencode, "skills-index.json"));
const skillDirs = readdirSync(resolve(opencode, "skills"), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);
if (index.count !== 115 || Object.keys(index.skills).length !== 115) {
  fail(`Official skills-index declares ${index.count}/${Object.keys(index.skills).length}; expected 115 official skills.`);
}
if (skillDirs.length !== 115) {
  fail(`.opencode/skills contains ${skillDirs.length} directories; expected 115.`);
}
for (const name of skillDirs) {
  if (!index.skills[name]) fail(`Unexpected skill directory in sealed tree: ${name}`);
}
for (const name of Object.keys(index.skills)) {
  if (!skillDirs.includes(name)) fail(`skills-index references missing official skill: ${name}`);
}

const sourceManifestPath = resolve(foundry, "source.json");
const foundryNames = new Set();
if (existsSync(sourceManifestPath)) {
  const source = readJson(sourceManifestPath);
  for (const skill of source.skills ?? []) foundryNames.add(skill.name);
}
for (const entry of readdirSync(resolve(root, ".agents/skills"), { withFileTypes: true })) {
  if (!entry.isDirectory() || foundryNames.has(entry.name)) continue;
  if (skillDirs.includes(entry.name)) fail(`Project skill copied into sealed .opencode/skills: ${entry.name}`);
}

const config = readJson(resolve(root, "opencode.json"));
if (JSON.stringify(config.permission ?? null) !== "null") fail("opencode.json still uses the legacy V1 permission field.");
if (!Array.isArray(config.instructions) || !config.instructions.includes(".opencode/AGENT-ONBOARDING.md") || !config.instructions.includes(".agents/foundry/PROFILE.md")) {
  fail("opencode.json must load .opencode/AGENT-ONBOARDING.md and .agents/foundry/PROFILE.md.");
}
if (!config.agents || !config.agents[config.default_agent]) fail(`default_agent '${config.default_agent}' is not defined inline.`);
for (const name of ["orchestrator", "design", "delivery", "control"]) {
  if (!config.agents?.[name]) fail(`Missing inline agent: ${name}`);
}
if (config.agents?.orchestrator?.mode !== "primary") fail("Inline orchestrator must be primary.");
for (const name of ["design", "delivery", "control"]) {
  if (config.agents?.[name]?.mode !== "subagent") fail(`Inline ${name} must be a subagent.`);
}

const ignore = readFileSync(resolve(root, ".gitignore"), "utf8").split(/\r?\n/);
for (const entry of ["/.opencode/", "/opencode.json", "/.workflow/", "/.agents/foundry/", "/.agents/roles/"]) {
  if (!ignore.includes(entry)) fail(`.gitignore is missing ${entry}`);
}
const docker = readFileSync(resolve(root, ".dockerignore"), "utf8").split(/\r?\n/);
for (const entry of [".opencode/", ".agents/", "opencode.json", ".workflow/"]) {
  if (!docker.includes(entry)) fail(`.dockerignore is missing ${entry}`);
}

if (existsSync(resolve(root, ".workflow/executions.jsonl"))) {
  fail("Unexpected .workflow/executions.jsonl; this adoption must not fabricate execution history.");
}

if (existsSync(manifestPath)) {
  const manifest = readJson(manifestPath);
  for (const item of manifest.customizations ?? []) {
    const path = resolve(root, item.path);
    if (!existsSync(path)) { fail(`Customization missing: ${item.path}`); continue; }
    if (item.sha256 && sha(path) !== item.sha256) fail(`Customization hash mismatch: ${item.path}`);
  }
} else {
  warn("seal-manifest.json is absent; customization hashes are not checked.");
}

const verifier = process.env.FOUNDRY_VERIFIER || resolve(root, ".tools/foundry-verifier");
const ps1 = resolve(verifier, "tools/foundry-internal/verify-seal.ps1");
const py = resolve(verifier, "tools/foundry-internal/verify-seal.py");
if (existsSync(ps1)) {
  const result = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps1, "-ProjectDir", root], { stdio: "inherit" });
  if (result.status !== 0) fail(`verify-seal.ps1 failed with exit ${result.status}`);
} else {
  warn(`Original verifier not found at ${relative(root, ps1)}; seal status was not checked.`);
}
if (existsSync(py)) {
  const result = spawnSync("python", [py, root, "--json"], { stdio: "inherit" });
  if (result.status !== 0) fail(`verify-seal.py failed with exit ${result.status}`);
} else {
  warn(`Original five-layer verifier not found at ${relative(root, py)}; five-layer audit was not checked.`);
}

for (const message of warnings) console.warn(`WARN: ${message}`);
for (const message of problems) console.error(`FAIL: ${message}`);
if (problems.length) {
  console.error(`Foundry adoption checks failed: ${problems.length} problem(s).`);
  process.exit(1);
}
console.log(`Foundry adoption checks passed: 115 official skills, ${skillDirs.length} sealed directories, 0 project skills inside .opencode, inline agents and instructions configured.`);
