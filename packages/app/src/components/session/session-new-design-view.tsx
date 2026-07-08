import type { JSX } from "solid-js"
import { WordmarkV2 } from "@opencode-ai/ui/v2/wordmark-v2"
import { NEW_SESSION_CONTENT_WIDTH } from "@/pages/session/new-session-layout"

export function NewSessionDesignView(props: { children: JSX.Element }) {
  return (
    <div data-component="session-new-design" class="relative size-full overflow-hidden bg-v2-background-bg-deep">
      {/* Ambient background glows */}
      <div class="absolute -top-[30%] left-[50%] -translate-x-[50%] w-[600px] h-[600px] rounded-full bg-[#12C79A] opacity-[0.08] blur-[110px] pointer-events-none" />
      <div class="absolute -bottom-[35%] left-[15%] w-[700px] h-[700px] rounded-full bg-[#38BDF8] opacity-[0.06] blur-[140px] pointer-events-none" />
      
      <div class="absolute inset-x-0 top-[25.375%] flex justify-center px-6">
        <div class={NEW_SESSION_CONTENT_WIDTH}>
          <WordmarkV2 class="h-auto w-full text-v2-icon-icon-base" />
          <div class="mt-8">{props.children}</div>
        </div>
      </div>
    </div>
  )
}

