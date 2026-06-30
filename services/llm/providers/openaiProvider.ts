/**
 * OpenAI LLM Provider
 *
 * Activate by setting in .env.local:
 *   LLM_PROVIDER=openai
 *   OPENAI_API_KEY=sk-...
 *   OPENAI_MODEL=gpt-4o-mini   (optional, defaults to gpt-4o-mini)
 *
 * Supported models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
 *
 * This provider uses the native fetch API — no openai npm package required.
 * Add the openai package later for streaming / function calling support.
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from "../llmProvider";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  readonly defaultModel: string;

  constructor() {
    this.defaultModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenAI provider: OPENAI_API_KEY is not set");

    const model = request.model ?? this.defaultModel;
    const start = Date.now();

    const body = JSON.stringify({
      model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user",   content: request.userPrompt },
      ],
      max_tokens:  request.maxTokens   ?? 4096,
      temperature: request.temperature ?? 0.4,
      ...(request.stopSequences?.length ? { stop: request.stopSequences } : {}),
    });

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`OpenAI API error ${response.status}: ${errText}`);
    }

    const data = await response.json() as {
      choices: { message: { content: string }; finish_reason: string }[];
      usage: { prompt_tokens: number; completion_tokens: number };
      model: string;
    };

    const choice = data.choices?.[0];
    if (!choice) throw new Error("OpenAI returned no choices");

    return {
      content: choice.message.content ?? "",
      model: data.model ?? model,
      provider: "openai",
      inputTokens:  data.usage?.prompt_tokens     ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      durationMs: Date.now() - start,
      finishReason: (choice.finish_reason === "stop" ? "stop" : "length") as LLMCompletionResponse["finishReason"],
    };
  }
}
