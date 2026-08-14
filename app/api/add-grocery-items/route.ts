import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/AIService";
import { buildAddGroceryItemsPrompt } from "@/lib/ai/prompts";
import { groceryAddResponseSchema } from "@/lib/ai/schemas";
import { AIProviderError } from "@/lib/ai/ProviderAdapter";

export const runtime = "nodejs";

const requestSchema = z.object({
  userPrompt: z.string().min(1).max(300),
  currency: z.string().default("EUR"),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof requestSchema>;
  try {
    const json = await req.json();
    body = requestSchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request: describe what you want to add." },
      { status: 400 }
    );
  }

  const { systemPrompt, userPrompt } = buildAddGroceryItemsPrompt(body);

  try {
    const aiResult = await aiService.generateStructured(
      { systemPrompt, userPrompt, temperature: 0.3 },
      groceryAddResponseSchema
    );

    return NextResponse.json({ items: aiResult.items });
  } catch (err) {
    if (err instanceof AIProviderError) {
      const status = err.message.includes("rate limit") ? 429 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: "Unexpected error interpreting the request." },
      { status: 500 }
    );
  }
}
