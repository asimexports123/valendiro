/**
 * Grok (xAI) LLM Provider
 *
 * Activate by setting in .env.local:
 *   LLM_PROVIDER=grok
 *   XAI_API_KEY=xai-...
 *   XAI_MODEL=grok-3-mini   (optional, defaults to grok-3-mini)
 *
 * xAI uses OpenAI-compatible API.
 * Free tier: 150 requests/hour for grok-3-mini.
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from "../llmProvider";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GrokProvider implements LLMProvider {
  readonly name = "grok";
  readonly defaultModel: string;

  constructor() {
    this.defaultModel = process.env.XAI_MODEL ?? "grok-3-mini";
  }

  isAvailable(): boolean {
    return !!process.env.XAI_API_KEY;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) throw new Error("XAI_API_KEY is not set");

    const model = request.model ?? this.defaultModel;
    const start = Date.now();

    const messages: { role: string; content: string }[] = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.userPrompt });

    const body = {
      model,
      messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 8192,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt);

      const response = await fetch(XAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429 || response.status === 503) {
        lastError = new Error(`Grok ${response.status} — retrying (${attempt + 1}/${MAX_RETRIES + 1})`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Grok API error ${response.status}: ${errText}`);
      }

      const data = await response.json() as {
        choices: { message: { content: string }; finish_reason: string }[];
        usage: { prompt_tokens: number; completion_tokens: number };
      };

      const text = data.choices?.[0]?.message?.content ?? "";
      if (!text) throw new Error("Grok returned empty content");

      return {
        content: text,
        model,
        provider: "grok",
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        durationMs: Date.now() - start,
        finishReason: data.choices?.[0]?.finish_reason === "stop" ? "stop" : "length",
      };
    }

    throw lastError ?? new Error("Grok: all retry attempts exhausted");
  }
}
