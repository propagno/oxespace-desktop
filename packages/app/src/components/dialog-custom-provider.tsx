import { Button } from "@opencode-ai/ui/button"
import { Collapsible } from "@opencode-ai/ui/collapsible"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { Dialog } from "@opencode-ai/ui/dialog"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { RadioGroup } from "@opencode-ai/ui/radio-group"
import { useMutation } from "@tanstack/solid-query"
import { TextField } from "@opencode-ai/ui/text-field"
import { showToast } from "@/utils/toast"
import { batch, For } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { Link } from "@/components/link"
import { useServerSDK } from "@/context/server-sdk"
import { useServerSync } from "@/context/server-sync"
import { useLanguage } from "@/context/language"
import {
  formStateFromExistingProvider,
  headerRow,
  modelRow,
  validateCustomProvider,
  type FormState,
} from "./dialog-custom-provider-form"

type Props = {
  onBack: () => void
  editingProviderID?: string
}

export function DialogCustomProvider(props: Props) {
  const language = useLanguage()

  return (
    <Dialog
      class="h-full"
      title={
        <IconButton
          tabIndex={-1}
          icon="arrow-left"
          variant="ghost"
          onClick={props.onBack}
          aria-label={language.t("common.goBack")}
        />
      }
      transition
    >
      <CustomProviderForm editingProviderID={props.editingProviderID} />
    </Dialog>
  )
}

