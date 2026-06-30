/**
 * Google Gemini LLM Provider
 *
 * Activate by setting in .env.local:
 *   LLM_PROVIDER=gemini
 *   GEMINI_API_KEY=AIza...
 *   GEMINI_MODEL=gemini-2.0-flash   (optional)
 *
 * Supported models:
 *   gemini-2.5-pro          — highest quality
 *   gemini-2.5-flash        — fast + capable
 *   gemini-2.0-flash        — default, cost-effective
 *   gemini-1.5-pro          — stable, widely supported
 *
 * Uses Gemini REST API directly — no @google/generative-ai package required.
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from "../llmProvider";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  readonly defaultModel: string;

  constructor() {
    this.defaultModel = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
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

    // Gemini uses a single "contents" array; system instruction is passed separately
    const body = JSON.stringify({
      system_instruction: {
        parts: [{ text: request.systemPrompt }],
      },
      contents: [
        { role: "user", parts: [{ text: request.userPrompt }] },
      ],
      generationConfig: {
        maxOutputTokens: request.maxTokens   ?? 4096,
        temperature:     request.temperature ?? 0.4,
        ...(request.stopSequences?.length ? { stopSequences: request.stopSequences } : {}),
      },
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

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
    if (!text) throw new Error("Gemini returned empty text");

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
}
