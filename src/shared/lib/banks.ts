export interface BankPreset {
  name: string;
  color: string;
  /** Letter shown in the round avatar when no photo is set */
  letter: string;
}

/**
 * Curated list of popular Russian banks plus the four seeded
 * "color" banks every new account starts with. Users can still
 * type a fully custom bank name via the "Другой банк" option.
 */
export const BANK_PRESETS: BankPreset[] = [
  { name: "Зелёный банк", color: "#22c55e", letter: "З" },
  { name: "Красный банк", color: "#ef4444", letter: "К" },
  { name: "Жёлтый банк", color: "#eab308", letter: "Ж" },
  { name: "Синий банк", color: "#3b82f6", letter: "С" },
  { name: "Т-Банк", color: "#FFDD2D", letter: "Т" },
  { name: "Сбербанк", color: "#21A038", letter: "С" },
  { name: "Альфа-Банк", color: "#EF3124", letter: "А" },
  { name: "ВТБ", color: "#1E3A8A", letter: "В" },
  { name: "Райффайзенбанк", color: "#FFED00", letter: "Р" },
  { name: "Газпромбанк", color: "#0033A0", letter: "Г" },
  { name: "Озон Банк", color: "#005BFF", letter: "О" },
  { name: "Совкомбанк", color: "#86177D", letter: "С" },
  { name: "МТС Банк", color: "#E30611", letter: "М" },
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
