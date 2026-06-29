export interface BankPreset {
  name: string;
  color: string;
  /** Letter shown in the round avatar when no photo is set */
  letter: string;
}

/**
 * The preset list intentionally contains only generic color names —
 * never real bank names or their brand colors. Curating an official
 * bank's name + near-exact brand color inside the app reads as
 * branding/endorsement and is a real trademark/passing-off risk.
 * A user typing a real bank's name into the free-text "Другой банк"
 * field is their own content, not something the app curates, which
 * is a meaningfully different (much lower) liability picture.
 */
export const BANK_PRESETS: BankPreset[] = [
  { name: "Зелёный банк", color: "#22c55e", letter: "З" },
  { name: "Красный банк", color: "#ef4444", letter: "К" },
  { name: "Жёлтый банк", color: "#eab308", letter: "Ж" },
  { name: "Синий банк", color: "#3b82f6", letter: "С" },
  { name: "Фиолетовый банк", color: "#a855f7", letter: "Ф" },
  { name: "Оранжевый банк", color: "#f97316", letter: "О" },
  { name: "Розовый банк", color: "#ec4899", letter: "Р" },
  { name: "Бирюзовый банк", color: "#14b8a6", letter: "Б" },
];

export const CUSTOM_BANK_VALUE = "__custom__";

export function getBankPreset(name?: string): BankPreset | undefined {
  if (!name) return undefined;
  return BANK_PRESETS.find((b) => b.name === name);
}

/** Deterministic fallback color for a bank name we don't recognize */
export function fallbackBankColor(name: string): string {
  const palette = ["#86177D", "#A0BE21", "#652660", "#7E8F36", "#C34AB8", "#667C0B"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}