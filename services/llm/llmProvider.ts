/**
 * LLM Provider Abstraction Layer
 *
 * All LLM interaction in the pipeline goes through this interface.
 * The pipeline is NEVER tied to a specific provider (OpenAI, Anthropic, Gemini).
 *
 * To switch provider: set LLM_PROVIDER=openai | anthropic | gemini in .env.local
 * To add a new provider: implement LLMProvider, register in PROVIDER_REGISTRY.
 *
 * Provider selection order:
 *  1. Explicit call to setActiveLLMProvider()
 *  2. LLM_PROVIDER env var
 *  3. First registered provider where isAvailable() === true
 *  4. DeterministicFallbackProvider (always available, no API key required)
 *
 * Usage:
 *   import { getActiveLLMProvider } from "@/services/llm/llmProvider";
 *   const provider = getActiveLLMProvider();
 *   const result = await provider.complete(request);
 */

// ─── Core Interface ───────────────────────────────────────────────────────────

export interface LLMCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;           // provider-specific model name; if omitted, provider uses its default
  stopSequences?: string[];
}

export interface LLMCompletionResponse {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  finishReason: "stop" | "length" | "error" | "fallback";
}

export interface LLMProvider {
  /** Human-readable provider name, e.g. "openai", "anthropic", "gemini" */
  readonly name: string;
  /** Default model to use if request.model is not specified */
  readonly defaultModel: string;
  /** Returns true if this provider is configured and usable right now */
  isAvailable(): boolean;
  /** Send a completion request and return the response */
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}

// ─── Provider Registry ────────────────────────────────────────────────────────

const PROVIDER_REGISTRY = new Map<string, LLMProvider>();

export function registerLLMProvider(provider: LLMProvider): void {
  PROVIDER_REGISTRY.set(provider.name, provider);
}

export function getRegisteredProviders(): LLMProvider[] {
  return Array.from(PROVIDER_REGISTRY.values());
}

export function getLLMProviderByName(name: string): LLMProvider | null {
  return PROVIDER_REGISTRY.get(name) ?? null;
}

// ─── Active Provider Selection ────────────────────────────────────────────────

let _activeProvider: LLMProvider | null = null;

export function setActiveLLMProvider(provider: LLMProvider): void {
  _activeProvider = provider;
}

export function getActiveLLMProvider(): LLMProvider {
  // 1. Explicitly set provider
  if (_activeProvider?.isAvailable()) return _activeProvider;

  // 2. Env-var nominated provider
  const envProvider = process.env.LLM_PROVIDER?.toLowerCase().trim();
  if (envProvider) {
    const named = PROVIDER_REGISTRY.get(envProvider);
    if (named?.isAvailable()) return named;
  }

  // 3. First available registered provider (order of registration)
  for (const provider of PROVIDER_REGISTRY.values()) {
    if (provider.isAvailable()) return provider;
  }

  // 4. Deterministic fallback — always available
  return DETERMINISTIC_FALLBACK;
}

// ─── Deterministic Fallback Provider ─────────────────────────────────────────
// Used when no LLM API key is configured.
// Returns a structured, readable response without any external calls.

const DETERMINISTIC_FALLBACK: LLMProvider = {
  name: "deterministic",
  defaultModel: "deterministic-v1",

  isAvailable(): boolean {
    return true;
  },

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const start = Date.now();
    // Return the user prompt back with a minimal structural wrapper
    // This is overridden by the KnowledgeWriter's own deterministic renderer
    // when it detects provider.name === "deterministic"
    return {
      content: request.userPrompt,
      model: "deterministic-v1",
      provider: "deterministic",
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - start,
      finishReason: "fallback",
    };
  },
};

// ─── Provider Health Check ────────────────────────────────────────────────────

export interface ProviderHealthStatus {
  name: string;
  available: boolean;
  isActive: boolean;
  model: string;
}

export function getProviderHealth(): ProviderHealthStatus[] {
  const active = getActiveLLMProvider();
  const allProviders = [...PROVIDER_REGISTRY.values(), DETERMINISTIC_FALLBACK];
  return allProviders.map((p) => ({
    name: p.name,
    available: p.isAvailable(),
    isActive: p.name === active.name,
    model: p.defaultModel,
  }));
}
