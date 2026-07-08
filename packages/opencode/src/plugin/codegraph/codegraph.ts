import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { ConfigV1 } from "@opencode-ai/core/v1/config/config"
import { createRequire } from "node:module"
import path from "node:path"
import fs from "node:fs"

const require = createRequire(import.meta.url)

function resolveCodegraphBin(): string | undefined {
  try {
    const pkgJsonPath = require.resolve("@colbymchenry/codegraph/package.json")
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8")) as { bin?: Record<string, string> }
    const binRelative = pkg.bin?.codegraph
    if (!binRelative) return undefined
    return path.join(path.dirname(pkgJsonPath), binRelative)
  } catch {
    return undefined
  }
}

export async function CodegraphPlugin(input: PluginInput): Promise<Hooks> {
  return {
    async config(rawCfg: any) {
      // The `Hooks["config"]` type from `@opencode-ai/plugin` mirrors an older,
      // frozen SDK contract that predates the `experimental`/mcp `cwd` fields
      // used here. The object the host actually passes in is the live
      // `ConfigV1.Info`, so re-type it to that instead of fighting the stale
      // public type.
      const cfg = rawCfg as ConfigV1.Info
      if (!cfg.experimental?.codegraph) return
      if (cfg.mcp?.codegraph) return

      const bin = resolveCodegraphBin()
      if (!bin) return

      cfg.mcp = {
        ...cfg.mcp,
        codegraph: {
          type: "local",
          command: [process.execPath, bin, "serve", "--mcp"],
          cwd: input.directory,
          enabled: true,
        },
      }
    },
  }
}
