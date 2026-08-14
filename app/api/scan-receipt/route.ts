import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiService } from "@/lib/ai/AIService";
import { buildReceiptScanPrompt } from "@/lib/ai/prompts";
import { receiptScanResponseSchema } from "@/lib/ai/schemas";
import { AIProviderError } from "@/lib/ai/ProviderAdapter";

export const runtime = "nodejs";

// Receipt photos taken from the phone can weigh several MB in base64.
export const maxDuration = 60;

const requestSchema = z.object({
  imageBase64: z.string().min(100, "Invalid or empty image."),
  mimeType: z
    .string()
    .refine((m) => m.startsWith("image/"), "The file must be an image."),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof requestSchema>;
  try {
    const json = await req.json();
    body = requestSchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request: the receipt image is missing." },
      { status: 400 }
    );
  }

  // Some clients send the full data URL ("data:image/jpeg;base64,...").
  // We keep only the pure base64 part, which is what Gemini expects.
  const base64 = body.imageBase64.includes(",")
    ? body.imageBase64.split(",")[1]
    : body.imageBase64;

  const { systemPrompt, userPrompt } = buildReceiptScanPrompt();

  try {
    const aiResult = await aiService.generateStructured(
      {
        systemPrompt,
        userPrompt,
        temperature: 0.1,
        image: { base64, mimeType: body.mimeType },
      },
      receiptScanResponseSchema
    );

    // Deterministic code: we assign temporary ids and default location
    // values here (not in the AI), so the validation drawer has everything
    // it needs to render editable rows.
    const items = aiResult.items.map((item, i) => ({
      tempId: `scan-${Date.now()}-${i}`,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      category: item.category,
      location: item.location,
      include: true,
    }));

    return NextResponse.json({
      storeName: aiResult.storeName,
      purchaseDate: aiResult.purchaseDate,
      items,
    });
  } catch (err) {
    if (err instanceof AIProviderError) {
      const status = err.message.includes("rate limit") ? 429 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json(
      { error: "Unexpected error reading the receipt. Try another photo." },
      { status: 500 }
    );
  }
}
