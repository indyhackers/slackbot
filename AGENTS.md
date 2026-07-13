## effect

- run `bun run sync-repos effect` to install or refresh `.repos/effect`.
- `.repos/` is ignored reference source only.
- exact API authority: installed `node_modules/effect` package and lockfile.
- use `.repos/effect/LLMS.md`, `.repos/effect/ai-docs/`, source, and tests for patterns.
- if `.repos/effect` disagrees with installed package types, installed package wins.
- never import from `.repos/effect`.
- run `bun run check-types --pretty false` for TypeScript and Effect diagnostics.
