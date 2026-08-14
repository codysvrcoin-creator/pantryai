const UNIT_ALIASES: Record<string, string> = {
  kg: "kg",
  kilo: "kg",
  kilos: "kg",
  kilogram: "kg",
  kilograms: "kg",
  g: "g",
  gr: "g",
  gram: "g",
  grams: "g",
  l: "l",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  ml: "ml",
  u: "u",
  unit: "u",
  units: "u",
  package: "package",
  packages: "package",
  pack: "package",
  packs: "package",
  can: "can",
  cans: "can",
  dozen: "dozen",
};

export interface ParsedEntry {
  quantity: number;
  unit: string;
  name: string;
}

// Parses free-text like "1 kg of rice", "2 cans of tomato", "6 eggs",
// "half a kilo of chicken". No AI involved: it's a fast local heuristic,
// designed to work offline.
export function parseQuickEntry(raw: string): ParsedEntry {
  let text = raw.trim().toLowerCase();

  if (text.startsWith("half a ") || text.startsWith("half ")) {
    text = "0.5 " + text.replace(/^half a |^half /, "");
  }

  const match = text.match(
    /^(\d+(?:[.,]\d+)?)\s*([a-z]+)?\s*(?:of\s+)?(.+)$/i
  );

  if (!match) {
    return { quantity: 1, unit: "u", name: raw.trim() };
  }

  const [, qtyRaw, unitRaw, nameRaw] = match;
  const quantity = parseFloat(qtyRaw.replace(",", "."));
  const normalizedUnit = unitRaw ? UNIT_ALIASES[unitRaw] : undefined;

  // If the detected "unit" is actually part of the name (not a known
  // unit), put it back into the name.
  const unit = normalizedUnit ?? "u";
  const name = normalizedUnit
    ? nameRaw.trim()
    : `${unitRaw ?? ""} ${nameRaw}`.trim();

  return {
    quantity: Number.isNaN(quantity) ? 1 : quantity,
    unit,
    name: name.charAt(0).toUpperCase() + name.slice(1),
  };
}
