# OXESpace Desktop

An AI coding agent desktop app, built on [opencode](https://github.com/anomalyco/opencode)'s
engine (SolidJS + Electron), reskinned with OXESpace's visual identity.

This is a fork, not a from-scratch app: it keeps opencode's own agent runtime (LLM tool-calling,
sessions, permissions) and replaces the UI theme, icon, and terminal font. See
[`tools/upstream-paths.txt`](tools/upstream-paths.txt) for the exact package subset kept from
upstream, and how to re-sync future upstream changes.

## Requirements

- [Bun](https://bun.sh) `1.3.14` (pinned in `package.json`'s `packageManager` field)
- Windows: the "Desktop development with C++" workload (Visual Studio Build Tools) is needed to
  compile `tree-sitter-powershell` — used by the agent's shell tool to parse PowerShell commands.
  Without it, run `bun install --ignore-scripts` (skips all native compiles; `fix-node-pty` is a
  Windows no-op regardless) and download Electron's binary separately — see
  `node_modules/.bun/electron@*/node_modules/electron/install.js`.

## Development

```
bun install
bun run typecheck
bun --cwd packages/desktop dev
```

## Packaging (Windows)

```
set OPENCODE_CHANNEL=prod
bun --cwd packages/desktop run package:win
```

Produces an NSIS installer under `packages/desktop/dist/`. Code-signing is a no-op outside GitHub
Actions, so local builds are unsigned — expected.

## License

MIT — see [LICENSE](LICENSE). This project is a fork of
[anomalyco/opencode](https://github.com/anomalyco/opencode) (MIT).
