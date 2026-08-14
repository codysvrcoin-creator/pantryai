import type { PantryItem } from "@/lib/types";
import { PANTRY_CATEGORIES } from "@/lib/types";
import { formatDayLong } from "@/lib/weekDates";

const MEAL_JSON_SHAPE = `{
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "recipeName": string,
  "instructions": string (VERY short 1-sentence summary, for card previews),
  "utensils": string[] (utensils and appliances needed, e.g. ["pot", "non-stick pan", "oven", "blender"]),
  "steps": [
    {
      "text": string (ONE concrete, actionable step, with EXACT quantities included when relevant, e.g. "Bring 1.5L of water to a boil with a teaspoon of salt" or "Add the 300g of rice and stir for 1 minute"),
      "timerMinutes": number | null (wait/cook minutes for THIS step if the user needs to wait or watch a specific time -boiling water, cooking pasta, baking, reducing a stock, marinating...-; null if it's an active step with no wait, like chopping or mixing)
    }
  ] (between 4 and 9 steps, in real cooking order, covering the ENTIRE process from start to finish, including prep work -chopping, preheating, etc.-),
  "ingredients": [
    {
      "name": string,
      "quantity": number,
      "unit": string,
      "pantryCategory": string,
      "kcal": number (calories CONTRIBUTED by this ingredient at the stated quantity, not per 100g),
      "proteinG": number (grams of protein contributed by this ingredient at this quantity),
      "carbsG": number (grams of carbs contributed by this ingredient at this quantity),
      "fatG": number (grams of fat contributed by this ingredient at this quantity)
    }
  ],
  "calories": number (rough total; the app will recalculate the real total from the ingredients, so this should be consistent with them),
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "prepMinutes": number,
  "cookMinutes": number,
  "estimatedCost": number (cost estimate for this whole meal, in the given currency)
}`;

