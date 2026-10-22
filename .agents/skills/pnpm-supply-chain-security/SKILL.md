---
name: pnpm-supply-chain-security
description: Verify package identity and supply-chain controls before pnpm dependency changes, installation, removal, or execution of package tools and scripts.
---

# pnpm supply-chain security

Apply this sequence: **verify identity → review versions and direct/transitive tree → check publication age → inspect scripts → install → audit → verify lockfile**. Ordinary verified installation is authorized; stop for suspicious packages, unexpected scripts, unresolved high/critical dependency findings, or real compatibility/security exceptions.

1. Confirm each new exact package name in its official documentation or source repository. Cross-check registry maintainers, repository, license, engines, peers, history, integrity and provenance. Registry existence, AI suggestions, signatures and a clean audit alone do not establish legitimacy.
2. Keep the project's `pnpm-workspace.yaml` policy: official HTTPS registry, seven-day strict age including transitives, `trustPolicy: no-downgrade`, `trustLockfile: false`, `blockExoticSubdeps: true`, strict engines/peers/builds, `allowBuilds: {}`, and dependency skills disabled. Pin direct versions and package manager exactly. Do not use `pnpm dlx`, remote scripts, mass exceptions, or automatic audit fixes.
3. Review every newly requested build script and the files/downloads it invokes. Authorize only an indispensable exact `name@version` in `allowBuilds`, after review. Do not blanket approve. Review project root scripts before `pnpm run`.
4. Review manifest and lock changes with Git. Resolve with pnpm, then check all new transitives for source, age, scripts and integrity. Use `pnpm install --frozen-lockfile` for a clean reproduction. Run `pnpm audit`, `pnpm audit signatures`, tree, TypeScript and build checks; report actual coverage and failures separately.

Node 22.23.4 replaces the temporary 22.23.3 exception after verification against the official security release and SHA256. Preserve the reviewed runtime and package-manager pins.

Official references: [pnpm installation](https://pnpm.io/installation), [dependency resolution](https://pnpm.io/settings/dependency-resolution), [build approvals](https://pnpm.io/settings/build), [audit](https://pnpm.io/cli/audit), [install](https://pnpm.io/cli/install).

Project-only exception authorized by the owner on 2026-10-22: `trustPolicyExclude: [semver@6.3.1]`, required by the reviewed React Doctor/Babel tree. SHA-512 and npm registry signature were verified, no known audit findings; provenance attestation is unavailable. No other trust exception is authorized. Remove this selector when the reviewed tree no longer requires this exact version; reproduce the frozen install, audit and signatures. All other policies remain mandatory.
