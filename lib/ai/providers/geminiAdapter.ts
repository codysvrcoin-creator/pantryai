import { AIProviderAdapter, AIGenerateParams, AIProviderError } from "../ProviderAdapter";

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class GeminiAdapter implements AIProviderAdapter {
  readonly name = "gemini";

  async generateJSON(params: AIGenerateParams): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIProviderError(
        "The GEMINI_API_KEY environment variable is missing on the server.",
        this.name
      );
    }

    // If an image is attached (e.g. a receipt photo), we add it as an
    // extra "inlineData" part in the same user message. The rest of the
    // app (the /api/* routes) doesn't need to know or care about this: it
    // just fills in `params.image` when it needs to.
    const userParts: Record<string, unknown>[] = [];
    if (params.image) {
      userParts.push({
        inlineData: {
          mimeType: params.image.mimeType,
          data: params.image.base64,
        },
      });
    }
    userParts.push({ text: params.userPrompt });

    let response: Response;
    try {
      response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: params.systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: userParts,
            },
          ],
          generationConfig: {
            temperature: params.temperature ?? 0.4,
            responseMimeType: "application/json",
          },
        }),
      });
    } catch (err) {
      throw new AIProviderError(
        "Could not reach Gemini (are you offline?).",
        this.name,
        err
      );
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new AIProviderError(
          "Gemini's rate limit was reached. Try again in a few minutes.",
          this.name
        );
      }
      const bodyText = await response.text().catch(() => "");
      throw new AIProviderError(
        `Gemini responded with error ${response.status}: ${bodyText.slice(0, 300)}`,
        this.name
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      throw new AIProviderError(
        "Gemini didn't return any usable text content.",
        this.name
      );
    }

    return text;
  }
}
