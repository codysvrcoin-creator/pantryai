import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/AIService";
import { buildImportRecipePrompt } from "@/lib/ai/prompts";
import { recipeImportResponseSchema } from "@/lib/ai/schemas";
import { AIProviderError } from "@/lib/ai/ProviderAdapter";
import { computeMealNutrition } from "@/lib/nutrition";

export const runtime = "nodejs";

const requestSchema = z.object({
  rawText: z.string().min(3).max(4000),
  sourceUrl: z.string().max(500).optional(),
  people: z.number().min(1).max(12).default(2),
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

  const { systemPrompt, userPrompt } = buildImportRecipePrompt({
    rawText: body.rawText,
    sourceUrl: body.sourceUrl,
    people: body.people,
  });

  try {
    const aiResult = await aiService.generateStructured(
      { systemPrompt, userPrompt, temperature: 0.4 },
      recipeImportResponseSchema
    );

    // Deterministic code: recompute the real per-recipe totals from the
    // ingredients, never trust the AI's own totals, then derive per-serving
    // values for storage (the "recipes" table is serving-based).
    const totals = computeMealNutrition(aiResult.ingredients);
    const servings = Math.max(1, aiResult.servingsBase);

    const recipe = {
      name: aiResult.name,
      servingsBase: servings,
      tags: aiResult.tags,
      instructions: aiResult.instructions,
      utensils: aiResult.utensils,
      steps: aiResult.steps,
      ingredients: aiResult.ingredients,
      prepMinutes: aiResult.prepMinutes,
      cookMinutes: aiResult.cookMinutes,
      estimatedCost: aiResult.estimatedCost,
      caloriesPerServing: Math.round(totals.calories / servings),
      proteinPerServing: +(totals.proteinG / servings).toFixed(1),
      carbsPerServing: +(totals.carbsG / servings).toFixed(1),
      fatPerServing: +(totals.fatG / servings).toFixed(1),
      wasAdapted: aiResult.wasAdapted,
      adaptationNote: aiResult.adaptationNote,
      sourceUrl: body.sourceUrl ?? null,
    };

    return NextResponse.json({ recipe });
  } catch (err) {
    if (err instanceof AIProviderError) {
      const status = err.message.includes("rate limit") ? 429 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: "Unexpected error importing the recipe." },
      { status: 500 }
    );
  }
}
