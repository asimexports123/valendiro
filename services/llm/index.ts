/**
 * LLM Service — Entry Point
 *
 * Import this file once at application startup (e.g. in your pipeline entrypoint)
 * to auto-register all providers and select the active one from env vars.
 *
 *   import "@/services/llm";
 *   // → providers registered, active provider selected automatically
 *
 * Or import specific helpers:
 *   import { getActiveLLMProvider } from "@/services/llm";
 */

import { registerLLMProvider } from "./llmProvider";
import { OpenAIProvider }     from "./providers/openaiProvider";
import { AnthropicProvider }  from "./providers/anthropicProvider";
import { GeminiProvider }     from "./providers/geminiProvider";

// Register all providers (order determines priority when LLM_PROVIDER is not set)
registerLLMProvider(new OpenAIProvider());
registerLLMProvider(new AnthropicProvider());
registerLLMProvider(new GeminiProvider());

// Re-export the public API
export {
  getActiveLLMProvider,
  setActiveLLMProvider,
  getRegisteredProviders,
  getLLMProviderByName,
  getProviderHealth,
  registerLLMProvider,
} from "./llmProvider";

export type {
  LLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
  ProviderHealthStatus,
} from "./llmProvider";
