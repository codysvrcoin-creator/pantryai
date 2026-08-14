import type { ZodType } from "zod";
import type { AIProviderAdapter, AIGenerateParams } from "./ProviderAdapter";
import { AIProviderError } from "./ProviderAdapter";
import { GeminiAdapter } from "./providers/geminiAdapter";

// -----------------------------------------------------------------------
// Single entry point to the AI for the whole app.
//
// To switch providers in the future (Mistral, DeepSeek...): create a new
// file in lib/ai/providers/ that implements AIProviderAdapter, and change
// ONLY the `new GeminiAdapter()` line below. Nothing else in the app needs
// to change: the /api/* routes keep calling aiService the same way.
// -----------------------------------------------------------------------

function stripJsonFences(raw: string): string {
  // Some models, even when asked for pure JSON, wrap the response in
  // ```json ... ```. We strip that out defensively before parsing.
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export class AIService {
  constructor(private adapter: AIProviderAdapter) {}

  async generateStructured<T>(
    params: AIGenerateParams,
    schema: ZodType<T, any, any>
  ): Promise<T> {
    const raw = await this.adapter.generateJSON(params);
    const cleaned = stripJsonFences(raw);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (err) {
      throw new AIProviderError(
        "The AI returned invalid JSON. Try generating again.",
        this.adapter.name,
        err
      );
    }

    const result = schema.safeParse(parsedJson);
    if (!result.success) {
      throw new AIProviderError(
        "The AI's response didn't match the expected format. Try generating again.",
        this.adapter.name,
        result.error
      );
    }

    return result.data;
  }
}

export const aiService = new AIService(new GeminiAdapter());
