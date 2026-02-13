import OpenAI from "openai";

export interface ModelConfig {
  name: string;
  client: OpenAI;
  model: string;
}

interface ProviderSpec {
  name: string;
  envKey: string;      // env var for API key
  baseURLEnv?: string; // env var for custom base URL
  defaultURL?: string; // fallback base URL
  model: string;       // default model
  keywords: string[];  // auto-detect keywords in model name
}

const specs: ProviderSpec[] = [
  {
    name: "azure",
    envKey: "AZURE_OPENAI_API_KEY",
    baseURLEnv: "AZURE_OPENAI_BASE_URL",
    defaultURL: process.env.AZURE_OPENAI_BASE_URL || "https://YOUR_RESOURCE.openai.azure.com/openai/v1",
    model: process.env.AZURE_OPENAI_MODEL || "gpt-5.2",
    keywords: ["azure"],
  },
  {
    name: "openai",
    envKey: "OPENAI_API_KEY",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    keywords: ["gpt-", "o1-", "o3-", "o4-"],
  },
  {
    name: "anthropic",
    envKey: "ANTHROPIC_API_KEY",
    defaultURL: "https://api.anthropic.com/v1",
    model: "claude-sonnet-4-20250514",
    keywords: ["claude"],
  },
  {
    name: "deepseek",
    envKey: "DEEPSEEK_API_KEY",
    defaultURL: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    keywords: ["deepseek"],
  },
  {
    name: "gemini",
    envKey: "GEMINI_API_KEY",
    defaultURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
    keywords: ["gemini"],
  },
  {
    name: "openrouter",
    envKey: "OPENROUTER_API_KEY",
    defaultURL: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o",
    keywords: ["openrouter"],
  },
  {
    name: "groq",
    envKey: "GROQ_API_KEY",
    defaultURL: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    keywords: ["llama", "mixtral", "groq"],
  },
  {
    name: "moonshot",
    envKey: "MOONSHOT_API_KEY",
    defaultURL: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    keywords: ["moonshot", "kimi"],
  },
  {
    name: "local",
    envKey: "_LOCAL_UNUSED",
    baseURLEnv: "VLLM_BASE_URL",
    defaultURL: "http://localhost:8000/v1",
    model: process.env.LOCAL_MODEL || "default",
    keywords: ["local", "vllm"],
  },
];

function buildConfig(spec: ProviderSpec, modelOverride?: string): ModelConfig {
  const isAzure = spec.name === "azure";
  const apiKey = process.env[spec.envKey] || "sk-not-set";
  const baseURL = (spec.baseURLEnv && process.env[spec.baseURLEnv]) || spec.defaultURL;

  const clientOpts: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
  if (baseURL) clientOpts.baseURL = baseURL;
  if (isAzure) clientOpts.defaultHeaders = { "api-key": apiKey };

  return { name: spec.name, client: new OpenAI(clientOpts), model: modelOverride || spec.model };
}

/** Get model config by provider name, or auto-detect from model string. */
export function getModelConfig(provider?: string): ModelConfig {
  const key = provider || process.env.SKILLBOTS_PROVIDER || "azure";

  // Direct match by name
  const directSpec = specs.find((s) => s.name === key);
  if (directSpec) return buildConfig(directSpec);

  // Auto-detect by model name keywords
  const lk = key.toLowerCase();
  const autoSpec = specs.find((s) => s.keywords.some((kw) => lk.includes(kw)));
  if (autoSpec) return buildConfig(autoSpec, key);

  throw new Error(`Unknown provider: ${key}. Available: ${specs.map((s) => s.name).join(", ")}`);
}

/** List all available provider names. */
export function listProviders(): string[] {
  return specs.map((s) => s.name);
}
