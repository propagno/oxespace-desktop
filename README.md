# OXESpace Desktop

An AI coding agent desktop app, built on [opencode](https://github.com/anomalyco/opencode)'s
engine (SolidJS + Electron), reskinned with OXESpace's visual identity.

This is a fork, not a from-scratch app: it keeps opencode's own agent runtime (LLM tool-calling,
sessions, permissions) and replaces the UI theme, icon, and terminal font. See
[`tools/upstream-paths.txt`](tools/upstream-paths.txt) for the exact package subset kept from
upstream, and how to re-sync future upstream changes.

## Download

Grab the latest installer from the
[Releases page](https://github.com/propagno/oxespace-desktop/releases/latest).

| Platform | File |
| --- | --- |
| Windows | [`oxespace-desktop-win-x64.exe`](https://github.com/propagno/oxespace-desktop/releases/latest/download/oxespace-desktop-win-x64.exe) |

The Windows installer is currently unsigned, so SmartScreen may warn on first run — choose
"More info" → "Run anyway". macOS/Linux builds aren't published yet (no signing/notarization
credentials configured); see [Packaging](#packaging) to build them yourself.

Once installed, the app checks this repo's releases for updates automatically (Settings →
Updates → Verificar agora).

## Features

- Full opencode agent runtime: multi-step tool calling, permissions, session history, embedded
  terminal (ghostty-web + node-pty), native MCP client (local stdio and remote HTTP/SSE, with
  OAuth).
- Custom LLM provider: point the app at any Anthropic- or OpenAI-compatible endpoint (corporate
  gateways included), with a protocol selector and configurable timeout.
- Experimental, opt-in agent capabilities (Settings → General):
  - **GitHub tool** — the agent can list/view/create PRs, issues, and releases via the `gh` CLI.
  - **CodeGraph** — registers a local MCP server for semantic code search and indexing.
  - **Caveman Mode** — swaps the system prompt for short, blunt, caveman-style responses.

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

## Packaging

```
set OPENCODE_CHANNEL=prod
bun --cwd packages/desktop run build
bun --cwd packages/desktop run package:win     # or package:mac / package:linux / package (all)
```

Produces an NSIS installer (plus `dmg`/`AppImage`/`deb`/`rpm` for the other platforms) under
`packages/desktop/dist/`, along with `latest.yml` — the manifest the in-app updater reads. Code
signing is a no-op outside GitHub Actions, so local builds are unsigned — expected.

`.github/workflows/release-desktop.yml` builds and publishes a GitHub release automatically on
any `vX.Y.Z` / `beta-vX.Y.Z` tag push, given the right signing secrets are configured on the repo
(Windows: `WINDOWS_CERTIFICATE`/`WINDOWS_CERTIFICATE_PASSWORD`; macOS: `APPLE_ID`/
`APPLE_APP_SPECIFIC_PASSWORD`/`APPLE_TEAM_ID`/`MAC_CERTIFICATE`/`MAC_CERTIFICATE_PASSWORD`).

## License

MIT — see [LICENSE](LICENSE). This project is a fork of
[anomalyco/opencode](https://github.com/anomalyco/opencode) (MIT).
