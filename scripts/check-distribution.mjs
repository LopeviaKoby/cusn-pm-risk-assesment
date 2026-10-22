import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, relative } from "node:path";

const privatePaths = /^(?:\.opencode\/|opencode\.json$|FRAMEWORK_ADOPTION\.md$|\.workflow\/|\.agents\/(?:foundry|roles)\/|docs\/|design\/references\/)/;
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const ignore = readFileSync(".gitignore", "utf8");
const internalSkills = ignore.split(/\r?\n/).map(line => line.replace(/^\//, "")).filter(line => /^\.agents\/skills\/[^*]+\/$/.test(line));
const leaked = tracked.filter(path => privatePaths.test(path) || internalSkills.some(prefix => path.startsWith(prefix)));
if (leaked.length) throw new Error(`Private files in index: ${leaked.join(", ")}`);
const docker = readFileSync(".dockerignore", "utf8");
for (const name of [".agents/", ".opencode/", "opencode.json", "FRAMEWORK_ADOPTION.md", ".workflow/", "/docs/", "/design/references/"]) {
  if (!docker.split(/\r?\n/).includes(name)) throw new Error(`Missing Docker exclusion: ${name}`);
}
function inspect(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, item.name);
    if (item.isDirectory()) inspect(path);
    else if (/\.(?:html|js|css|json|txt|md)$/i.test(item.name)) {
      const content = readFileSync(path, "utf8");
      if (/FRAMEWORK_ADOPTION|tivit-foundry-signature|foundry-source\.json|\.agents\/foundry|\.opencode\/PROFILE/.test(content)) {
        throw new Error(`Internal adoption content in bundle: ${relative(process.cwd(), path)}`);
      }
    }
  }
}
if (existsSync("dist")) inspect(resolve("dist"));
console.log("Distribution boundaries OK: index, Docker exclusions and available bundle.");
