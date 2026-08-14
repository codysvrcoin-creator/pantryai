export interface CookingStep {
  text: string;
  /** Seconds detected in the step text (e.g. "cook for 10 minutes" -> 600), or null. */
  timerSeconds: number | null;
}

/**
 * Converts the instructions text (2-4 sentences returned by the AI) into
 * discrete steps for Cooking Mode. This is a 100% deterministic utility:
 * the AI is never called again to break the recipe into steps.
 */
export function parseInstructionsToSteps(instructions: string): CookingStep[] {
  const cleaned = instructions.trim();
  if (!cleaned) return [];

  // 1. If numbered ("1. Chop the onion. 2. ..."), split by number.
  const numbered = cleaned.split(/(?:^|\s)\d+[.)]\s+/).filter((s) => s.trim());
  const source =
    numbered.length > 1
      ? numbered
      : // 2. Otherwise, split by line breaks or by a period followed by a capital letter.
        cleaned
          .split(/\n+|(?<=[.!])\s+(?=[A-Z])/)
          .filter((s) => s.trim());

  const steps = (source.length > 0 ? source : [cleaned])
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .map((text) => ({
      text: text.endsWith(".") ? text : `${text}.`,
      timerSeconds: detectTimerSeconds(text),
    }));

  return steps;
}

function detectTimerSeconds(text: string): number | null {
  const lower = text.toLowerCase();

  const hourMatch = lower.match(/(\d+)\s*(?:h|hr|hrs|hour|hours)\b/);
  const minMatch = lower.match(/(\d+)\s*(?:min|mins|minute|minutes)\b/);

  let seconds = 0;
  let found = false;
  if (hourMatch) {
    seconds += parseInt(hourMatch[1], 10) * 3600;
    found = true;
  }
  if (minMatch) {
    seconds += parseInt(minMatch[1], 10) * 60;
    found = true;
  }

  return found && seconds > 0 ? seconds : null;
}

export function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Returns the steps for a meal. Recipes generated from Part 3 onward
 * already come with structured `steps` (with an exact timer) from the AI.
 * If the plan saved in localStorage is from an earlier version and only
 * has free-text `instructions`, we split it here as a fallback so we don't
 * break plans that were already generated.
 */
export function getStepsForMeal(meal: {
  steps?: { text: string; timerMinutes: number | null }[];
  instructions: string;
}): { text: string; timerMinutes: number | null }[] {
  if (meal.steps && meal.steps.length > 0) return meal.steps;
  return parseInstructionsToSteps(meal.instructions).map((s) => ({
    text: s.text,
    timerMinutes: s.timerSeconds != null ? Math.round(s.timerSeconds / 60) : null,
  }));
}
