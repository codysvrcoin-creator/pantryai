import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/AIService";
import { buildAdjustRecipePrompt } from "@/lib/ai/prompts";
import { singleMealResponseSchema } from "@/lib/ai/schemas";
import { AIProviderError } from "@/lib/ai/ProviderAdapter";
import { computeMealNutrition } from "@/lib/nutrition";
import type { PlannedMeal } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  currentMeal: z.object({
    recipeName: z.string(),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    ingredients: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
        pantryCategory: z.string(),
      })
    ),
  }),
  userHint: z.string().min(1).max(200),
  people: z.number().min(1).max(12),
  currency: z.string().default("EUR"),
  pantryItems: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      quantity: z.number(),
      unit: z.string(),
      location: z.string(),
      expiration_date: z.string().nullable(),
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

  const { systemPrompt, userPrompt } = buildAdjustRecipePrompt({
    currentMeal: body.currentMeal,
    userHint: body.userHint,
    people: body.people,
    currency: body.currency,
    pantryItems: body.pantryItems as any,
  });

  try {
    const aiResult = await aiService.generateStructured(
      { systemPrompt, userPrompt, temperature: 0.5 },
      singleMealResponseSchema
    );

    // Deterministic code: we recalculate the real nutrition from the
    // ingredients, never trusting the "calories" suggested by the AI.
    const nutrition = computeMealNutrition(aiResult.ingredients);

    const meal: PlannedMeal = {
      id: crypto.randomUUID(),
      mealType: aiResult.mealType,
      recipeName: aiResult.recipeName,
      instructions: aiResult.instructions,
      steps: aiResult.steps,
      utensils: aiResult.utensils,
      ingredients: aiResult.ingredients,
      calories: nutrition.calories,
      proteinG: nutrition.proteinG,
      carbsG: nutrition.carbsG,
      fatG: nutrition.fatG,
      prepMinutes: aiResult.prepMinutes,
      cookMinutes: aiResult.cookMinutes,
      estimatedCost: aiResult.estimatedCost,
    };

    return NextResponse.json({ meal });
  } catch (err) {
    if (err instanceof AIProviderError) {
      const status = err.message.includes("rate limit") ? 429 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: "Unexpected error adjusting the recipe." },
      { status: 500 }
    );
  }
}
