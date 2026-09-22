import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/AIService";
import { buildWeekPlanPrompt } from "@/lib/ai/prompts";
import { weekPlanResponseSchema } from "@/lib/ai/schemas";
import { AIProviderError } from "@/lib/ai/ProviderAdapter";
import { getWeekDates } from "@/lib/weekDates";
import { computeMealNutrition } from "@/lib/nutrition";
import type { WeekPlan, PlannedMeal } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  userPrompt: z.string().max(500).default(""),
  people: z.number().min(1).max(12),
  weeklyBudget: z.number().min(0),
  currency: z.string().default("EUR"),
  calories: z.number().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  weekStartDate: z.string(),
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
  cookDaysPerWeek: z.number().min(1).max(7).default(4),
  savedRecipes: z
    .array(
      z.object({
        name: z.string(),
        tags: z.array(z.string()).default([]),
        prepMinutes: z.number().default(0),
        cookMinutes: z.number().default(0),
        caloriesPerServing: z.number().nullable().default(null),
        proteinPerServing: z.number().nullable().default(null),
        ingredients: z
          .array(z.object({ name: z.string(), quantity: z.number(), unit: z.string() }))
          .default([]),
      })
    )
    .default([]),
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

  const daysToPlan = getWeekDates(body.weekStartDate);

  const { systemPrompt, userPrompt } = buildWeekPlanPrompt({
    userPrompt: body.userPrompt,
    people: body.people,
    weeklyBudget: body.weeklyBudget,
    currency: body.currency,
    calories: body.calories,
    proteinG: body.proteinG,
    carbsG: body.carbsG,
    fatG: body.fatG,
    pantryItems: body.pantryItems as any,
    weekStartDate: body.weekStartDate,
    daysToPlan,
    cookDaysPerWeek: body.cookDaysPerWeek,
    savedRecipes: body.savedRecipes,
  });

  try {
    const aiResult = await aiService.generateStructured(
      { systemPrompt, userPrompt, temperature: 0.5 },
      weekPlanResponseSchema
    );

    // Here, and only here (deterministic code), we assign ids, metadata, and
    // DATES. We never trust the "date" field the AI puts on each day: models
    // fairly often mess up exactly the last item in a list (here, Saturday),
    // returning a wrong or duplicated date, or even skipping the day
    // entirely. That's why we pair each date from `daysToPlan` (computed by
    // the app) with the AI's day at the SAME position, ignoring whatever the
    // AI wrote in "date". If the AI returns fewer days than requested, we
    // still create an empty entry so that day exists in the plan (instead of
    // disappearing).
    const weekPlan: WeekPlan = {
      weekStartDate: body.weekStartDate,
      summary: aiResult.summary,
      generatedAt: new Date().toISOString(),
      userPrompt: body.userPrompt,
      days: daysToPlan.map((date, i) => {
        const aiDay = aiResult.days[i];
        return {
          date,
          meals: (aiDay?.meals ?? []).map((meal): PlannedMeal => {
            // Deterministic code: the app ALWAYS recalculates the real nutrition
            // from the ingredients returned by the AI. We never trust the
            // "calories" the AI suggests as the source of truth.
            const nutrition = computeMealNutrition(meal.ingredients);
            return {
              id: crypto.randomUUID(),
              mealType: meal.mealType,
              recipeName: meal.recipeName,
              instructions: meal.instructions,
              steps: meal.steps,
              utensils: meal.utensils,
              ingredients: meal.ingredients,
              calories: nutrition.calories,
              proteinG: nutrition.proteinG,
              carbsG: nutrition.carbsG,
              fatG: nutrition.fatG,
              prepMinutes: meal.prepMinutes,
              cookMinutes: meal.cookMinutes,
              estimatedCost: meal.estimatedCost,
              isLeftover: meal.isLeftover,
              vibe: meal.vibe,
            };
          }),
        };
      }),
    };

    return NextResponse.json({ weekPlan });
  } catch (err) {
    if (err instanceof AIProviderError) {
      const status = err.message.includes("rate limit") ? 429 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: "Unexpected error generating the plan." },
      { status: 500 }
    );
  }
}
