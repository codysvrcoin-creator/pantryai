// -----------------------------------------------------------------------
// Product name normalization for the price memory and for merging
// equivalent pantry products. Purely deterministic (no AI): just
// lowercasing, stripping accents, and collapsing whitespace. SEMANTIC
// normalization (recognizing that "CHICKEN BREAST" and "BREAST OF
// CHICKEN" are the same product) is done by the AI when reading the
// receipt/dictation, which must already return a clean canonical name;
// this function only makes sure small case/accent variations still map
// to the same key.
// -----------------------------------------------------------------------

export function normalizeProductName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\s+/g, " ");
}

/** Do these two names (exact match, or one contained in the other) refer to the same product? */
export function isSameProduct(a: string, b: string): boolean {
  const na = normalizeProductName(a);
  const nb = normalizeProductName(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}
