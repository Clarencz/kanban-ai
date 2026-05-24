// Source: https://github.com/mnfst/awesome-free-llm-apis
// Single source of truth for provider metadata. Shared by client (form, model
// dropdowns) and server (validation, baseUrl lookup, llm dispatch).

export type ProviderKind = "company" | "inference";

export type ProviderAuth =
  | { type: "api_key" }
  | { type: "github_token" }
  | { type: "none" }
  | { type: "optional_token" };

export interface ProviderInfo {
  id: string;
  name: string;
  country: string;
  kind: ProviderKind;
  baseUrl: string;
  models: readonly string[];
  auth: ProviderAuth;
  /** True if /chat/completions with the OpenAI request/response shape works. */
  openAiCompatible: boolean;
  /** Free if a free tier exists (credits, free models, anonymous tier, etc). */
  free: boolean;
  /** Short marketing-style description for the picker. */
  description: string;
  /** True if the server's llm runtime cannot currently execute this provider. */
  unsupportedRuntime?: boolean;
  /** Notes surfaced to the user in the provider form. */
  notes?: string;
}

export const PROVIDER_CATALOG = [
  // ──────────────── Provider APIs (train their own models) ────────────────
  {
    id: "ai21",
    name: "AI21 Labs",
    country: "IL",
    kind: "company",
    baseUrl: "https://api.ai21.com/studio/v1",
    models: ["jamba-large-1.7", "jamba-mini-2"],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Jamba long-context models (trial credits)",
  },
  {
    id: "aion",
    name: "Aion Labs",
    country: "IL",
    kind: "company",
    baseUrl: "https://api.aionlabs.ai/v1",
    models: ["aion-2.0", "aion-1.0", "aion-1.0-mini"],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Roleplay & storytelling models",
  },
  {
    id: "alibaba",
    name: "Alibaba Cloud Model Studio",
    country: "CN",
    kind: "company",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    models: [
      "qwen3-max",
      "qwen3-plus",
      "qwen3-vl-plus",
      "qwen3-coder-plus",
      "qwq-plus",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Qwen family from Alibaba",
    notes: "Account requires phone/email verification",
  },
  {
    id: "cohere",
    name: "Cohere",
    country: "CA",
    kind: "company",
    baseUrl: "https://api.cohere.com/v2",
    models: [
      "command-a",
      "command-r-plus",
      "command-r",
      "command-r7b",
      "embed-4",
      "rerank-3.5",
    ],
    auth: { type: "api_key" },
    openAiCompatible: false,
    free: true,
    description: "Command family + embeddings/rerank",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    country: "CN",
    kind: "company",
    baseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "DeepSeek V3.2 / R1",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    country: "US",
    kind: "company",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3-flash-preview",
    ],
    auth: { type: "api_key" },
    openAiCompatible: false,
    free: true,
    description: "Gemini 2.5 / 3 Flash family",
    notes: "Not available in EU/UK/Switzerland",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    country: "FR",
    kind: "company",
    baseUrl: "https://api.mistral.ai/v1",
    models: [
      "mistral-small-latest",
      "mistral-medium-latest",
      "mistral-large-latest",
      "open-mistral-nemo",
      "codestral-latest",
      "pixtral-large-latest",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Mistral Small/Medium/Large + Codestral",
  },
  {
    id: "xai",
    name: "xAI",
    country: "US",
    kind: "company",
    baseUrl: "https://api.x.ai/v1",
    models: ["grok-4.3", "grok-4.1-fast", "grok-3-mini"],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Grok family ($25 signup credit)",
  },
  {
    id: "zai",
    name: "Z AI (Zhipu)",
    country: "CN",
    kind: "company",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    models: ["glm-4.7-flash", "glm-4.5-flash", "glm-4.6v-flash"],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "GLM-4 Flash family",
  },

  // ──────────────── Inference providers (host open-weight models) ────────────────
  {
    id: "cerebras",
    name: "Cerebras",
    country: "US",
    kind: "inference",
    baseUrl: "https://api.cerebras.ai/v1",
    models: [
      "llama-3.3-70b",
      "gpt-oss-120b",
      "qwen-3-235b",
      "qwen-3-32b",
      "llama-4-scout",
      "zai-glm-4.7",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Wafer-scale fast inference",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    country: "US",
    kind: "inference",
    baseUrl: "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run",
    models: [
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      "@cf/mistral/mistral-small-3.1-24b-instruct",
      "@cf/google/gemma-3-12b-it",
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    ],
    auth: { type: "api_key" },
    openAiCompatible: false,
    free: true,
    description: "50+ models on Cloudflare edge",
    unsupportedRuntime: true,
    notes: "Per-account URL with {account_id} placeholder — runtime wiring not implemented",
  },
  {
    id: "github_models",
    name: "GitHub Models",
    country: "US",
    kind: "inference",
    baseUrl: "https://models.github.ai/inference",
    models: [
      "gpt-5",
      "gpt-4.1",
      "gpt-4o",
      "o4-mini",
      "llama-4",
      "deepseek-r1",
      "mistral-small",
    ],
    auth: { type: "github_token" },
    openAiCompatible: true,
    free: true,
    description: "Free prototyping via GitHub PAT",
  },
  {
    id: "groq",
    name: "Groq",
    country: "US",
    kind: "inference",
    baseUrl: "https://api.groq.com/openai/v1",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "qwen-3-32b",
      "gpt-oss-120b",
      "kimi-k2",
      "deepseek-r1-distill-llama-70b",
      "whisper-large-v3",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Ultra-fast LPU inference",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    country: "US",
    kind: "inference",
    baseUrl: "https://router.huggingface.co/v1",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "Qwen/Qwen2.5-72B-Instruct",
      "microsoft/Phi-3.5-mini-instruct",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Thousands of community models (100K monthly credits)",
  },
  {
    id: "kilocode",
    name: "Kilo Code",
    country: "US",
    kind: "inference",
    baseUrl: "https://api.kilo.ai/api/gateway",
    models: [
      "grok-code-fast",
      "minimax-m2.5",
      "bytedance-seed",
      "nemotron",
      "arcee-trinity",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Code-focused model gateway",
  },
  {
    id: "llm7io",
    name: "LLM7.io",
    country: "GB",
    kind: "inference",
    baseUrl: "https://api.llm7.io/v1",
    models: [
      "deepseek-r1-0528",
      "deepseek-v3-0324",
      "gemini-2.5-flash-lite",
      "gpt-4o-mini",
      "mistral-small-latest",
      "qwen-coder",
    ],
    auth: { type: "optional_token" },
    openAiCompatible: true,
    free: true,
    description: "Multi-provider gateway (token raises limits)",
  },
  {
    id: "modelscope",
    name: "ModelScope",
    country: "CN",
    kind: "inference",
    baseUrl: "https://api-inference.modelscope.cn/v1",
    models: [
      "Qwen/Qwen2.5-72B-Instruct",
      "Qwen/Qwen2.5-Coder-32B-Instruct",
      "deepseek-ai/DeepSeek-V3",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Alibaba's model hub",
    notes: "Requires Alibaba Cloud binding + real-name verification",
  },
  {
    id: "nebius",
    name: "Nebius",
    country: "NL",
    kind: "inference",
    baseUrl: "https://api.studio.nebius.com/v1",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct",
      "deepseek-ai/DeepSeek-V3",
      "deepseek-ai/DeepSeek-R1",
      "Qwen/Qwen3-235B-A22B",
      "gpt-oss-120b",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "60+ open-source models ($1 signup credit)",
  },
  {
    id: "nscale",
    name: "Nscale",
    country: "GB",
    kind: "inference",
    baseUrl: "https://inference.api.nscale.com/v1",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct",
      "Qwen/Qwen3-Coder-32B-Instruct",
      "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
      "gpt-oss-120b",
      "Qwen/Qwen3-32B",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Open-weight inference ($5 signup credit)",
  },
  {
    id: "nvidia_nim",
    name: "NVIDIA NIM",
    country: "US",
    kind: "inference",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    models: [
      "deepseek-ai/deepseek-r1",
      "nvidia/nemotron-4-340b-instruct",
      "meta/llama-3.1-405b-instruct",
      "qwen/qwen2.5-72b-instruct",
      "google/gemma-2-27b-it",
      "mistralai/mistral-large-2-instruct",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "100+ models via NVIDIA Developer Program",
  },
  {
    id: "ollama_cloud",
    name: "Ollama Cloud",
    country: "US",
    kind: "inference",
    baseUrl: "https://api.ollama.com",
    models: [
      "gpt-oss:120b",
      "deepseek-v3.1",
      "qwen3-coder",
      "kimi-k2",
      "glm-4.6",
      "deepseek-r1",
    ],
    auth: { type: "api_key" },
    openAiCompatible: false,
    free: true,
    description: "400+ models (Ollama API, not OpenAI-compatible)",
    unsupportedRuntime: true,
    notes: "Uses Ollama's native API — runtime adapter not implemented",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    country: "US",
    kind: "inference",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "deepseek/deepseek-r1:free",
      "deepseek/deepseek-v3.1:free",
      "qwen/qwen3-coder:free",
      "meta-llama/llama-4-maverick:free",
      "google/gemma-3-27b-it:free",
      "nvidia/nemotron-nano-9b-v2:free",
      "openai/gpt-oss-120b:free",
      "minimax/minimax-m1:free",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "Model aggregator (~28 free models)",
  },
  {
    id: "ovhcloud",
    name: "OVHcloud AI Endpoints",
    country: "FR",
    kind: "inference",
    baseUrl: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
    models: [
      "Meta-Llama-3_3-70B-Instruct",
      "DeepSeek-R1-Distill-Llama-70B",
      "Qwen3-Coder-32B-Instruct",
      "Qwen3-VL-30B-A3B-Instruct",
      "Mixtral-8x22B-Instruct-v0.1",
      "Mistral-Nemo-Instruct-2407",
    ],
    auth: { type: "optional_token" },
    openAiCompatible: true,
    free: true,
    description: "Anonymous tier (2 RPM/IP) or higher with key",
  },
  {
    id: "siliconflow",
    name: "SiliconFlow",
    country: "CN",
    kind: "inference",
    baseUrl: "https://api.siliconflow.cn/v1",
    models: [
      "Qwen/Qwen3-8B",
      "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
      "deepseek-ai/DeepSeek-OCR",
    ],
    auth: { type: "api_key" },
    openAiCompatible: true,
    free: true,
    description: "3 permanently free models",
  },
] as const satisfies readonly ProviderInfo[];

export type ProviderId = (typeof PROVIDER_CATALOG)[number]["id"];

export const PROVIDER_IDS = PROVIDER_CATALOG.map((p) => p.id) as readonly ProviderId[];

const CATALOG_BY_ID = Object.fromEntries(
  PROVIDER_CATALOG.map((p) => [p.id, p as ProviderInfo]),
) as Record<string, ProviderInfo>;

export function getProviderInfo(id: ProviderId): ProviderInfo {
  const info = CATALOG_BY_ID[id];
  if (!info) throw new Error(`Unknown provider id: ${id}`);
  return info;
}

export function isProviderSupported(id: ProviderId): boolean {
  return !getProviderInfo(id).unsupportedRuntime;
}
