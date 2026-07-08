import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { InstanceState } from "@/effect/instance-state"
import { Process } from "@/util/process"
import DESCRIPTION from "./github.txt"

const State = Schema.Literals(["open", "closed", "merged", "all"])

const PrList = Schema.Struct({
  action: Schema.Literal("pr_list"),
  state: Schema.optional(State).annotate({ description: "Filter by state. Defaults to open." }),
  limit: Schema.optional(Schema.Number).annotate({ description: "Max results. Defaults to 30." }),
})
const PrView = Schema.Struct({
  action: Schema.Literal("pr_view"),
  number: Schema.Number.annotate({ description: "The pull request number" }),
})
const PrCreate = Schema.Struct({
  action: Schema.Literal("pr_create"),
  title: Schema.String,
  body: Schema.optional(Schema.String),
  base: Schema.optional(Schema.String).annotate({ description: "Base branch. Defaults to the repo's default branch." }),
  draft: Schema.optional(Schema.Boolean),
})
const PrComment = Schema.Struct({
  action: Schema.Literal("pr_comment"),
  number: Schema.Number.annotate({ description: "The pull request number" }),
  body: Schema.String,
})
const IssueList = Schema.Struct({
  action: Schema.Literal("issue_list"),
  state: Schema.optional(State).annotate({ description: "Filter by state. Defaults to open." }),
  limit: Schema.optional(Schema.Number).annotate({ description: "Max results. Defaults to 30." }),
})
const IssueView = Schema.Struct({
  action: Schema.Literal("issue_view"),
  number: Schema.Number.annotate({ description: "The issue number" }),
})
const IssueCreate = Schema.Struct({
  action: Schema.Literal("issue_create"),
  title: Schema.String,
  body: Schema.optional(Schema.String),
})
const IssueComment = Schema.Struct({
  action: Schema.Literal("issue_comment"),
  number: Schema.Number.annotate({ description: "The issue number" }),
  body: Schema.String,
})
const ReleaseList = Schema.Struct({
  action: Schema.Literal("release_list"),
  limit: Schema.optional(Schema.Number).annotate({ description: "Max results. Defaults to 30." }),
})

export const Parameters = Schema.Union([
  PrList,
  PrView,
  PrCreate,
  PrComment,
  IssueList,
  IssueView,
  IssueCreate,
  IssueComment,
  ReleaseList,
]).annotate({ identifier: "GithubToolParameters" })

type Params = Schema.Schema.Type<typeof Parameters>

const MUTATING_ACTIONS = new Set(["pr_create", "pr_comment", "issue_create", "issue_comment"])

async function gh(args: string[], cwd: string) {
  const result = await Process.text(["gh", ...args], { cwd, nothrow: true })
  if (result.code !== 0) {
    const message = result.stderr.toString().trim() || result.stdout.toString().trim() || `gh exited with code ${result.code}`
    throw new Error(
      message.includes("not found") || message.toLowerCase().includes("command not found")
        ? "The `gh` CLI was not found. Install it from https://cli.github.com and run `gh auth login`."
        : `gh failed: ${message}`,
    )
  }
  return result.text.trim()
}

export function buildArgs(params: Params): string[] {
  switch (params.action) {
    case "pr_list":
      return [
        "pr",
        "list",
        "--json",
        "number,title,state,url,author,createdAt",
        "--limit",
        String(params.limit ?? 30),
        ...(params.state && params.state !== "open" ? ["--state", params.state] : []),
      ]
    case "pr_view":
      return ["pr", "view", String(params.number), "--json", "number,title,body,state,url,author,createdAt,comments"]
    case "pr_create":
      return [
        "pr",
        "create",
        "--title",
        params.title,
        "--body",
        params.body ?? "",
        ...(params.base ? ["--base", params.base] : []),
        ...(params.draft ? ["--draft"] : []),
      ]
    case "pr_comment":
      return ["pr", "comment", String(params.number), "--body", params.body]
    case "issue_list":
      return [
        "issue",
        "list",
        "--json",
        "number,title,state,url,author,createdAt",
        "--limit",
        String(params.limit ?? 30),
        ...(params.state && params.state !== "open" ? ["--state", params.state] : []),
      ]
    case "issue_view":
      return ["issue", "view", String(params.number), "--json", "number,title,body,state,url,author,createdAt,comments"]
    case "issue_create":
      return ["issue", "create", "--title", params.title, "--body", params.body ?? ""]
    case "issue_comment":
      return ["issue", "comment", String(params.number), "--body", params.body]
    case "release_list":
      return ["release", "list", "--json", "tagName,name,publishedAt,isDraft,isPrerelease", "--limit", String(params.limit ?? 30)]
  }
}

export function titleFor(params: Params): string {
  switch (params.action) {
    case "pr_list":
      return "List pull requests"
    case "pr_view":
      return `View PR #${params.number}`
    case "pr_create":
      return `Create PR: ${params.title}`
    case "pr_comment":
      return `Comment on PR #${params.number}`
    case "issue_list":
      return "List issues"
    case "issue_view":
      return `View issue #${params.number}`
    case "issue_create":
      return `Create issue: ${params.title}`
    case "issue_comment":
      return `Comment on issue #${params.number}`
    case "release_list":
      return "List releases"
  }
}

export const GithubTool = Tool.define(
  "github",
  Effect.gen(function* () {
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Params, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const instanceCtx = yield* InstanceState.context

          if (MUTATING_ACTIONS.has(params.action)) {
            yield* ctx.ask({
              permission: "github",
              patterns: [params.action],
              always: [params.action],
              metadata: { action: params.action },
            })
          }

          const output = yield* Effect.promise(() => gh(buildArgs(params), instanceCtx.directory))

          return {
            title: titleFor(params),
            output,
            metadata: {},
          }
        }).pipe(Effect.orDie),
    }
  }),
)
