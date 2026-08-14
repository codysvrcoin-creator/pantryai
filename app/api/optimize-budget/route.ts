import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/AIService";
import { buildOptimizeBudgetPrompt } from "@/lib/ai/prompts";
import { budgetOptimizationResponseSchema } from "@/lib/ai/schemas";
import { AIProviderError } from "@/lib/ai/ProviderAdapter";

export const runtime = "nodejs";

const requestSchema = z.object({
  overBudgetAmount: z.number(),
  currency: z.string().default("EUR"),
  items: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      estimatedPrice: z.number(),
    })
  ),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof requestSchema>;
  try {
    const json = await req.json();
    body = requestSchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request.", details: String(err) },
      { status: 400 }
    );
  }

  const { systemPrompt, userPrompt } = buildOptimizeBudgetPrompt({
    overBudgetAmount: body.overBudgetAmount,
    currency: body.currency,
    items: body.items,
  });

  try {
    const aiResult = await aiService.generateStructured(
      { systemPrompt, userPrompt, temperature: 0.3 },
      budgetOptimizationResponseSchema
    );

    return NextResponse.json({ suggestions: aiResult.suggestions });
  } catch (err) {
    if (err instanceof AIProviderError) {
      const status = err.message.includes("rate limit") ? 429 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: "Unexpected error optimizing the budget." },
      { status: 500 }
    );
  }
}