function formatPantryForPrompt(pantryItems: PantryItem[]): string {
  if (pantryItems.length === 0) return "The pantry is empty.";
  const today = new Date();
  return pantryItems
    .map((item) => {
      let expiryNote = "";
      if (item.expiration_date) {
        const days = Math.ceil(
          (new Date(item.expiration_date).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (days <= 3) expiryNote = ` (EXPIRES IN ${days} DAY(S), PRIORITIZE!)`;
        else expiryNote = ` (expires in ${days} days)`;
      }
      return `- ${item.name}: ${item.quantity}${item.unit} [${item.category}, ${item.location}]${expiryNote}`;
    })
    .join("\n");
}

const BASE_SYSTEM_PROMPT = `You are an expert meal planner, nutritionist, household shopping strategist, and professional chef who writes clear recipes for cooking at home with no prior experience.
You respond EXCLUSIVELY with valid JSON, no markdown, no text before or after, no comments.
Never invent fields that weren't requested. Never omit required fields.
All ingredient quantities must already be scaled for the given number of diners (never give "per person" amounts).
Respond entirely in English: recipe names, step text, ingredient names, utensils, and any other text field must all be in English, regardless of the language used in the user's own request.
Every recipe must be described as a sequence of individual, concrete steps in real execution order (never a long paragraph): include exact quantities in the step text whenever the step uses an ingredient, flag any step that involves waiting (boiling water, cooking, baking, reducing, marinating, resting...) with a timer (timerMinutes), and list the required utensils.
For nutrition: give your best estimate of each ingredient's composition (based on standard nutrition tables), but remember that 1g protein = 4 kcal, 1g carbs = 4 kcal, and 1g fat = 9 kcal — make sure each ingredient's "kcal" is consistent with its own proteinG/carbsG/fatG using that formula.`;

export function buildWeekPlanPrompt(params: {
  userPrompt: string;
  people: number;
  weeklyBudget: number;
  currency: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  pantryItems: PantryItem[];
  weekStartDate: string;
  daysToPlan: string[]; // ISO dates, one per day of the week
}) {
  const systemPrompt = `${BASE_SYSTEM_PROMPT}

You must generate a weekly meal plan (lunch and dinner for each day, unless the user asks otherwise) optimizing in this priority order:
1. Use pantry items that expire soon first.
2. Reuse the same purchased ingredients across several recipes during the week (e.g. if 1kg of chicken is bought, use it split across 2-3 different meals instead of buying a different ingredient per recipe).
3. Meet the daily nutrition targets (approximate, not exact).
4. Keep the total weekly cost within the given budget.
5. Provide variety: don't repeat the same recipe more than twice in the week unless the user explicitly asks for it.

Strict JSON output format:
{
  "summary": string (1-2 sentences summarizing the week's strategy),
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [ ${MEAL_JSON_SHAPE} ]
    }
  ]
}`;

  const userPrompt = `HOUSEHOLD DATA
- Diners: ${params.people}
- Weekly budget: ${params.weeklyBudget} ${params.currency}
- Approximate daily nutrition target (per person): ${params.calories} kcal, ${params.proteinG}g protein, ${params.carbsG}g carbs, ${params.fatG}g fat

CURRENT PANTRY
${formatPantryForPrompt(params.pantryItems)}

DAYS TO PLAN (you must return EXACTLY ${params.daysToPlan.length} entries in "days", one per date in this list, in this same order — don't skip any, especially the last one)
${params.daysToPlan.map((d) => `- ${d} (${formatDayLong(d)})`).join("\n")}

USER'S NATURAL-LANGUAGE REQUEST
"${params.userPrompt || "No special preferences, surprise me with variety and balance."}"

Generate the complete weekly plan in the JSON format indicated above.`;

  return { systemPrompt, userPrompt };
}

export function buildReplaceMealPrompt(params: {
  date: string;
  mealType: string;
  people: number;
  weeklyBudget: number;
  currency: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  pantryItems: PantryItem[];
  otherRecipeNamesThisWeek: string[];
  userHint?: string;
}) {
  const systemPrompt = `${BASE_SYSTEM_PROMPT}

You must generate a SINGLE replacement meal (not a full week) for the given slot.
Avoid repeating any of these recipes already in this week's plan: ${
    params.otherRecipeNamesThisWeek.join(", ") || "(none)"
  }.
Also prioritize using the current pantry when it makes sense.

Strict JSON output format (a single meal, not wrapped in an array or extra object):
${MEAL_JSON_SHAPE}`;

  const userPrompt = `Replace the "${params.mealType}" meal on ${params.date}.

Diners: ${params.people}
Rough remaining weekly budget: ${params.weeklyBudget} ${params.currency}
Approximate daily nutrition target: ${params.calories} kcal, ${params.proteinG}g protein, ${params.carbsG}g carbs, ${params.fatG}g fat

Current pantry:
${formatPantryForPrompt(params.pantryItems)}

${params.userHint ? `User preference for this meal: "${params.userHint}"` : "No specific preference for this meal."}

Return only the JSON object for the new meal.`;

  return { systemPrompt, userPrompt };
}

export function buildOptimizeBudgetPrompt(params: {
  overBudgetAmount: number;
  currency: string;
  items: { name: string; category: string; estimatedPrice: number }[];
}) {
  const systemPrompt = `${BASE_SYSTEM_PROMPT}

The user has gone over budget on their grocery list. You must propose swapping specific products for cheaper alternatives (roughly the same nutritional category: e.g. swap an expensive fish for a cheaper one, or a premium brand for a generic one), preserving the nutritional profile as much as possible.
Don't suggest removing products, only swapping them for cheaper versions.
Only include suggestions for products where a reasonable cheaper alternative exists; don't force a swap if it doesn't make sense.

Strict JSON output format:
{
  "suggestions": [
    {
      "originalName": string (must EXACTLY match one of the names in the given list),
      "replacementName": string,
      "reason": string (1 sentence),
      "estimatedNewPrice": number (in the given currency)
    }
  ]
}`;

  const userPrompt = `Over budget by: ${params.overBudgetAmount.toFixed(2)} ${params.currency}

Current grocery list:
${params.items
  .map((i) => `- ${i.name} [${i.category}]: ${i.estimatedPrice.toFixed(2)} ${params.currency}`)
  .join("\n")}

Propose cheaper swaps to help close the budget gap.`;

  return { systemPrompt, userPrompt };
}

export function buildReceiptScanPrompt() {
  const systemPrompt = `${BASE_SYSTEM_PROMPT}
You are also an expert at reading supermarket receipts (OCR + visual understanding).
You're given a photo of a receipt. Extract every product line you can identify with reasonable confidence.
If a piece of data isn't on the receipt (quantity, category, date, store), infer the most reasonable value; never leave fields empty or invent absurd prices.
Each product's category must be EXACTLY one of these: ${PANTRY_CATEGORIES.join(", ")}.
Additionally, for EACH product you must decide where it's normally stored at home: "fridge" (dairy, deli meats, fresh vegetables, ready-to-eat cooked food, eggs...), "freezer" (any frozen product, ice cream, frozen vegetables/meat/fish...), or "pantry" (canned goods, pasta, rice, snacks, non-refrigerated drinks, non-perishable products). Use your general culinary knowledge of the product, not a fixed mapping by category.
Ignore lines that aren't products (totals, tax, change, loyalty card, ads).

Strict JSON output format:
{
  "storeName": string | null (store name if it appears on the receipt),
  "purchaseDate": "YYYY-MM-DD" | null (purchase date if it appears on the receipt),
  "items": [
    {
      "name": string (clean, readable product name, no barcodes),
      "quantity": number (quantity/weight purchased; if not shown, use 1),
      "unit": string (e.g. "u", "kg", "g", "l", "ml", "package"),
      "price": number (price of that line in the given currency, the line total, not the unit price),
      "category": string (one of the allowed categories),
      "location": "fridge" | "pantry" | "freezer"
    }
  ]
}`;

  const userPrompt = `Analyze this receipt image and return only the JSON with the extracted products, following the format above.`;

  return { systemPrompt, userPrompt };
}

export function buildAdjustRecipePrompt(params: {
  currentMeal: {
    recipeName: string;
    mealType: string;
    ingredients: { name: string; quantity: number; unit: string; pantryCategory: string }[];
  };
  userHint: string;
  people: number;
  currency: string;
  pantryItems: PantryItem[];
}) {
  const systemPrompt = `${BASE_SYSTEM_PROMPT}
The user is cooking the recipe "${params.currentMeal.recipeName}" RIGHT NOW and is asking for a quick on-the-fly adjustment (e.g. "I don't have an oven", "make it dairy-free", "I ran out of garlic", "I want it faster").
You must return the SAME recipe adapted to their request: keep the same base dish and meal type whenever reasonable, changing only what's needed to satisfy the request (a swapped ingredient, reordered or simplified steps, an alternative utensil, etc.).
If the request is incompatible with keeping the same dish, propose the closest possible alternative.

Strict JSON output format (a single meal, not wrapped in an array or extra object):
${MEAL_JSON_SHAPE}`;

  const userPrompt = `Current recipe: "${params.currentMeal.recipeName}" (${params.currentMeal.mealType}) for ${params.people} diners.
Current ingredients: ${params.currentMeal.ingredients
    .map((i) => `${i.quantity}${i.unit} ${i.name}`)
    .join(", ")}

Current pantry:
${formatPantryForPrompt(params.pantryItems)}

User's request to adjust the recipe RIGHT NOW: "${params.userHint}"

Return only the JSON object for the adjusted recipe, with complete steps and utensils (not just what changed).`;

  return { systemPrompt, userPrompt };
}

export function buildAddGroceryItemsPrompt(params: { userPrompt: string; currency: string }) {
  const systemPrompt = `${BASE_SYSTEM_PROMPT}
The user wants to add products to their grocery list by describing them in natural language (there may be one or several products in the same sentence).
Interpret the request and return each product separately, with a reasonable quantity and unit if not specified (e.g. "red wine" -> 1 bottle; "napkins" -> 1 package).
Each product's category must be EXACTLY one of these: ${PANTRY_CATEGORIES.join(", ")}.

Strict JSON output format:
{
  "items": [
    { "name": string, "quantity": number, "unit": string, "category": string }
  ]
}`;

  const userPrompt = `Add to the grocery list: "${params.userPrompt}"`;

  return { systemPrompt, userPrompt };
}

export function buildQuickPantryPrompt(params: { text: string }) {
  const systemPrompt = `${BASE_SYSTEM_PROMPT}
The user has dictated or typed, in a single message, ALL the products they currently have at home, to add them to their pantry all at once. There may be several products in the same message.
Interpret each product separately: a clean, normalized name (singular, no brand unless relevant), quantity, unit, category, and the location where that product is normally stored ("fridge", "freezer", or "pantry") based on your general culinary knowledge.
If the user mentions a count of loose units (e.g. "two chicken breasts", "six eggs"), use unit="u" with that quantity.
If they mention weight or volume (e.g. "half a kilo of rice"), convert it to a number with the corresponding unit (0.5 kg, or 500 g).
The category must be EXACTLY one of these: ${PANTRY_CATEGORIES.join(", ")}.

Strict JSON output format:
{
  "items": [
    { "name": string, "quantity": number, "unit": string, "category": string, "location": "fridge" | "pantry" | "freezer" }
  ]
}`;

  const userPrompt = `The user says they have at home: "${params.text}"`;

  return { systemPrompt, userPrompt };
}
