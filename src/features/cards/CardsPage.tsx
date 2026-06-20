import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../shared/lib/supabase";
import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { getCategoryIcon } from "../../shared/lib/categoryIcons";
import { BANK_PRESETS, CUSTOM_BANK_VALUE, fallbackBankColor, getBankPreset } from "../../shared/lib/banks";
import GlassSelect from "../../shared/components/GlassSelect";
import BankAvatar from "../../shared/components/BankAvatar";
import SwipeToDelete from "../../shared/components/SwipeToDelete";
import { Plus, ChevronLeft, ChevronRight, CreditCard, Check, CirclePlus, Banknote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Card } from "../../shared/types";

type EditableCategory = { name: string; percent: number };
type View = "list" | "add" | "edit";

const inputClass =
  "w-full px-4 py-3.5 rounded-2xl border border-border bg-white/40 dark:bg-white/[0.06] backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition text-[15px]";

function formatLastUpdated(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const latest = dates.reduce((a, b) => (a > b ? a : b));
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(latest));
}

export default function CardsPage() {
  const { user } = useAuth();
  const { t } = useApp();
  const qc = useQueryClient();

  const [view, setView] = useState<View>("list");

  // ---- form state (shared by add + edit) ----
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [formName, setFormName] = useState("");
  const [bankSelection, setBankSelection] = useState<string>("");
  const [customBankName, setCustomBankName] = useState("");
  const [categories, setCategories] = useState<EditableCategory[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [confirmDeleteCard, setConfirmDeleteCard] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["cards", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*, cashback_categories(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Card[];
    },
    enabled: !!user,
  });

  const resolvedBank = useMemo(() => {
    if (bankSelection === CUSTOM_BANK_VALUE) {
      const name = customBankName.trim();
      return { name, color: name ? fallbackBankColor(name) : "" };
    }
    const preset = getBankPreset(bankSelection);
    return { name: bankSelection, color: preset?.color || "" };
  }, [bankSelection, customBankName]);

  const bankOptions = useMemo(
    () => [
      ...BANK_PRESETS.map((b) => ({
        value: b.name,
        label: b.name,
        left: <BankAvatar name={b.name} color={b.color} letter={b.letter} size={28} />,
      })),
      { value: CUSTOM_BANK_VALUE, label: "Другой банк...", left: <Banknote className="w-5 h-5 text-muted-foreground shrink-0" /> },
    ],
    []
  );

  const resetForm = () => {
    setSelectedCard(null);
    setFormName("");
    setBankSelection("");
    setCustomBankName("");
    setCategories([]);
    setEditingIndex(null);
    setConfirmDeleteCard(false);
  };

  const openAdd = () => {
    resetForm();
    setView("add");
  };

  const openEdit = (card: Card) => {
    setSelectedCard(card);
    setFormName(card.name);
    const preset = BANK_PRESETS.find((b) => b.name === card.bank_name);
    if (preset) {
      setBankSelection(preset.name);
      setCustomBankName("");
    } else {
      setBankSelection(CUSTOM_BANK_VALUE);
      setCustomBankName(card.bank_name);
    }
    setCategories((card.cashback_categories || []).map((c) => ({ name: c.name, percent: c.percent })));
    setEditingIndex(null);
    setConfirmDeleteCard(false);
    setView("edit");
  };

  const goBack = () => {
    setView("list");
    resetForm();
  };

  // ---- mutations ----

  const createCard = useMutation({
    mutationFn: async () => {
      const { data: card, error } = await supabase
        .from("cards")
        .insert({ user_id: user!.id, name: formName.trim(), bank_name: resolvedBank.name, bank_color: resolvedBank.color || "#86177D" })
        .select()
        .single();
      if (error) throw error;
      const cleaned = categories.filter((c) => c.name.trim());
      if (cleaned.length > 0) {
        const { error: catError } = await supabase
          .from("cashback_categories")
          .insert(cleaned.map((c) => ({ card_id: card.id, name: c.name.trim(), percent: c.percent })));
        if (catError) throw catError;
      }
      return card;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Карта добавлена!");
      goBack();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCard = useMutation({
    mutationFn: async () => {
      if (!selectedCard) return;
      const { error } = await supabase
        .from("cards")
        .update({ name: formName.trim(), bank_name: resolvedBank.name, bank_color: resolvedBank.color || selectedCard.bank_color })
        .eq("id", selectedCard.id);
      if (error) throw error;

      await supabase.from("cashback_categories").delete().eq("card_id", selectedCard.id);
      const cleaned = categories.filter((c) => c.name.trim());
      if (cleaned.length > 0) {
        const { error: catError } = await supabase
          .from("cashback_categories")
          .insert(cleaned.map((c) => ({ card_id: selectedCard.id, name: c.name.trim(), percent: c.percent })));
        if (catError) throw catError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      toast.success("Карта сохранена!");
      goBack();
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
      toast.success("Карта удалена");
      if (view === "edit") goBack();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ---- category row helpers ----

  const addBlankCategory = () => {
    setCategories((prev) => {
      const next = [...prev, { name: "", percent: 1 }];
      setEditingIndex(next.length - 1);
      return next;
    });
  };

  const updateCategoryAt = (idx: number, patch: Partial<EditableCategory>) => {
    setCategories((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const removeCategoryAt = (idx: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== idx));
    setEditingIndex(null);
  };

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setOcrBusy(true);
    setOcrStatus("Подготавливаем изображение...");
    try {
      const { recognizeCategoriesFromImage } = await import("../../shared/lib/ocr");
      const found = await recognizeCategoriesFromImage(file, (status, progress) => {
        const labels: Record<string, string> = {
          "loading tesseract core": "Загружаем модель...",
          "initializing tesseract": "Инициализация...",
          "loading language traineddata": "Загружаем языковые данные...",
          "initializing api": "Подготовка...",
          "recognizing text": "Распознаём текст...",
        };
        setOcrStatus(`${labels[status] || status} ${Math.round(progress * 100)}%`);
      });
      if (found.length === 0) {
        toast.error("Не удалось найти категории на скриншоте. Попробуйте более чёткое фото.");
      } else {
        setCategories((prev) => [...prev, ...found]);
        toast.success(`Найдено категорий: ${found.length}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось распознать скриншот");
    } finally {
      setOcrBusy(false);
      setOcrStatus("");
    }
  };

  const lastUpdated = useMemo(
    () => (selectedCard ? formatLastUpdated((selectedCard.cashback_categories || []).map((c) => c.created_at)) : null),
    [selectedCard]
  );

  const canSave = formName.trim().length > 0 && resolvedBank.name.trim().length > 0;

  // =========================================================
  // LIST VIEW
  // =========================================================
  if (view === "list") {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t("cards.title")}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{cards.length} карт</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-2xl transition shadow-lg shadow-primary/25 hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            {t("cards.add")}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/20 dark:bg-white/[0.06] animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20">
            <div className="glass w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">{t("cards.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <SwipeToDelete
                key={card.id}
                direction="right"
                deleteLabel={t("cards.delete")}
                onDelete={() => deleteCard.mutate(card.id)}
                className="rounded-3xl group"
              >
                <div className="glass rounded-3xl relative">
                  <button onClick={() => openEdit(card)} className="w-full flex items-center gap-4 p-4 text-left">
                    <BankAvatar name={card.bank_name} color={card.bank_color} size={48} square className="shadow-md" />
                    <div className="flex-1 min-w-0 md:pr-16">
                      <p className="font-medium text-foreground truncate">{card.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{card.bank_name}</p>
                      <p className="text-xs text-muted-foreground">{card.cashback_categories?.length || 0} категорий</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 md:hidden" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCard.mutate(card.id);
                    }}
                    className="hidden md:group-hover:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1.5 px-3 py-1.5 rounded-xl text-destructive hover:bg-destructive/10 text-xs font-medium transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("cards.delete")}
                  </button>
                </div>
              </SwipeToDelete>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // ADD / EDIT VIEW (full page, bottom nav stays visible)
  // =========================================================
  return (
    <div className="max-w-2xl mx-auto pb-16">
      <div className="flex items-center gap-3 px-4 md:px-6 pt-4 md:pt-6 pb-4">
        <button
          onClick={goBack}
          aria-label={t("common.back")}
          className="w-9 h-9 rounded-full glass flex items-center justify-center text-foreground shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          {view === "add" ? "Добавление карты" : "Редактирование карты"}
        </h1>
      </div>

      <div className="px-4 md:px-6 space-y-5">
        {/* Card name */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1.5 px-1">{t("cards.name")}</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Моя карта"
            className={inputClass}
          />
        </div>

        {/* Bank picker */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1.5 px-1">{t("cards.bank")}</label>
          <GlassSelect
            value={bankSelection}
            onChange={setBankSelection}
            options={bankOptions}
            placeholder="Выберите банк"
            triggerLeft={<Banknote className="w-5 h-5 text-muted-foreground shrink-0" />}
          />
          {bankSelection === CUSTOM_BANK_VALUE && (
            <input
              type="text"
              value={customBankName}
              onChange={(e) => setCustomBankName(e.target.value)}
              placeholder="Название банка"
              className={inputClass + " mt-2.5"}
            />
          )}
        </div>

        {/* Screenshot upload */}
        <div>
          <label className="text-sm text-muted-foreground block mb-1.5 px-1">{t("cards.categories")}</label>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={ocrBusy}
            className="w-full text-left px-4 py-3.5 rounded-2xl glass text-primary text-[15px] font-medium disabled:opacity-60 transition"
          >
            {ocrBusy ? ocrStatus || "Обрабатываем..." : "Выбрать скриншоты"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
        </div>

        {/* Categories list */}
        <div className="rounded-3xl glass overflow-hidden">
          {categories.map((cat, idx) => {
            const Icon = getCategoryIcon(cat.name || "");
            return (
              <div key={idx} className={idx > 0 ? "border-t border-border" : ""}>
                <SwipeToDelete direction="left" disabled={editingIndex === idx} onDelete={() => removeCategoryAt(idx)} className="group">
                  {editingIndex === idx ? (
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <input
                        autoFocus
                        type="text"
                        value={cat.name}
                        onChange={(e) => updateCategoryAt(idx, { name: e.target.value })}
                        placeholder={t("cards.categoryName")}
                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-white/40 dark:bg-white/[0.06] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={cat.percent}
                        onChange={(e) => updateCategoryAt(idx, { percent: Number(e.target.value) })}
                        placeholder="%"
                        className="w-16 px-2 py-2 rounded-xl border border-border bg-white/40 dark:bg-white/[0.06] text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="w-9 h-9 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button onClick={() => setEditingIndex(idx)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0 md:pr-9">
                          <p className="font-medium text-foreground text-sm truncate">{cat.name || "Без названия"}</p>
                          <p className="text-xs text-muted-foreground">Кэшбек {cat.percent}%</p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCategoryAt(idx);
                        }}
                        aria-label={t("cards.delete")}
                        className="hidden md:group-hover:flex absolute right-3 top-1/2 -translate-y-1/2 items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </SwipeToDelete>
              </div>
            );
          })}

          <div className={categories.length > 0 ? "border-t border-border" : ""}>
            <button onClick={addBlankCategory} className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-secondary-dark dark:text-secondary">
              <CirclePlus className="w-5 h-5 shrink-0" />
              <span className="font-medium text-sm">{t("cards.addCategory")}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground px-1 leading-relaxed">
          Вы можете добавить категории вручную или выбрать снимок списка категорий, для автоматического добавления.
          <br />
          Свайпните категорию влево, чтобы удалить.
          <br />
          Нажмите на категорию, чтобы редактировать.
          {lastUpdated && (
            <>
              <br />
              Последняя дата обновления категорий: {lastUpdated}
            </>
          )}
        </p>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => (view === "add" ? createCard.mutate() : updateCard.mutate())}
            disabled={!canSave || createCard.isPending || updateCard.isPending}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-[15px] font-semibold transition disabled:opacity-50 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            {(createCard.isPending || updateCard.isPending) ? "Сохраняем..." : "Сохранить карту"}
          </button>

          {view === "edit" && selectedCard && (
            <button
              onClick={() => {
                if (confirmDeleteCard) deleteCard.mutate(selectedCard.id);
                else setConfirmDeleteCard(true);
              }}
              disabled={deleteCard.isPending}
              className="w-full py-3.5 bg-destructive/10 text-destructive rounded-2xl text-[15px] font-semibold transition disabled:opacity-50 hover:bg-destructive/15"
            >
              {deleteCard.isPending ? "Удаляем..." : confirmDeleteCard ? "Нажмите ещё раз для подтверждения" : "Удалить карту"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
