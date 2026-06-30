/**
 * Anthropic (Claude) LLM Provider
 *
 * Activate by setting in .env.local:
 *   LLM_PROVIDER=anthropic
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   ANTHROPIC_MODEL=claude-3-5-haiku-20241022   (optional)
 *
 * Supported models:
 *   claude-opus-4-5           — highest quality, highest cost
 *   claude-sonnet-4-5         — excellent quality, lower cost
 *   claude-3-5-haiku-20241022 — fast, low cost (default)
 *
 * Uses native fetch — no @anthropic-ai/sdk package required.
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from "../llmProvider";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  readonly defaultModel: string;

  constructor() {
    this.defaultModel = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";
  }

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Anthropic provider: ANTHROPIC_API_KEY is not set");

    const model = request.model ?? this.defaultModel;
    const start = Date.now();

    const body = JSON.stringify({
      model,
      system: request.systemPrompt,
      messages: [
        { role: "user", content: request.userPrompt },
      ],
      max_tokens:  request.maxTokens   ?? 4096,
      temperature: request.temperature ?? 0.4,
      ...(request.stopSequences?.length ? { stop_sequences: request.stopSequences } : {}),
    });

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type":          "application/json",
        "x-api-key":              apiKey,
        "anthropic-version":      ANTHROPIC_VERSION,
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as {
      content: { type: string; text: string }[];
      usage: { input_tokens: number; output_tokens: number };
      model: string;
      stop_reason: string;
    };

    const textBlock = data.content?.find((b) => b.type === "text");
    if (!textBlock) throw new Error("Anthropic returned no text content");

    const finishReason: LLMCompletionResponse["finishReason"] =
      data.stop_reason === "end_turn" ? "stop" : "length";

    return {
      content: textBlock.text,
      model: data.model ?? model,
      provider: "anthropic",
      inputTokens:  data.usage?.input_tokens  ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      durationMs: Date.now() - start,
      finishReason,
    };
  }
}
