import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../shared/lib/supabase";
import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { Plus, Trash2, ChevronRight, CreditCard, X, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import type { Card } from "../../shared/types";

const DEFAULT_BANKS = [
  { name: "Зеленый банк", color: "bg-green-500" },
  { name: "Красный банк", color: "bg-red-500" },
  { name: "Желтый банк", color: "bg-yellow-500" },
  { name: "Синий банк", color: "bg-blue-500" },
];

export default function CardsPage() {
  const { user } = useAuth();
  const { t } = useApp();
  const qc = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [newCardBank, setNewCardBank] = useState("");
  const [swipedId, setSwipedId] = useState<string | null>(null);
  
  const [editCategories, setEditCategories] = useState<{ name: string; percent: number }[]>([]);
  const [processingOcr, setProcessingOcr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["cards", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cards")
        .select("*, cashback_categories(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      return (data || []) as Card[];
    },
    enabled: !!user,
  });

  const addCard = useMutation({
    mutationFn: async ({ name, bank }: { name: string; bank: string }) => {
      const colorMap: Record<string, string> = {
        "Зеленый банк": "#22c55e",
        "Красный банк": "#ef4444",
        "Желтый банк": "#eab308",
        "Синий банк": "#3b82f6",
      };
      const { data, error } = await supabase.from("cards").insert({
        user_id: user!.id,
        name,
        bank_name: bank,
        bank_color: colorMap[bank] || "#6366f1",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      setShowAdd(false);
      setNewCardName("");
      setNewCardBank("");
      toast.success("Карта добавлена!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      setSwipedId(null);
      toast.success("Карта удалена");
    },
  });

  const saveCategories = useMutation({
    mutationFn: async ({ cardId, categories }: { cardId: string; categories: { name: string; percent: number }[] }) => {
      await supabase.from("cashback_categories").delete().eq("card_id", cardId);
      if (categories.length > 0) {
        const { error } = await supabase.from("cashback_categories").insert(
          categories.map((c) => ({ card_id: cardId, name: c.name, percent: c.percent }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      setSelectedCard(null);
      toast.success("Категории сохранены!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleOpenCard = (card: Card) => {
    setSelectedCard(card);
    setEditCategories(card.cashback_categories?.map((c) => ({ name: c.name, percent: c.percent })) || []);

  };

  // Simulate OCR (frontend-only, Tesseract would run server-side or via worker)
  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingOcr(true);
    toast.info("Обрабатываем скриншот...");
    // Simulate OCR processing delay
    await new Promise((r) => setTimeout(r, 1500));
    // In real app: use Tesseract.js worker
    // Mock result:
    const mock = [
      { name: "Супермаркеты", percent: 5 },
      { name: "АЗС", percent: 3 },
      { name: "Рестораны", percent: 2 },
    ];

    setEditCategories((prev) => [...prev, ...mock]);
    setProcessingOcr(false);
    toast.success("Категории извлечены!");
  };

  const bankColorClass: Record<string, string> = {
    "#22c55e": "bg-green-500",
    "#ef4444": "bg-red-500",
    "#eab308": "bg-yellow-500",
    "#3b82f6": "bg-blue-500",
  };

  const getBgClass = (color?: string) => bankColorClass[color || ""] || "bg-indigo-500";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("cards.title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{cards.length} карт</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t("cards.add")}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">{t("cards.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-2xl"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (diff > 60) setSwipedId(card.id);
                else if (diff < -30) setSwipedId(null);
              }}
            >
              {/* Delete button revealed on swipe */}
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  onClick={() => deleteCard.mutate(card.id)}
                  className="h-full px-6 bg-red-500 text-white flex items-center gap-2 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("cards.delete")}
                </button>
              </div>
              {/* Card item */}
              <div
                className={`relative bg-card border border-border rounded-2xl transition-transform duration-200 ${swipedId === card.id ? "-translate-x-24" : "translate-x-0"}`}
              >
                <button
                  onClick={() => handleOpenCard(card)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div className={`w-12 h-12 ${getBgClass(card.bank_color)} rounded-xl flex items-center justify-center shrink-0`}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{card.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{card.bank_name}</p>
                    <p className="text-xs text-muted-foreground">{card.cashback_categories?.length || 0} категорий</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
                {/* Desktop delete */}
                <button
                  onClick={() => deleteCard.mutate(card.id)}
                  className="absolute right-14 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{t("cards.add")}</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("cards.name")}</label>
                <input
                  type="text"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="Моя карта"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("cards.bank")}</label>
                <select
                  value={newCardBank}
                  onChange={(e) => setNewCardBank(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Выберите банк...</option>
                  {DEFAULT_BANKS.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                  <option value="Другой">Другой банк</option>
                </select>
              </div>
              {newCardBank === "Другой" && (
                <input
                  type="text"
                  placeholder="Название банка"
                  onChange={(e) => setNewCardBank(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition">
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => newCardName && newCardBank && addCard.mutate({ name: newCardName, bank: newCardBank })}
                  disabled={!newCardName || !newCardBank || addCard.isPending}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  {addCard.isPending ? "..." : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-semibold text-lg">{selectedCard.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedCard.bank_name}</p>
              </div>
              <button onClick={() => setSelectedCard(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Upload screenshot */}
              <div>
                <p className="text-sm font-medium mb-2">{t("cards.uploadScreenshot")}</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={processingOcr}
                  className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 flex flex-col items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                >
                  <Upload className="w-6 h-6" />
                  {processingOcr ? "Обрабатываем..." : "Загрузить скриншот"}
                  <span className="text-xs">Автоматически извлечём категории кешбека</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">{t("cards.categories")}</p>
                  <button
                    onClick={() => setEditCategories((prev) => [...prev, { name: "", percent: 0 }])}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("cards.addCategory")}
                  </button>
                </div>
                <div className="space-y-2">
                  {editCategories.map((cat, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => {
                          const next = [...editCategories];
                          next[idx].name = e.target.value;
                          setEditCategories(next);
                        }}
                        placeholder={t("cards.categoryName")}
                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <input
                        type="number"
                        value={cat.percent}
                        min={0}
                        max={100}
                        onChange={(e) => {
                          const next = [...editCategories];
                          next[idx].percent = Number(e.target.value);
                          setEditCategories(next);
                        }}
                        placeholder="%"
                        className="w-16 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        onClick={() => setEditCategories((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {editCategories.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Нет категорий. Добавьте или загрузите скриншот.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={() => setSelectedCard(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition">
                {t("common.cancel")}
              </button>
              <button
                onClick={() => saveCategories.mutate({ cardId: selectedCard.id, categories: editCategories.filter((c) => c.name) })}
                disabled={saveCategories.isPending}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {saveCategories.isPending ? "..." : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
