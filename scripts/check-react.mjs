import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const path = new URL("../node_modules/react-doctor/package.json", import.meta.url);
if (!existsSync(path)) {
  console.error("BLOCKED: react-doctor@0.9.18 is not installed. Reproduce the reviewed project lockfile with pnpm install --frozen-lockfile; this gate never downloads tools automatically.");
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(path, "utf8"));
if (pkg.version !== "0.9.18") throw new Error("Review the React Doctor pin and Semver exception before changing this gate.");
const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin["react-doctor"];
const scope = ["--scope", "full"];
if (process.env.GITHUB_EVENT_NAME === "pull_request") {
  const branch = process.env.GITHUB_BASE_REF;
  if (!branch) throw new Error("Missing pull request base branch");
  const base = `refs/remotes/origin/${branch}`;
  if (spawnSync("git", ["rev-parse", "--verify", `${base}^{commit}`], { stdio: "ignore" }).status !== 0) throw new Error("Pull request base unavailable: fetch history before running the gate");
  scope.splice(0, scope.length, "--scope", "changed", "--base", base);
}
// Local analysis only: no score/crash uploads or Socket.dev queries. The
// independent pnpm audit/signature checks remain mandatory in CI.
const result = spawnSync(process.execPath, [fileURLToPath(new URL(bin, path)), ".", "--json", "--no-telemetry", "--no-supply-chain", "--blocking", "error", ...scope], { stdio: "inherit" });
process.exit(result.status ?? 1);