export function CustomProviderForm(props: { editingProviderID?: string } = {}) {
  const dialog = useDialog()
  const serverSync = useServerSync()
  const serverSDK = useServerSDK()
  const language = useLanguage()
  const editingProviderID = props.editingProviderID

  const [form, setForm] = createStore<FormState>(
    editingProviderID
      ? formStateFromExistingProvider(
          editingProviderID,
          serverSync().data.config.provider?.[editingProviderID] ?? {},
        )
      : {
          providerID: "",
          name: "",
          protocol: "openai",
          baseURL: "",
          apiKey: "",
          timeout: "",
          models: [modelRow()],
          headers: [headerRow()],
          err: {},
        },
  )

  const protocolLabel = (protocol: FormState["protocol"]) =>
    protocol === "anthropic"
      ? language.t("provider.custom.field.protocol.option.anthropic")
      : language.t("provider.custom.field.protocol.option.openai")

  const addModel = () => {
    setForm(
      "models",
      produce((rows) => {
        rows.push(modelRow())
      }),
    )
  }

  const removeModel = (index: number) => {
    if (form.models.length <= 1) return
    setForm(
      "models",
      produce((rows) => {
        rows.splice(index, 1)
      }),
    )
  }

  const addHeader = () => {
    setForm(
      "headers",
      produce((rows) => {
        rows.push(headerRow())
      }),
    )
  }

  const removeHeader = (index: number) => {
    if (form.headers.length <= 1) return
    setForm(
      "headers",
      produce((rows) => {
        rows.splice(index, 1)
      }),
    )
  }

  const setField = (key: "providerID" | "name" | "baseURL" | "apiKey" | "timeout", value: string) => {
    setForm(key, value)
    if (key === "apiKey") return
    setForm("err", key, undefined)
  }

  const setProtocol = (protocol: FormState["protocol"] | undefined) => {
    if (!protocol) return
    setForm("protocol", protocol)
  }

  const setModel = (index: number, key: "id" | "name", value: string) => {
    batch(() => {
      setForm("models", index, key, value)
      setForm("models", index, "err", key, undefined)
    })
  }

  const setHeader = (index: number, key: "key" | "value", value: string) => {
    batch(() => {
      setForm("headers", index, key, value)
      setForm("headers", index, "err", key, undefined)
    })
  }

  const validate = () => {
    const output = validateCustomProvider({
      form,
      t: language.t,
      disabledProviders: serverSync().data.config.disabled_providers ?? [],
      existingProviderIDs: new Set(
        [...serverSync().data.provider.all.keys()].filter((id) => id !== editingProviderID),
      ),
    })
    batch(() => {
      setForm("err", output.err)
      output.models.forEach((err, index) => setForm("models", index, "err", err))
      output.headers.forEach((err, index) => setForm("headers", index, "err", err))
    })
    return output.result
  }

  const saveMutation = useMutation(() => ({
    mutationFn: async (result: NonNullable<ReturnType<typeof validate>>) => {
      const disabledProviders = serverSync().data.config.disabled_providers ?? []
      const nextDisabled = disabledProviders.filter((id) => id !== result.providerID)

      if (result.key) {
        await serverSDK().client.auth.set({
          providerID: result.providerID,
          auth: {
            type: "api",
            key: result.key,
          },
        })
      }

      await serverSync().updateConfig({
        provider: { [result.providerID]: result.config },
        disabled_providers: nextDisabled,
      })
      return result
    },
    onSuccess: (result) => {
      dialog.close()
      showToast({
        variant: "success",
        icon: "circle-check",
        title: language.t("provider.connect.toast.connected.title", { provider: result.name }),
        description: language.t("provider.connect.toast.connected.description", { provider: result.name }),
      })
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ title: language.t("common.requestFailed"), description: message })
    },
  }))

  const save = (e: SubmitEvent) => {
    e.preventDefault()
    if (saveMutation.isPending) return

    const result = validate()
    if (!result) return
    saveMutation.mutate(result)
  }

  return (
    <div class="flex flex-col gap-6 px-2.5 pb-3 overflow-y-auto max-h-[60vh]">
      <div class="px-2.5 flex gap-4 items-center">
        <ProviderIcon id="synthetic" class="size-5 shrink-0 icon-strong-base" />
        <div class="text-16-medium text-text-strong">
          {editingProviderID ? language.t("provider.custom.title.edit") : language.t("provider.custom.title")}
        </div>
      </div>

      <form onSubmit={save} class="px-2.5 pb-6 flex flex-col gap-6">
        <p class="text-14-regular text-text-base">
          {language.t("provider.custom.description.prefix")}
          <Link href="https://opencode.ai/docs/providers/#custom-provider" tabIndex={-1}>
            {language.t("provider.custom.description.link")}
          </Link>
          {language.t("provider.custom.description.suffix")}
        </p>

        <div class="flex flex-col gap-4">
          <TextField
            autofocus={!editingProviderID}
            disabled={!!editingProviderID}
            label={language.t("provider.custom.field.providerID.label")}
            placeholder={language.t("provider.custom.field.providerID.placeholder")}
            description={language.t("provider.custom.field.providerID.description")}
            value={form.providerID}
            onChange={(v) => setField("providerID", v)}
            validationState={form.err.providerID ? "invalid" : undefined}
            error={form.err.providerID}
          />
          <TextField
            label={language.t("provider.custom.field.name.label")}
            placeholder={language.t("provider.custom.field.name.placeholder")}
            value={form.name}
            onChange={(v) => setField("name", v)}
            validationState={form.err.name ? "invalid" : undefined}
            error={form.err.name}
          />
          <div class="flex flex-col gap-1.5">
            <label class="text-12-medium text-text-weak">{language.t("provider.custom.field.protocol.label")}</label>
            <RadioGroup
              options={["openai", "anthropic"] as const}
              current={form.protocol}
              label={protocolLabel}
              onSelect={setProtocol}
              size="small"
            />
            <p class="text-12-regular text-text-weak">
              {language.t("provider.custom.field.protocol.description")}
            </p>
          </div>
          <TextField
            label={language.t("provider.custom.field.baseURL.label")}
            placeholder={language.t("provider.custom.field.baseURL.placeholder")}
            value={form.baseURL}
            onChange={(v) => setField("baseURL", v)}
            validationState={form.err.baseURL ? "invalid" : undefined}
            error={form.err.baseURL}
          />
          <TextField
            label={language.t("provider.custom.field.apiKey.label")}
            placeholder={language.t("provider.custom.field.apiKey.placeholder")}
            description={
              editingProviderID
                ? language.t("provider.custom.field.apiKey.description.edit")
                : language.t("provider.custom.field.apiKey.description")
            }
            value={form.apiKey}
            onChange={(v) => setField("apiKey", v)}
          />
          <TextField
            label={language.t("provider.custom.field.timeout.label")}
            placeholder={language.t("provider.custom.field.timeout.placeholder")}
            description={language.t("provider.custom.field.timeout.description")}
            value={form.timeout}
            onChange={(v) => setField("timeout", v)}
            validationState={form.err.timeout ? "invalid" : undefined}
            error={form.err.timeout}
          />
        </div>

        <div class="flex flex-col gap-3">
          <label class="text-12-medium text-text-weak">{language.t("provider.custom.models.label")}</label>
          <For each={form.models}>
            {(m, i) => (
              <div class="flex gap-2 items-start" data-row={m.row}>
                <div class="flex-1">
                  <TextField
                    label={language.t("provider.custom.models.id.label")}
                    hideLabel
                    placeholder={language.t("provider.custom.models.id.placeholder")}
                    value={m.id}
                    onChange={(v) => setModel(i(), "id", v)}
                    validationState={m.err.id ? "invalid" : undefined}
                    error={m.err.id}
                  />
                </div>
                <div class="flex-1">
                  <TextField
                    label={language.t("provider.custom.models.name.label")}
                    hideLabel
                    placeholder={language.t("provider.custom.models.name.placeholder")}
                    value={m.name}
                    onChange={(v) => setModel(i(), "name", v)}
                    validationState={m.err.name ? "invalid" : undefined}
                    error={m.err.name}
                  />
                </div>
                <IconButton
                  type="button"
                  icon="trash"
                  variant="ghost"
                  class="mt-1.5"
                  onClick={() => removeModel(i())}
                  disabled={form.models.length <= 1}
                  aria-label={language.t("provider.custom.models.remove")}
                />
              </div>
            )}
          </For>
          <Button type="button" size="small" variant="ghost" icon="plus-small" onClick={addModel} class="self-start">
            {language.t("provider.custom.models.add")}
          </Button>
        </div>

        <Collapsible variant="ghost">
          <Collapsible.Trigger class="flex items-center gap-1.5 text-12-medium text-text-weak w-fit">
            <Collapsible.Arrow />
            {language.t("provider.custom.advanced.label")}
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div class="flex flex-col gap-3 pt-3">
              <label class="text-12-medium text-text-weak">{language.t("provider.custom.headers.label")}</label>
              <For each={form.headers}>
                {(h, i) => (
                  <div class="flex gap-2 items-start" data-row={h.row}>
                    <div class="flex-1">
                      <TextField
                        label={language.t("provider.custom.headers.key.label")}
                        hideLabel
                        placeholder={language.t("provider.custom.headers.key.placeholder")}
                        value={h.key}
                        onChange={(v) => setHeader(i(), "key", v)}
                        validationState={h.err.key ? "invalid" : undefined}
                        error={h.err.key}
                      />
                    </div>
                    <div class="flex-1">
                      <TextField
                        label={language.t("provider.custom.headers.value.label")}
                        hideLabel
                        placeholder={language.t("provider.custom.headers.value.placeholder")}
                        value={h.value}
                        onChange={(v) => setHeader(i(), "value", v)}
                        validationState={h.err.value ? "invalid" : undefined}
                        error={h.err.value}
                      />
                    </div>
                    <IconButton
                      type="button"
                      icon="trash"
                      variant="ghost"
                      class="mt-1.5"
                      onClick={() => removeHeader(i())}
                      disabled={form.headers.length <= 1}
                      aria-label={language.t("provider.custom.headers.remove")}
                    />
                  </div>
                )}
              </For>
              <Button
                type="button"
                size="small"
                variant="ghost"
                icon="plus-small"
                onClick={addHeader}
                class="self-start"
              >
                {language.t("provider.custom.headers.add")}
              </Button>
            </div>
          </Collapsible.Content>
        </Collapsible>

        <Button
          class="w-auto self-start"
          type="submit"
          size="large"
          variant="primary"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? language.t("common.saving") : language.t("common.submit")}
        </Button>
      </form>
    </div>
  )
}
