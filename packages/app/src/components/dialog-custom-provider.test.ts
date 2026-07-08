import { describe, expect, test } from "bun:test"
import { validateCustomProvider } from "./dialog-custom-provider-form"

const t = (key: string) => key

describe("validateCustomProvider", () => {
  test("builds trimmed config payload", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "custom-provider",
        name: " Custom Provider ",
        protocol: "openai",
        baseURL: "https://api.example.com ",
        apiKey: " {env: CUSTOM_PROVIDER_KEY} ",
        timeout: "",
        models: [{ row: "m0", id: " model-a ", name: " Model A ", contextLimit: "", err: {} }],
        headers: [
          { row: "h0", key: " X-Test ", value: " enabled ", err: {} },
          { row: "h1", key: "", value: "", err: {} },
        ],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    expect(result.result).toEqual({
      providerID: "custom-provider",
      name: "Custom Provider",
      key: undefined,
      config: {
        npm: "@ai-sdk/openai-compatible",
        name: "Custom Provider",
        env: ["CUSTOM_PROVIDER_KEY"],
        options: {
          baseURL: "https://api.example.com",
          headers: {
            "X-Test": "enabled",
          },
        },
        models: {
          "model-a": { name: "Model A" },
        },
      },
    })
  })

  test("flags duplicate rows and allows reconnecting disabled providers", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "custom-provider",
        name: "Provider",
        protocol: "openai",
        baseURL: "https://api.example.com",
        apiKey: "secret",
        timeout: "",
        models: [
          { row: "m0", id: "model-a", name: "Model A", contextLimit: "", err: {} },
          { row: "m1", id: "model-a", name: "Model A 2", contextLimit: "", err: {} },
        ],
        headers: [
          { row: "h0", key: "Authorization", value: "one", err: {} },
          { row: "h1", key: "authorization", value: "two", err: {} },
        ],
        err: {},
      },
      t,
      disabledProviders: ["custom-provider"],
      existingProviderIDs: new Set(["custom-provider"]),
    })

    expect(result.result).toBeUndefined()
    expect(result.err.providerID).toBeUndefined()
    expect(result.models[1]).toEqual({
      id: "provider.custom.error.duplicate",
      name: undefined,
      contextLimit: undefined,
    })
    expect(result.headers[1]).toEqual({
      key: "provider.custom.error.duplicate",
      value: undefined,
    })
  })

  test("uses the anthropic-native sdk factory when protocol is anthropic", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "corp-gateway",
        name: "Corp Gateway",
        protocol: "anthropic",
        baseURL: "https://llm-proxy.corp.internal",
        apiKey: "secret",
        timeout: "600000",
        models: [{ row: "m0", id: "gpt-5-5", name: "GPT-5.5 via gateway", contextLimit: "", err: {} }],
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    expect(result.result?.config.npm).toBe("@ai-sdk/anthropic")
    expect(result.result?.config.options.headerTimeout).toBe(600000)
  })

  test("appends /v1 to an anthropic baseURL missing it", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "corp-gateway",
        name: "Corp Gateway",
        protocol: "anthropic",
        baseURL: "https://llm-proxy.corp.internal/",
        apiKey: "secret",
        timeout: "",
        models: [{ row: "m0", id: "gpt-5-5", name: "GPT-5.5 via gateway", contextLimit: "", err: {} }],
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    expect(result.result?.config.options.baseURL).toBe("https://llm-proxy.corp.internal/v1")
  })

  test("leaves an anthropic baseURL that already ends in /v1 unchanged", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "corp-gateway",
        name: "Corp Gateway",
        protocol: "anthropic",
        baseURL: "https://llm-proxy.corp.internal/v1",
        apiKey: "secret",
        timeout: "",
        models: [{ row: "m0", id: "gpt-5-5", name: "GPT-5.5 via gateway", contextLimit: "", err: {} }],
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    expect(result.result?.config.options.baseURL).toBe("https://llm-proxy.corp.internal/v1")
  })

  test("rejects a non-numeric timeout", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "corp-gateway",
        name: "Corp Gateway",
        protocol: "anthropic",
        baseURL: "https://llm-proxy.corp.internal",
        apiKey: "secret",
        timeout: "not-a-number",
        models: [{ row: "m0", id: "gpt-5-5", name: "GPT-5.5 via gateway", contextLimit: "", err: {} }],
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    expect(result.result).toBeUndefined()
    expect(result.err.timeout).toBe("provider.custom.error.timeout.format")
  })

  test("sets the model context limit when provided", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "corp-gateway",
        name: "Corp Gateway",
        protocol: "openai",
        baseURL: "https://api.example.com",
        apiKey: "secret",
        timeout: "",
        models: [{ row: "m0", id: "gpt-5-5", name: "GPT-5.5", contextLimit: "200000", err: {} }],
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    expect(result.result?.config.models).toEqual({
      "gpt-5-5": { name: "GPT-5.5", limit: { context: 200000, output: 200000 } },
    })
  })

  test("rejects a non-numeric context limit", () => {
    const result = validateCustomProvider({
      form: {
        providerID: "corp-gateway",
        name: "Corp Gateway",
        protocol: "openai",
        baseURL: "https://api.example.com",
        apiKey: "secret",
        timeout: "",
        models: [{ row: "m0", id: "gpt-5-5", name: "GPT-5.5", contextLimit: "not-a-number", err: {} }],
        headers: [{ row: "h0", key: "", value: "", err: {} }],
        err: {},
      },
      t,
      disabledProviders: [],
      existingProviderIDs: new Set(),
    })

    expect(result.result).toBeUndefined()
    expect(result.models[0].contextLimit).toBe("provider.custom.error.contextLimit.format")
  })
})
