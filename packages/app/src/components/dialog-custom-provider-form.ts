const PROVIDER_ID = /^[a-z0-9][a-z0-9-_]*$/
const OPENAI_COMPATIBLE = "@ai-sdk/openai-compatible"
const ANTHROPIC_NATIVE = "@ai-sdk/anthropic"

export type Protocol = "openai" | "anthropic"

type Translator = (key: string, vars?: Record<string, string | number | boolean>) => string

export type ModelErr = {
  id?: string
  name?: string
}

export type HeaderErr = {
  key?: string
  value?: string
}

export type ModelRow = {
  row: string
  id: string
  name: string
  err: ModelErr
}

export type HeaderRow = {
  row: string
  key: string
  value: string
  err: HeaderErr
}

export type FormState = {
  providerID: string
  name: string
  protocol: Protocol
  baseURL: string
  apiKey: string
  timeout: string
  models: ModelRow[]
  headers: HeaderRow[]
  err: {
    providerID?: string
    name?: string
    baseURL?: string
    timeout?: string
  }
}

type ValidateArgs = {
  form: FormState
  t: Translator
  disabledProviders: string[]
  existingProviderIDs: Set<string>
}

export function validateCustomProvider(input: ValidateArgs) {
  const providerID = input.form.providerID.trim()
  const name = input.form.name.trim()
  const baseURL = input.form.baseURL.trim()
  const apiKey = input.form.apiKey.trim()

  const env = apiKey.match(/^\{env:([^}]+)\}$/)?.[1]?.trim()
  const key = apiKey && !env ? apiKey : undefined

  const idError = !providerID
    ? input.t("provider.custom.error.providerID.required")
    : !PROVIDER_ID.test(providerID)
      ? input.t("provider.custom.error.providerID.format")
      : undefined

  const nameError = !name ? input.t("provider.custom.error.name.required") : undefined
  const urlError = !baseURL
    ? input.t("provider.custom.error.baseURL.required")
    : !/^https?:\/\//.test(baseURL)
      ? input.t("provider.custom.error.baseURL.format")
      : undefined

  const timeoutRaw = input.form.timeout.trim()
  const timeout = timeoutRaw ? Number(timeoutRaw) : undefined
  const timeoutError =
    timeoutRaw && (!Number.isInteger(timeout) || (timeout ?? 0) <= 0)
      ? input.t("provider.custom.error.timeout.format")
      : undefined

  const disabled = input.disabledProviders.includes(providerID)
  const existsError = idError
    ? undefined
    : input.existingProviderIDs.has(providerID) && !disabled
      ? input.t("provider.custom.error.providerID.exists")
      : undefined

  const seenModels = new Set<string>()
  const models = input.form.models.map((m) => {
    const id = m.id.trim()
    const idError = !id
      ? input.t("provider.custom.error.required")
      : seenModels.has(id)
        ? input.t("provider.custom.error.duplicate")
        : (() => {
            seenModels.add(id)
            return undefined
          })()
    const nameError = !m.name.trim() ? input.t("provider.custom.error.required") : undefined
    return { id: idError, name: nameError }
  })
  const modelsValid = models.every((m) => !m.id && !m.name)
  const modelConfig = Object.fromEntries(input.form.models.map((m) => [m.id.trim(), { name: m.name.trim() }]))

  const seenHeaders = new Set<string>()
  const headers = input.form.headers.map((h) => {
    const key = h.key.trim()
    const value = h.value.trim()

    if (!key && !value) return {}
    const keyError = !key
      ? input.t("provider.custom.error.required")
      : seenHeaders.has(key.toLowerCase())
        ? input.t("provider.custom.error.duplicate")
        : (() => {
            seenHeaders.add(key.toLowerCase())
            return undefined
          })()
    const valueError = !value ? input.t("provider.custom.error.required") : undefined
    return { key: keyError, value: valueError }
  })
  const headersValid = headers.every((h) => !h.key && !h.value)
  const headerConfig = Object.fromEntries(
    input.form.headers
      .map((h) => ({ key: h.key.trim(), value: h.value.trim() }))
      .filter((h) => !!h.key && !!h.value)
      .map((h) => [h.key, h.value]),
  )

  const err = {
    providerID: idError ?? existsError,
    name: nameError,
    baseURL: urlError,
    timeout: timeoutError,
  }

  const ok = !idError && !existsError && !nameError && !urlError && !timeoutError && modelsValid && headersValid
  if (!ok) return { err, models, headers }

  // @ai-sdk/anthropic appends `/messages` directly to baseURL — it does not add
  // `/v1` itself (unlike the OpenAI-compatible SDK, which expects a bare host).
  // Corporate gateways are commonly entered as just the host, which then 404s
  // at `/messages` with no way to tell why; normalize it here instead.
  const normalizedBaseURL =
    input.form.protocol === "anthropic" && !/\/v1\/?$/.test(baseURL) ? `${baseURL.replace(/\/+$/, "")}/v1` : baseURL

  return {
    err,
    models,
    headers,
    result: {
      providerID,
      name,
      key,
      config: {
        npm: input.form.protocol === "anthropic" ? ANTHROPIC_NATIVE : OPENAI_COMPATIBLE,
        name,
        ...(env ? { env: [env] } : {}),
        options: {
          baseURL: normalizedBaseURL,
          ...(timeout ? { headerTimeout: timeout } : {}),
          ...(Object.keys(headerConfig).length ? { headers: headerConfig } : {}),
        },
        models: modelConfig,
      },
    },
  }
}

let row = 0

const nextRow = () => `row-${row++}`

export const modelRow = (init?: { id?: string; name?: string }): ModelRow => ({
  row: nextRow(),
  id: init?.id ?? "",
  name: init?.name ?? "",
  err: {},
})
export const headerRow = (init?: { key?: string; value?: string }): HeaderRow => ({
  row: nextRow(),
  key: init?.key ?? "",
  value: init?.value ?? "",
  err: {},
})

export type ExistingCustomProviderConfig = {
  name?: string
  npm?: string
  env?: readonly string[]
  options?: { baseURL?: string; headerTimeout?: number | false; headers?: Record<string, string> }
  models?: Record<string, { name?: string }>
}

export function formStateFromExistingProvider(providerID: string, config: ExistingCustomProviderConfig): FormState {
  const models = Object.entries(config.models ?? {}).map(([id, m]) => modelRow({ id, name: m.name ?? id }))
  const headers = Object.entries(config.options?.headers ?? {}).map(([key, value]) => headerRow({ key, value }))
  return {
    providerID,
    name: config.name ?? providerID,
    protocol: config.npm === ANTHROPIC_NATIVE ? "anthropic" : "openai",
    baseURL: config.options?.baseURL ?? "",
    apiKey: config.env?.[0] ? `{env:${config.env[0]}}` : "",
    timeout:
      typeof config.options?.headerTimeout === "number" ? String(config.options.headerTimeout) : "",
    models: models.length ? models : [modelRow()],
    headers: headers.length ? headers : [headerRow()],
    err: {},
  }
}
