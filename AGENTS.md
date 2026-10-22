# GPL agent instructions

- Use verified Node.js 22.23.4 and pnpm 12.12.1; preserve exact pins and supply-chain controls.
- Before any pnpm dependency change or tool execution, read [.agents/skills/pnpm-supply-chain-security/SKILL.md](.agents/skills/pnpm-supply-chain-security/SKILL.md). Use exact versions and `pnpm-lock.yaml`; never run unreviewed generators or `pnpm dlx`.
- Use [design/DESIGN.md](design/DESIGN.md) as the visual source of truth. Keep [src/styles/tokens.css](src/styles/tokens.css) aligned and use licensed local fonts. Radix is the primitive family for Tabs/Dialog; use semantic native buttons and preserve existing wrapper interfaces.
- Read relevant repository skills before design, React, shadcn, Tailwind, or browser work. Preserve source records and licenses. Use CodeGraph for structure when available, actual files for truth, and current official documentation for external APIs.
- Keep existing documentation and skills current with code changes. Future specifications belong in `/specs`, in concise Spanish. Do not create iteration reports.
- Keep `/docs/` and `/design/references/` local and out of Git, Docker contexts and bundles. Publish only fictional fixtures and authorized assets; preserve license notices. Never push without explicit authorization.
- Always terminate test/dev/preview servers and browser sessions started by the agent after each check or iteration, including on failure. Track owned process IDs, stop their process trees, and verify that the ports were released. Never terminate unrelated user processes.
- Verify with `pnpm install --frozen-lockfile`, `pnpm audit`, `pnpm audit signatures`, `pnpm ls --depth Infinity`, `pnpm run validate:demo`, `pnpm run test:demo`, `pnpm run typecheck`, `pnpm run build`, and a local render check. Stop for suspicious packages, unexpected scripts, unresolved high/critical dependency findings, or real compatibility exceptions.

## Local frontend adoption

- Owner: Pedro Lopez Chavarria. Scope remains the existing frontend. Never infer approval of an exception from owner identity.
- Codex: if present, read `.agents/foundry/PROFILE.md` once and use `.agents/roles/` plus its skill catalog. Roles there are explicit working instructions, not native agent definitions or permissions. Do not also load `.opencode/PROFILE.md`.
- OpenCode: its native configuration loads `.opencode/PROFILE.md`; do not additionally load the Codex copy. Both profiles and role bodies must stay equivalent.
- Skills remain task-selected; preserve existing skill sources and licenses. Read the relevant SKILL.md, do not execute examples that contradict package policy. No automatic framework updates.
- Check local equivalence with `pnpm run check:adoption`; synchronize reviewed local edits explicitly with `pnpm run sync:adoption`. A missing local profile is a reported limitation, not permission to invent its rules.
- Run frontend tests, coverage, E2E/accessibility, types, dependency/signature audits and distribution checks. Report blocked controls and pre-existing failures; do not reduce expectations. No framework seal or workflow history is implied by passing application tests.
- Internal adoption content and the personal guide must stay outside Git, Docker and browser bundles. The personal guide is never an execution dependency.
