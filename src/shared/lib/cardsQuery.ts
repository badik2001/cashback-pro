import { supabase } from "./supabase";
import type { Card } from "../types";

/** Single source of truth for the cache key — CardsPage, DashboardPage and
 *  the post-login prefetch in App.tsx must all use this exact key, or they
 *  end up with separate cache entries and lose the benefit of sharing data. */
export const cardsQueryKey = (userId?: string) => ["cards", userId] as const;

export async function fetchCards(userId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from("cards")
    .select("*, cashback_categories(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Card[];
}