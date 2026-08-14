// -----------------------------------------------------------------------
// Contract that ANY AI provider (Gemini, Mistral, DeepSeek, etc) must
// satisfy. The rest of the app never talks to a provider directly: it
// always goes through this interface. That way, switching providers in
// the future just means swapping an adapter, without touching API routes
// or business logic.
// -----------------------------------------------------------------------

export interface AIImageInput {
  /** Image data encoded as base64 (without the "data:...;base64," prefix). */
  base64: string;
  /** MIME type, e.g. "image/jpeg" or "image/png". */
  mimeType: string;
}

export interface AIGenerateParams {
  /** Role/behavior instructions for the model. */
  systemPrompt: string;
  /** The concrete request from the user/app. */
  userPrompt: string;
  /** 0-1. Adapters default to a low value (consistent responses). */
  temperature?: number;
  /** Optional image for vision tasks (e.g. receipt scanning). */
  image?: AIImageInput;
}

export interface AIProviderAdapter {
  /** Provider identifier name, useful for logs/debugging. */
  readonly name: string;
  /**
   * Generates text in strict JSON format (no markdown, no extra text).
   * Each adapter is responsible for forcing its provider's JSON mode.
   */
  generateJSON(params: AIGenerateParams): Promise<string>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
