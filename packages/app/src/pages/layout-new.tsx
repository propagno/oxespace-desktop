import { createEffect, Suspense, Show, For, createMemo, type ParentProps } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { DebugBar } from "@/components/debug-bar"
import { Titlebar, type TitlebarUpdate } from "@/components/titlebar"
import { usePlatform } from "@/context/platform"
import { setNavigate } from "@/utils/notification-click"
import { setV2Toast, ToastRegion } from "@/utils/toast"
import { Icon as IconV2 } from "@opencode-ai/ui/v2/icon"
import { useTabs } from "@/context/tabs"
import { useLayout } from "@/context/layout"
import { useServer } from "@/context/server"
import { useCommand, type CommandOption } from "@/context/command"
import { useLanguage } from "@/context/language"
import { useServerSync } from "@/context/server-sync"
import { useServerSDK } from "@/context/server-sdk"
import { sortedRootSessions } from "@/pages/layout/helpers"
import { Session } from "@opencode-ai/sdk/v2/client"
import { createStore, produce } from "solid-js/store"
import { Binary } from "@opencode-ai/core/util/binary"

export default function NewLayout(props: ParentProps) {
  const platform = usePlatform()
  const navigate = useNavigate()
  setNavigate(navigate)
  const tabs = useTabs()
  const layout = useLayout()
  const command = useCommand()
  const language = useLanguage()
  const serverSync = useServerSync()
  const serverSDK = useServerSDK()
  const server = useServer()
  const [collapsedProjects, setCollapsedProjects] = createStore<Record<string, boolean>>({})

  async function archiveSession(session: Session) {
    const [store, setStore] = serverSync().child(session.directory)
    await serverSDK().client.session.update({
      directory: session.directory,
      sessionID: session.id,
      time: { archived: Date.now() },
    })
    setStore(
      produce((draft) => {
        const match = Binary.search(draft.session, session.id, (s) => s.id)
        if (match.found) draft.session.splice(match.index, 1)
      }),
    )
    const route = layout.route()
    if (route.type === "session" && route.sessionId === session.id) {
      navigate("/")
    }
  }

  createEffect(() => setV2Toast(true))

  command.register("layout-new", () => {
    const commands: CommandOption[] = [
      {
        id: "sidebar.toggle",
        title: language.t("command.sidebar.toggle"),
        category: language.t("command.category.view"),
        keybind: "mod+b",
        onSelect: () => layout.sidebar.toggle(),
      },
    ]
    return commands
  })

  const update: TitlebarUpdate = {
    version: () => {
      const state = platform.updater?.state()
      if (state?.status !== "ready") return
      return state.version
    },
    installing: () => platform.updater?.state().status === "installing",
    install: () => void platform.updater?.install(),
  }

  const getFilename = (path: string) => path.split(/[/\\]/).pop() || path

  const handleNewChat = () => {
    try {
      const list = layout.projects.list()
      const current = list[0]
      if (current) {
        tabs.newDraft({ server: server.key, directory: current.worktree }, "")
      } else {
        tabs.newDraft({ server: server.key, directory: "" }, "")
      }
    } catch (e) {
      console.error("Error in handleNewChat", e)
    }
  }

  return (
    <div
      class="relative bg-v2-background-bg-deep flex-1 min-h-0 min-w-0 flex flex-col select-none [&_input]:select-text [&_textarea]:select-text [&_[contenteditable]]:select-text"
      style={{
        "padding-top": "env(safe-area-inset-top, 0px)",
        "padding-bottom": "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <Titlebar update={update} />
      <main class="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-row items-stretch">
        {/* Codex Sidebar Panel */}
        <Show when={layout.sidebar.opened()}>
          <div class="w-64 shrink-0 bg-background-base border-r border-border-weaker-base flex flex-col min-h-0 min-w-0 box-border px-3 py-4">
            {/* Codex Shortcuts Header */}
            <div class="flex flex-col gap-1 mb-4 shrink-0 select-none">
              {/* Novo Chat Button */}
              <button
                type="button"
                class="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-v2-background-bg-deep text-text-strong hover:bg-[#12C79A]/10 hover:text-[#12C79A] ring-1 ring-border-weak-base/10 hover:ring-[#12C79A]/30 transition-all font-medium text-[13.5px] cursor-pointer mb-2"
                onClick={handleNewChat}
              >
                <div class="flex items-center gap-2">
                  <IconV2 name="edit" class="size-4" />
                  <span>Novo chat</span>
                </div>
                <span class="text-[10px] bg-background-base/60 px-1.5 py-0.5 rounded text-text-muted font-normal">
                  Ctrl+N
                </span>
              </button>
            </div>

            <div class="h-px bg-border-weaker-base/20 mb-4 shrink-0" />

            {/* Projetos Label */}
            <div class="text-[11px] uppercase tracking-wider text-text-muted font-bold px-2 py-1 select-none mb-1 shrink-0">
              Projetos
            </div>

            {/* Projects Unified Vertical List */}
            <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-4">
              <For each={layout.projects.list()}>
                {(projectItem) => {
                  const projectName = () => getFilename(projectItem.worktree)
                  
                  // Sessions calculation to display 'Nenhum chat'
                  const projectSessions = createMemo(() => {
                    try {
                      const sync = serverSync()
                      if (!sync) return []
                      const dirs = [projectItem.worktree, ...(projectItem.sandboxes ?? [])]
                      const now = Date.now()
                      const result: Session[] = []
                      for (const dir of dirs) {
                        const res = sync.child(dir, { bootstrap: true })
                        if (!res) continue
                        const dirStore = res[0]
                        if (!dirStore) continue
                        const dirSessions = sortedRootSessions(dirStore, now)
                        if (dirSessions) result.push(...dirSessions)
                      }
                      return result
                    } catch (e) {
                      return []
                    }
                  })

                  const collapsed = () => !!collapsedProjects[projectItem.worktree]

                  return (
                    <div class="flex flex-col min-w-0">
                      {/* Project Header Item */}
                      <button
                        type="button"
                        class="group/project flex items-center justify-between gap-2 py-1 pl-2 pr-0 select-none cursor-pointer text-left"
                        onClick={() => setCollapsedProjects(projectItem.worktree, (v) => !v)}
                        aria-expanded={!collapsed()}
                      >
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                          <IconV2 name="database" class="size-4 shrink-0 text-[#12C79A]" />
                          <span class="text-[13.5px] font-semibold text-text-strong truncate">
                            {projectName()}
                          </span>
                        </div>
                        <IconV2
                          name="chevron-down"
                          class="size-3.5 shrink-0 text-text-muted transition-transform"
                          style={{ transform: collapsed() ? "rotate(-90deg)" : "rotate(0deg)" }}
                        />
                      </button>

                      {/* Chats List or "Nenhum chat" */}
                      <Show when={!collapsed()}>
                      <div class="pl-2 flex flex-col gap-1 border-l border-border-weaker-base/20 ml-3.5 mt-1 select-none">
                        <Show
                          when={projectSessions().length > 0}
                          fallback={
                            <div class="text-[12px] text-text-muted italic pl-6 py-0.5 select-none">
                              Nenhum chat
                            </div>
                          }
                        >
                          <For each={projectSessions()}>
                            {(sessionItem) => {
                              const active = () => {
                                const r = layout.route()
                                return r.type === "session" && r.sessionId === sessionItem.id
                              }

                              return (
                                <div
                                  class="group relative flex items-center justify-between rounded-md pl-2 pr-1.5 py-1.5 cursor-pointer text-[13px] font-medium transition-colors select-none"
                                  classList={{
                                    "bg-background-stronger text-text-strong border-l-2 border-[#12C79A]": active(),
                                    "text-text-base hover:bg-background-stronger hover:text-text-strong": !active(),
                                  }}
                                  onClick={() => {
                                    tabs.select({ type: "session", sessionId: sessionItem.id, server: server.key })
                                  }}
                                >
                                  <div class="flex items-center gap-2 min-w-0 flex-1">
                                    <IconV2 name="branch" class="size-4 shrink-0 text-[#a855f7]" />
                                    <span class="truncate pr-4">
                                      {sessionItem.title || "Sessão"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    class="opacity-0 group-hover:opacity-100 hover:bg-background-base p-0.5 rounded transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      void archiveSession(sessionItem)
                                    }}
                                  >
                                    <IconV2 name="xmark-small" class="size-3.5" />
                                  </button>
                                </div>
                              )
                            }}
                          </For>
                        </Show>
                      </div>
                      </Show>
                    </div>
                  )
                }}
              </For>
            </div>
          </div>
        </Show>

        <div class="flex-1 min-w-0 min-h-0 flex flex-col items-start relative size-full">
          <Suspense>{props.children}</Suspense>
        </div>
      </main>
      {import.meta.env.DEV && <DebugBar inline />}
      <ToastRegion v2 />
    </div>
  )
}
