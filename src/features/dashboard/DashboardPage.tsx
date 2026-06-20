import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../shared/lib/supabase";
import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { Search, TrendingUp, Percent, CreditCard, ArrowDownAZ, ArrowDown01 } from "lucide-react";
import GlassSelect from "../../shared/components/GlassSelect";
import BankAvatar from "../../shared/components/BankAvatar";
import SegmentedControl from "../../shared/components/SegmentedControl";
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
      const { data } = await supabase.from("cards").select("*, cashback_categories(*)").eq("user_id", user!.id);
      return (data || []) as Card[];
    },
    enabled: !!user,
  });

  const allCategories = useMemo<CategoryWithCard[]>(() => {
    return cards.flatMap((card) => (card.cashback_categories || []).map((cat) => ({ ...cat, card })));
  }, [cards]);

  const bankOptions = useMemo(() => {
    const unique = Array.from(new Map(cards.map((c) => [c.bank_name, c.bank_color])).entries());
    return [
      { value: "all", label: "Все банки" },
      ...unique.map(([name, color]) => ({ value: name, label: name, left: <BankAvatar name={name} color={color} size={22} /> })),
    ];
  }, [cards]);

  const filtered = useMemo(() => {
    return allCategories
      .filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchBank = filterBank === "all" || c.card.bank_name === filterBank;
        return matchSearch && matchBank;
      })
      .sort((a, b) => (sortBy === "percent" ? b.percent - a.percent : a.name.localeCompare(b.name)));
  }, [allCategories, search, filterBank, sortBy]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats — glass tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-3xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Карты
          </div>
          <p className="text-2xl font-semibold text-foreground">{cards.length}</p>
        </div>
        <div className="glass rounded-3xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5">
            <Percent className="w-3.5 h-3.5" />
            Категорий
          </div>
          <p className="text-2xl font-semibold text-foreground">{allCategories.length}</p>
        </div>
        <div className="hidden md:block glass-strong glass-sheen rounded-3xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1.5 relative z-[2]">
            <TrendingUp className="w-3.5 h-3.5" />
            Макс. кешбек
          </div>
          <p className="text-2xl font-semibold text-primary relative z-[2]">
            {allCategories.length > 0 ? Math.max(...allCategories.map((c) => c.percent)) : 0}%
          </p>
        </div>
      </div>

      {/* Search + Filter + Sort */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("dashboard.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-border bg-white/40 dark:bg-white/[0.06] backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm transition"
          />
        </div>
        <GlassSelect value={filterBank} onChange={setFilterBank} options={bankOptions} className="sm:w-48" />
        <SegmentedControl
          value={sortBy}
          onChange={(v) => setSortBy(v as "percent" | "name")}
          options={[
            { value: "percent", label: "%", icon: <ArrowDown01 className="w-3.5 h-3.5" /> },
            { value: "name", label: "Имя", icon: <ArrowDownAZ className="w-3.5 h-3.5" /> },
          ]}
          className="sm:w-40"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-white/20 dark:bg-white/[0.06] animate-pulse rounded-3xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="glass w-16 h-16 rounded-3xl flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">{t("dashboard.noCategories")}</p>
          <p className="text-muted-foreground text-sm mt-1">Добавьте карту в разделе «Мои карты»</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex flex-col gap-3 pb-2 md:flex-wrap" style={{ minWidth: "max-content" }} role="list">
            {filtered.map((cat) => (
              <div
                key={cat.id}
                role="listitem"
                className="glass flex items-center gap-3 rounded-3xl px-4 py-3 hover:scale-[1.02] transition-transform shrink-0 md:shrink md:w-auto"
              >
                <BankAvatar name={cat.card.bank_name} color={cat.card.bank_color} size={40} square />
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{cat.card.bank_name} · {cat.card.name}</p>
                </div>
                <div className="ml-auto pl-2">
                  <span className="text-lg font-semibold text-primary">{cat.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
