/**
 * Google Gemini LLM Provider
 *
 * Activate by setting in .env.local:
 *   LLM_PROVIDER=gemini
 *   GEMINI_API_KEY=AIza...
 *   GEMINI_MODEL=gemini-2.5-flash   (optional — defaults to gemini-2.5-flash)
 *
 * Supported models (best → most cost-effective):
 *   gemini-2.5-pro          — highest reasoning quality
 *   gemini-2.5-flash        — fast, capable, low cost (recommended default)
 *   gemini-2.0-flash        — stable, widely supported
 *   gemini-1.5-pro          — legacy fallback
 *
 * Generation settings:
 *   temperature  0.3  — factual, low creativity variance
 *   topP         0.95 — standard nucleus sampling
 *   maxOutputTokens 8192 — enough for 2000–3000 word articles
 *
 * Uses Gemini REST API directly — no npm package required.
 * Includes retry on 429 (rate limit) and 503 (service unavailable).
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from "../llmProvider";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

/**
 * Thrown when the Gemini daily quota is exhausted (RESOURCE_EXHAUSTED).
 * The pipeline should catch this, pause the current item as "pending_llm",
 * and resume automatically the next day — NOT retry immediately.
 */
export class QuotaExhaustedError extends Error {
  readonly isQuotaExhausted = true as const;
  constructor(message: string) {
    super(message);
    this.name = "QuotaExhaustedError";
  }
}

export function isQuotaExhaustedError(err: unknown): err is QuotaExhaustedError {
  return err instanceof QuotaExhaustedError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  readonly defaultModel: string;

  constructor() {
    this.defaultModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  }

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini provider: GEMINI_API_KEY is not set");

    const model = request.model ?? this.defaultModel;
    const start = Date.now();
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: request.systemPrompt }],
      },
      contents: [
        { role: "user", parts: [{ text: request.userPrompt }] },
      ],
      generationConfig: {
        maxOutputTokens: request.maxTokens   ?? 8192,
        temperature:     request.temperature ?? 0.3,
        topP:            0.95,
        ...(request.stopSequences?.length ? { stopSequences: request.stopSequences } : {}),
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // 429: check if daily quota exhausted vs per-minute rate limit
      if (response.status === 429) {
        const errBody = await response.text().catch(() => "");
        const isResourceExhausted =
          errBody.includes("RESOURCE_EXHAUSTED") ||
          errBody.includes("quota") ||
          errBody.includes("Quota exceeded");
        if (isResourceExhausted) {
          throw new QuotaExhaustedError(
            `Gemini daily quota exhausted. Pipeline will resume tomorrow. Details: ${errBody.slice(0, 200)}`
          );
        }
        // Per-minute rate limit — retry with backoff
        lastError = new Error(`Gemini rate limited (429) — retrying (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        continue;
      }

      // 503: transient server unavailable — retry
      if (response.status === 503) {
        lastError = new Error(`Gemini service unavailable (503) — retrying (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      const data = await response.json() as {
        candidates: {
          content: { parts: { text: string }[] };
          finishReason: string;
        }[];
        usageMetadata: {
          promptTokenCount: number;
          candidatesTokenCount: number;
        };
      };

      const candidate = data.candidates?.[0];
      if (!candidate) throw new Error("Gemini returned no candidates");

      const text = candidate.content?.parts?.map((p) => p.text).join("") ?? "";
      if (!text) throw new Error("Gemini returned empty text content");

      const finishReason: LLMCompletionResponse["finishReason"] =
        candidate.finishReason === "STOP" ? "stop" : "length";

      return {
        content: text,
        model,
        provider: "gemini",
        inputTokens:  data.usageMetadata?.promptTokenCount     ?? 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        durationMs: Date.now() - start,
        finishReason,
      };
    }

    throw lastError ?? new Error("Gemini: all retry attempts exhausted");
  }
}
