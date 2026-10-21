# GPL agent instructions

- Use Node.js 22.23.3 and pnpm 12.12.1 for local development only; update Node after the announced security release before any other use.
- Before any pnpm dependency change or tool execution, read [.agents/skills/pnpm-supply-chain-security/SKILL.md](.agents/skills/pnpm-supply-chain-security/SKILL.md). Use exact versions and `pnpm-lock.yaml`; never run unreviewed generators or `pnpm dlx`.
- Use [design/DESIGN.md](design/DESIGN.md) as the visual source of truth. Keep [src/styles/tokens.css](src/styles/tokens.css) aligned and use licensed local fonts. Base UI is the sole shadcn primitive family.
- Read relevant repository skills before design, React, shadcn, Tailwind, or browser work. Preserve source records and licenses. Use CodeGraph for structure when available, actual files for truth, and current official documentation for external APIs.
- Keep existing documentation and skills current with code changes. Future specifications belong in `/specs`, in concise Spanish. Do not create iteration reports.
- Keep `/docs/` and `/design/references/` local and out of Git, Docker contexts and bundles. Publish only fictional fixtures and authorized assets; preserve license notices. Never push without explicit authorization.
- Always terminate test/dev/preview servers and browser sessions started by the agent after each check or iteration, including on failure. Track owned process IDs, stop their process trees, and verify that the ports were released. Never terminate unrelated user processes.
- Verify with `pnpm install --frozen-lockfile`, `pnpm audit`, `pnpm audit signatures`, `pnpm ls --depth Infinity`, `pnpm run validate:demo`, `pnpm run test:demo`, `pnpm run typecheck`, `pnpm run build`, and a local render check. Stop for suspicious packages, unexpected scripts, unresolved high/critical dependency findings, or real compatibility exceptions.
