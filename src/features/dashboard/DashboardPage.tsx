import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../shared/lib/supabase";
import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { Search, SlidersHorizontal, TrendingUp, Percent } from "lucide-react";
import type { Card, CashbackCategory } from "../../shared/types";

interface CategoryWithCard extends CashbackCategory {
  card: Card;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useApp();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"percent" | "name">("percent");
  const [filterBank, setFilterBank] = useState("all");

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["cards", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cards")
        .select("*, cashback_categories(*)")
        .eq("user_id", user!.id);
      return (data || []) as Card[];
    },
    enabled: !!user,
  });

  const allCategories = useMemo<CategoryWithCard[]>(() => {
    return cards.flatMap((card) =>
      (card.cashback_categories || []).map((cat) => ({ ...cat, card }))
    );
  }, [cards]);

  const banks = useMemo(() => {
    const b = new Set(cards.map((c) => c.bank_name));
    return ["all", ...Array.from(b)];
  }, [cards]);

  const filtered = useMemo(() => {
    return allCategories
      .filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchBank = filterBank === "all" || c.card.bank_name === filterBank;
        return matchSearch && matchBank;
      })
      .sort((a, b) => {
        if (sortBy === "percent") return b.percent - a.percent;
        return a.name.localeCompare(b.name);
      });
  }, [allCategories, search, filterBank, sortBy]);

  const bankColors: Record<string, string> = {
    "Зеленый банк": "bg-green-500",
    "Красный банк": "bg-red-500",
    "Желтый банк": "bg-yellow-500",
    "Синий банк": "bg-blue-500",
  };

  const getBankColor = (name: string, custom?: string) => {
    return custom || bankColors[name] || "bg-gray-500";
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            Карты
          </div>
          <p className="text-2xl font-bold text-foreground">{cards.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Percent className="w-3.5 h-3.5" />
            Категорий
          </div>
          <p className="text-2xl font-bold text-foreground">{allCategories.length}</p>
        </div>
        <div className="hidden md:block bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 col-span-1">
          <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Макс. кешбек
          </div>
          <p className="text-2xl font-bold text-white">
            {allCategories.length > 0 ? Math.max(...allCategories.map((c) => c.percent)) : 0}%
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("dashboard.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
        <select
          value={filterBank}
          onChange={(e) => setFilterBank(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {banks.map((b) => (
            <option key={b} value={b}>
              {b === "all" ? "Все банки" : b}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSortBy(sortBy === "percent" ? "name" : "percent")}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground transition text-sm flex items-center gap-1.5"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{sortBy === "percent" ? "По %" : "По имени"}</span>
        </button>
      </div>

      {/* Categories horizontal scroll row */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">{t("dashboard.noCategories")}</p>
          <p className="text-muted-foreground text-sm mt-1">Добавьте карту в разделе «Мои карты»</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-3 pb-2 md:flex-wrap" style={{ minWidth: "max-content" }} role="list">
            {filtered.map((cat) => (
              <div
                key={cat.id}
                role="listitem"
                className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 hover:border-primary/40 transition-colors shrink-0 md:shrink md:w-auto"
              >
                <div className={`w-10 h-10 ${getBankColor(cat.card.bank_name, cat.card.bank_color)} rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                  {cat.percent}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{cat.card.bank_name} · {cat.card.name}</p>
                </div>
                <div className="ml-auto pl-2">
                  <span className="text-lg font-bold text-blue-600">{cat.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Need to import CreditCard
function CreditCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
