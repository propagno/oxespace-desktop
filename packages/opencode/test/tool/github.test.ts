import { describe, expect, test } from "bun:test"
import { buildArgs, titleFor } from "@/tool/github"

describe("github tool", () => {
  test("pr_list defaults to open with a limit", () => {
    expect(buildArgs({ action: "pr_list" })).toEqual([
      "pr",
      "list",
      "--json",
      "number,title,state,url,author,createdAt",
      "--limit",
      "30",
    ])
  })

  test("pr_list forwards a non-default state", () => {
    expect(buildArgs({ action: "pr_list", state: "closed", limit: 5 })).toEqual([
      "pr",
      "list",
      "--json",
      "number,title,state,url,author,createdAt",
      "--limit",
      "5",
      "--state",
      "closed",
    ])
  })

  test("pr_view targets a specific number", () => {
    expect(buildArgs({ action: "pr_view", number: 42 })).toEqual([
      "pr",
      "view",
      "42",
      "--json",
      "number,title,body,state,url,author,createdAt,comments",
    ])
  })

  test("pr_create includes base and draft when given", () => {
    expect(
      buildArgs({ action: "pr_create", title: "Fix bug", body: "Details", base: "main", draft: true }),
    ).toEqual(["pr", "create", "--title", "Fix bug", "--body", "Details", "--base", "main", "--draft"])
  })

  test("pr_comment posts to a specific number", () => {
    expect(buildArgs({ action: "pr_comment", number: 7, body: "lgtm" })).toEqual([
      "pr",
      "comment",
      "7",
      "--body",
      "lgtm",
    ])
  })

  test("issue_create defaults body to an empty string", () => {
    expect(buildArgs({ action: "issue_create", title: "Bug report" })).toEqual([
      "issue",
      "create",
      "--title",
      "Bug report",
      "--body",
      "",
    ])
  })

  test("release_list uses the expected json fields", () => {
    expect(buildArgs({ action: "release_list" })).toEqual([
      "release",
      "list",
      "--json",
      "tagName,name,publishedAt,isDraft,isPrerelease",
      "--limit",
      "30",
    ])
  })

  test("titleFor produces a human-readable summary per action", () => {
    expect(titleFor({ action: "pr_view", number: 12 })).toBe("View PR #12")
    expect(titleFor({ action: "issue_create", title: "Bug report" })).toBe("Create issue: Bug report")
    expect(titleFor({ action: "release_list" })).toBe("List releases")
  })
})
