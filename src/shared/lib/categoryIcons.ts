import {
  Percent,
  ShoppingCart,
  Fuel,
  UtensilsCrossed,
  Pill,
  Shirt,
  Car,
  Plane,
  Bike,
  Sparkles,
  Gem,
  Dumbbell,
  Home,
  Smartphone,
  Film,
  GraduationCap,
  PawPrint,
  Coffee,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const RULES: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ["все покупки", "все категории", "всё", "прочее"], icon: Wallet },
  { keywords: ["супермаркет", "продукт", "магазин"], icon: ShoppingCart },
  { keywords: ["азс", "топливо", "бензин", "заправ"], icon: Fuel },
  { keywords: ["ресторан", "кафе", "фастфуд", "общественное питание"], icon: UtensilsCrossed },
  { keywords: ["кофе", "кофейн"], icon: Coffee },
  { keywords: ["аптек", "лекарств", "здоровье", "медицин"], icon: Pill },
  { keywords: ["одежда", "обувь", "шопинг", "fashion"], icon: Shirt },
  { keywords: ["аренда авто", "автомоб", "автоуслуги", "сто", "шины"], icon: Car },
  { keywords: ["путешеств", "авиабилет", "отель", "туризм"], icon: Plane },
  { keywords: ["деливери", "доставка", "курьер"], icon: Bike },
  { keywords: ["красота", "косметик", "spa", "спа", "парикмахер"], icon: Sparkles },
  { keywords: ["ювелир", "украшен"], icon: Gem },
  { keywords: ["активный отдых", "спорт", "фитнес"], icon: Dumbbell },
  { keywords: ["дом", "ремонт", "мебель"], icon: Home },
  { keywords: ["связь", "электроник", "телефон", "гаджет"], icon: Smartphone },
  { keywords: ["кино", "развлечен", "театр", "концерт"], icon: Film },
  { keywords: ["образован", "обучен", "курсы"], icon: GraduationCap },
  { keywords: ["зоотовар", "питомец", "животн"], icon: PawPrint },
];

export function getCategoryIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.icon;
  }
  return Percent;
}
